import { translateSessionText } from "./session-terms.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const line = "4 × 50 m crawl, repos 20 s";
assert(translateSessionText(line, "fr") === line, "fr inchangé");
assert(translateSessionText(line, "en") === "4 × 50 m freestyle, rest 20 s", "en");
assert(translateSessionText(line, "de") === "4 × 50 m Kraul, Pause 20 s", "de");
assert(translateSessionText(line, "es") === "4 × 50 m crol, descanso 20 s", "es");
assert(translateSessionText(line, "it") === "4 × 50 m stile libero, recupero 20 s", "it");
assert(translateSessionText(line, "pt") === "4 × 50 m crol, descanso 20 s", "pt");
assert(translateSessionText(line, "pt-BR") === "4 × 50 m nado livre, descanso 20 s", "pt-BR");
assert(translateSessionText(line, "nl") === "4 × 50 m vrije slag, rust 20 s", "nl");
assert(translateSessionText(line, "ja") === "4 × 50 m クロール, レスト 20 s", "ja");
assert(translateSessionText(line, "sv") === "4 × 50 m frisim, vila 20 s", "sv");
assert(translateSessionText(line, "da") === "4 × 50 m crawl, pause 20 s", "da");
assert(translateSessionText(line, "nb") === "4 × 50 m crawl, pause 20 s", "nb");
assert(translateSessionText(line, "fi") === "4 × 50 m vapaauinti, lepo 20 s", "fi");

assert(translateSessionText("Échauffement", "en") === "Warm-up", "titre");
assert(translateSessionText("Retour au calme", "de") === "Ausschwimmen", "cool de");
assert(translateSessionText("CRAWL", "en") === "FREESTYLE", "pastille");
assert(translateSessionText("4 NAGES", "es") === "ESTILOS", "4 nages");
assert(translateSessionText("dos crawlé", "en") === "back crawl", "dos crawlé");
assert(translateSessionText("grand chien", "en") === "Tarzan drill", "drill");
assert(!translateSessionText("dossard", "en").includes("backstroke"), "dos pas dans dossard");

console.log("session-terms ok");
