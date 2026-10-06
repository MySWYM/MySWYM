/**
 * Applique le dictionnaire français → langue active à tout le texte affiché.
 * Le code écrit encore du français à certains endroits : on le traduit à l'affichage,
 * dans le DOM, les attributs lisibles, le titre, le partage et le presse-papiers.
 * En français, rien n'est modifié.
 */
import i18n from "./index.js";
import { TARGET_LANGS } from "./fr-dict/langs.js";

const DICT_LOADERS = import.meta.glob("./fr-dict/*.json");
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "SVG"]);
const HAS_LETTER = /\p{L}/u;

let rawDict = null;
let loading = null;
const compiled = new Map();
let activeLang = "fr";
let observer = null;

/** Texte source (français) et dernière sortie écrite, par nœud texte. */
const textState = new WeakMap();
/** Idem par élément et attribut. */
const attrState = new WeakMap();

function norm(s) {
  return String(s).replace(/\s+/g, " ").trim();
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compile(lng) {
  if (compiled.has(lng)) return compiled.get(lng);
  const exact = new Map();
  const patterns = new Map();
  for (const [fr, row] of Object.entries(rawDict || {})) {
    const out = row?.[lng];
    if (!out) continue;
    if (!/\{\{\d+\}\}/.test(fr)) {
      exact.set(fr, out);
      continue;
    }
    const order = [];
    const source = fr
      .split(/(\{\{\d+\}\})/)
      .map((part) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        if (m) {
          order.push(m[1]);
          return "(.*?)";
        }
        return escapeRe(part);
      })
      .join("");
    const head = fr.split("{{")[0].slice(0, 3).toLowerCase();
    if (!patterns.has(head)) patterns.set(head, []);
    patterns.get(head).push({ re: new RegExp(`^${source}$`, "s"), order, out });
  }
  const entry = { exact, patterns };
  compiled.set(lng, entry);
  return entry;
}

function translateCore(core, lng, depth = 0) {
  const { exact, patterns } = compile(lng);
  const hit = exact.get(core);
  if (hit) return hit;
  if (depth > 1) return null;
  const buckets = [patterns.get(core.slice(0, 3).toLowerCase()), patterns.get("")];
  for (const list of buckets) {
    if (!list) continue;
    for (const p of list) {
      const m = core.match(p.re);
      if (!m) continue;
      let out = p.out;
      p.order.forEach((n, i) => {
        const val = m[i + 1];
        const inner = translateCore(norm(val), lng, depth + 1);
        out = out.split(`{{${n}}}`).join(inner || val);
      });
      return out;
    }
  }
  return null;
}

/** Traduit une chaîne affichée. Renvoie la chaîne d'origine si rien ne correspond. */
export function translateDisplayText(text, lng = activeLang) {
  if (!text || lng === "fr" || !rawDict || !TARGET_LANGS.includes(lng)) return text;
  const s = String(text);
  if (!HAS_LETTER.test(s)) return s;
  const lead = s.match(/^\s*/)[0];
  const trail = s.match(/\s*$/)[0];
  const core = norm(s);
  if (!core) return s;
  const out = translateCore(core, lng);
  return out ? `${lead}${out}${trail}` : s;
}

/** Texte multi-lignes (partage, presse-papiers, notifications). */
export function translateMultiline(text, lng = activeLang) {
  if (!text || lng === "fr" || !rawDict) return text;
  const whole = translateDisplayText(text, lng);
  if (whole !== text) return whole;
  return String(text)
    .split("\n")
    .map((line) => translateDisplayText(line, lng))
    .join("\n");
}

function skipElement(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName.toUpperCase())) return true;
    if (e.isContentEditable) return true;
    if (e.getAttribute("translate") === "no" || e.hasAttribute("data-no-translate")) return true;
  }
  return false;
}

function applyText(node) {
  const current = node.nodeValue;
  let state = textState.get(node);
  if (!state || current !== state.out) {
    state = { src: current, out: current };
  }
  const next = activeLang === "fr" ? state.src : translateDisplayText(state.src);
  state.out = next;
  textState.set(node, state);
  if (next !== current) node.nodeValue = next;
}

function applyAttr(el, name) {
  const current = el.getAttribute(name);
  if (current == null) return;
  let map = attrState.get(el);
  if (!map) {
    map = {};
    attrState.set(el, map);
  }
  let state = map[name];
  if (!state || current !== state.out) state = { src: current, out: current };
  const next = activeLang === "fr" ? state.src : translateDisplayText(state.src);
  state.out = next;
  map[name] = state;
  if (next !== current) el.setAttribute(name, next);
}

function applyTree(root) {
  if (!root) return;
  if (root.nodeType === 3) {
    if (root.parentElement && !skipElement(root.parentElement)) applyText(root);
    return;
  }
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  const start = root.nodeType === 9 ? root.documentElement : root;
  if (!start || (start.nodeType === 1 && skipElement(start))) return;
  if (start.nodeType === 1) ATTRS.forEach((a) => start.hasAttribute(a) && applyAttr(start, a));
  const walker = (start.ownerDocument || document).createTreeWalker(start, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) return SKIP_TAGS.has(n.tagName.toUpperCase()) || n.getAttribute("translate") === "no" || n.hasAttribute("data-no-translate") || n.isContentEditable ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 3) applyText(n);
    else ATTRS.forEach((a) => n.hasAttribute(a) && applyAttr(n, a));
  }
}

/** Traduit un arbre hors écran (HTML d’impression, fenêtre séparée). */
export function translateDomTree(root) {
  if (!root || activeLang === "fr" || !rawDict) return;
  applyTree(root);
}

function onMutations(records) {
  for (const r of records) {
    if (r.type === "characterData") {
      if (r.target.parentElement && !skipElement(r.target.parentElement)) applyText(r.target);
    } else if (r.type === "attributes") {
      if (!skipElement(r.target)) applyAttr(r.target, r.attributeName);
    } else {
      r.addedNodes.forEach((n) => applyTree(n));
    }
  }
}

function startObserver() {
  if (observer || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver(onMutations);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
}

function patchSinks() {
  if (typeof navigator === "undefined" || navigator.__msTranslatePatched) return;
  try {
    patchSinksUnsafe();
  } catch {
    /* navigateur qui refuse la surcharge : le DOM reste traduit */
  }
}

function patchSinksUnsafe() {
  navigator.__msTranslatePatched = true;
  if (typeof navigator.share === "function") {
    const share = navigator.share.bind(navigator);
    navigator.share = (data = {}) => share({
      ...data,
      ...(data.title ? { title: translateMultiline(data.title) } : {}),
      ...(data.text ? { text: translateMultiline(data.text) } : {}),
    });
  }
  if (navigator.clipboard?.writeText) {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text) => write(translateMultiline(text));
  }
  // Images de partage (canvas) : le texte dessiné ne passe pas par le DOM.
  if (typeof CanvasRenderingContext2D !== "undefined") {
    const proto = CanvasRenderingContext2D.prototype;
    for (const fn of ["fillText", "strokeText", "measureText"]) {
      const orig = proto[fn];
      if (typeof orig === "function") {
        proto[fn] = function patched(text, ...rest) {
          return orig.call(this, translateDisplayText(String(text ?? "")), ...rest);
        };
      }
    }
  }
  for (const fn of ["alert", "confirm", "prompt"]) {
    const orig = window[fn]?.bind(window);
    if (orig) window[fn] = (msg, ...rest) => orig(translateMultiline(msg), ...rest);
  }
}

async function loadDict() {
  if (rawDict) return rawDict;
  if (!loading) {
    loading = Promise.all(Object.values(DICT_LOADERS).map((load) => load()))
      .then((mods) => {
        const merged = {};
        mods.forEach((m) => Object.assign(merged, m.default ?? m));
        rawDict = merged;
        compiled.clear();
        return rawDict;
      });
  }
  return loading;
}

async function setLanguage(lng) {
  activeLang = lng;
  if (lng !== "fr") await loadDict();
  if (activeLang !== lng) return;
  if (typeof document !== "undefined") applyTree(document);
}

/** À lancer une fois au démarrage, avant le premier rendu. */
export async function installDisplayTranslation() {
  if (typeof document === "undefined") return;
  patchSinks();
  startObserver();
  i18n.on("languageChanged", (lng) => { void setLanguage(lng); });
  await setLanguage(i18n.language);
}
