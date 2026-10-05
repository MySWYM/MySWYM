/**
 * Liste le français visible écrit en dur dans src/ (hors moteur de séances, blog, admin).
 * Usage : node scripts/i18n-scan.mjs [--json] [--files]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default || traverseModule;
const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

export const IGNORE = [
  /\.test\.(js|jsx|ts|tsx)$/,
  /^src\/i18n\//,
  /^src\/lib\/sports-engine\//,
  /^src\/lib\/swim-banks\//,
  /^src\/lib\/natation-sheet\//,
  /^src\/lib\/swim-session-generator\.js$/,
  /^src\/(Blog|BlogPost|HomeBlogCarousel)\.jsx$/,
  /^src\/blogData\.js$/,
  /^src\/admin\//,
  /^src\/Arthur[A-Za-z]*Admin[A-Za-z]*\.jsx$/,
  /^src\/stitch_/,
  /^src\/dev\//,
  /^src\/posts\.js$/,
  /^src\/content\/case-studies\.js$/,
  /^src\/lib\/arthur-composer\/compose-draft\.js$/,
  /^src\/lib\/arthur-admin-auth\.js$/,
];

const ACCENT = /[àâäéèêëïîôùûüçœÀÂÄÉÈÊËÏÎÔÙÛÜÇŒ]/;
const WORDS = /\b(connexion|retour|annuler|enregistrer|historique|paramètres|séance|séances|nager|natation|bassin|matériel|objectif|niveau|semaine|semaines|aujourd'hui|continuer|réessayer|fermer|valider|ton|ta|tes|pour|avec|dans|sur|une|des|les|est|pas)\b/i;

export function looksFrench(s) {
  const text = String(s || "").replace(/\s+/g, " ").trim();
  if (text.length < 4) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(text)) return false;
  if (/^[a-z0-9_.:\-/]+$/i.test(text) && !text.includes(" ")) {
    return ACCENT.test(text);
  }
  if (/^(https?:|\/|\.\/|#|--|data:)/.test(text)) return false;
  return ACCENT.test(text) || (text.includes(" ") && WORDS.test(text));
}

const NON_VISIBLE_ATTRS = new Set(["className", "style", "key", "id", "href", "src", "type", "name", "role", "rel", "target", "htmlFor", "autoComplete", "inputMode", "data-testid"]);

function isTranslationCall(node) {
  if (!node || node.type !== "CallExpression") return false;
  const c = node.callee;
  if (c.type === "Identifier") return ["t", "ta", "appT", "tr"].includes(c.name);
  if (c.type === "MemberExpression" && c.property?.type === "Identifier") {
    return c.property.name === "t" && c.object?.type === "Identifier" && ["i18n", "i18next"].includes(c.object.name);
  }
  return false;
}

function skipPath(path) {
  let p = path.parentPath;
  while (p) {
    const n = p.node;
    if (n.type === "ImportDeclaration" || n.type === "ExportAllDeclaration") return true;
    if (n.type === "CallExpression") {
      if (isTranslationCall(n) && n.arguments[0] && path.findParent((x) => x.node === n.arguments[0])) return true;
      if (isTranslationCall(n) && n.arguments[0] === path.node) return true;
      const c = n.callee;
      if (c.type === "MemberExpression" && c.object?.type === "Identifier" && c.object.name === "console") return true;
      if (c.type === "Identifier" && ["require", "trackEvent", "track", "captureException", "Error"].includes(c.name)) return true;
    }
    if (n.type === "NewExpression" && n.callee?.type === "Identifier" && /Error$/.test(n.callee.name)) return true;
    if (n.type === "ThrowStatement") return true;
    if (n.type === "JSXAttribute") {
      const name = n.name?.name;
      if (NON_VISIBLE_ATTRS.has(name)) return true;
      break;
    }
    if (n.type === "ObjectProperty" && n.key === path.node) return true;
    if (n.type === "BinaryExpression" && ["===", "!==", "==", "!="].includes(n.operator)) return true;
    if (n.type === "SwitchCase" && n.test === path.node) return true;
    if (n.type === "TSLiteralType" || n.type === "TSTypeAnnotation") return true;
    if (n.type === "RegExpLiteral") return true;
    p = p.parentPath;
  }
  return false;
}

export function scanSource(code, file) {
  const out = [];
  let ast;
  try {
    ast = parse(code, { sourceType: "module", plugins: ["jsx", "typescript"], errorRecovery: true });
  } catch (e) {
    return [{ file, line: 0, text: `PARSE ERROR ${e.message}` }];
  }
  const push = (node, text) => {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!looksFrench(clean)) return;
    out.push({ file, line: node.loc?.start.line || 0, text: clean });
  };
  traverse(ast, {
    JSXText(path) { push(path.node, path.node.value); },
    StringLiteral(path) {
      if (path.parent.type === "ObjectProperty" && path.parent.key === path.node) return;
      if (skipPath(path)) return;
      push(path.node, path.node.value);
    },
    TemplateLiteral(path) {
      if (skipPath(path)) return;
      const text = path.node.quasis
        .map((q, i) => (i === 0 ? "" : `{{${i}}}`) + (q.value.cooked ?? ""))
        .join("");
      push(path.node, text);
    },
  });
  return out;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(name)) files.push(full);
  }
  return files;
}

export function scanRepo() {
  const all = [];
  for (const full of walk(SRC)) {
    const rel = relative(ROOT, full);
    if (IGNORE.some((re) => re.test(rel))) continue;
    all.push(...scanSource(readFileSync(full, "utf8"), rel));
  }
  return all;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = scanRepo();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(hits, null, 2));
  } else if (process.argv.includes("--files")) {
    const by = {};
    for (const h of hits) by[h.file] = (by[h.file] || 0) + 1;
    Object.entries(by).sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(String(n).padStart(5), f));
    console.log(String(hits.length).padStart(5), "TOTAL");
  } else {
    for (const h of hits) console.log(`${h.file}:${h.line}  ${h.text}`);
    console.log(`\n${hits.length} chaînes françaises en dur`);
  }
}
