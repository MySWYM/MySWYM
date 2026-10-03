/**
 * Vocabulaire nageur affiché. Le texte stocké reste en français (parsers).
 * Les phrases longues passent avant les mots courts.
 */
import { getSessionDisplayLang } from "./session-display-lang.js";

const LANGS = ["en", "de", "es", "ja", "nl", "it", "pt", "pt-BR", "sv", "da", "nb", "fi"];

function row(fr, t) {
  const out = { fr, frLower: fr.toLowerCase() };
  for (const lng of LANGS) out[lng] = t[lng] || t.en;
  return out;
}

/** Ordre : le plus long d'abord. */
const PHRASES = [
  row("plaquettes doigts", { en: "finger paddles", de: "Fingerpaddles", es: "palas de dedos", ja: "フィンガーパドル", nl: "vingerpaddles", it: "palette da dita", pt: "palas de dedos", "pt-BR": "palmares de dedo", sv: "fingerpaddlar", da: "fingerpadler", nb: "fingerpadler", fi: "sormilapiot" }),
  row("élastique chevilles", { en: "ankle band", de: "Fussgummi", es: "goma de tobillos", ja: "アンクルバンド", nl: "enkelband", it: "elastico alle caviglie", pt: "elástico nos tornozelos", "pt-BR": "elástico nos tornozelos", sv: "ankelband", da: "ankelbånd", nb: "ankelbånd", fi: "nilkkakuminauha" }),
  row("retour au calme", { en: "swim-down", de: "Ausschwimmen", es: "vuelta a la calma", ja: "クールダウン", nl: "uitzwemmen", it: "defaticamento", pt: "retorno à calma", "pt-BR": "volta à calma", sv: "nedvarvning", da: "nedsvømning", nb: "nedsvømming", fi: "loppuverryttely" }),
  row("corps de séance", { en: "main set", de: "Hauptteil", es: "parte principal", ja: "メイン", nl: "hoofdset", it: "parte centrale", pt: "parte principal", "pt-BR": "parte principal", sv: "huvuddel", da: "hoveddel", nb: "hoveddel", fi: "pääosa" }),
  row("départ à la montre", { en: "send-off", de: "Abgang auf die Uhr", es: "salida a reloj", ja: "時計スタート", nl: "vertrek op de klok", it: "partenza a cronometro", pt: "partida ao relógio", "pt-BR": "saída no relógio", sv: "start på klocka", da: "start på uret", nb: "start på klokka", fi: "lähtö kellosta" }),
  row("crawl ou 4 nages", { en: "freestyle or medley", de: "Kraul oder Lagen", es: "crol o estilos", ja: "クロールかメドレー", nl: "vrije slag of wisselslag", it: "stile libero o misti", pt: "crol ou estilos", "pt-BR": "nado livre ou medley", sv: "frisim eller medley", da: "crawl eller medley", nb: "crawl eller medley", fi: "vapaauinti tai sekauinti" }),
  row("crawl ou 4n", { en: "freestyle or medley", de: "Kraul oder Lagen", es: "crol o estilos", ja: "クロールかメドレー", nl: "vrije slag of wisselslag", it: "stile libero o misti", pt: "crol ou estilos", "pt-BR": "nado livre ou medley", sv: "frisim eller medley", da: "crawl eller medley", nb: "crawl eller medley", fi: "vapaauinti tai sekauinti" }),
  row("4 éducatifs (1 / nage)", { en: "4 drills (1 per stroke)", de: "4 Übungen (1 pro Lage)", es: "4 ejercicios (1 por estilo)", ja: "ドリル4つ（泳法ごと）", nl: "4 oefeningen (1 per slag)", it: "4 esercizi (1 per stile)", pt: "4 exercícios (1 por estilo)", "pt-BR": "4 educativos (1 por nado)", sv: "4 övningar (1 per simsätt)", da: "4 øvelser (1 pr. svømmeart)", nb: "4 øvelser (1 per svømmeart)", fi: "4 harjoitusta (1 per laji)" }),
  row("matériel optionnel", { en: "optional gear", de: "optionale Hilfsmittel", es: "material opcional", ja: "任意の道具", nl: "optioneel materiaal", it: "attrezzo facoltativo", pt: "material opcional", "pt-BR": "material opcional", sv: "valfri utrustning", da: "valgfrit udstyr", nb: "valgfritt utstyr", fi: "valinnainen väline" }),
  row("sans matériel", { en: "no gear", de: "ohne Hilfsmittel", es: "sin material", ja: "道具なし", nl: "zonder materiaal", it: "senza attrezzi", pt: "sem material", "pt-BR": "sem material", sv: "utan redskap", da: "uden udstyr", nb: "uten utstyr", fi: "ilman välineitä" }),
  row("dos crawlé", { en: "back crawl", de: "Kraulbeine auf dem Rücken", es: "espalda con batido", ja: "クロールキックの背泳ぎ", nl: "rugcrawl", it: "dorso a crawl", pt: "costas com pernada de crol", "pt-BR": "costas com pernada de crawl", sv: "ryggsim med crawlben", da: "ryg med crawlbenspark", nb: "rygg med crawlbeinspark", fi: "selkäuinti vapaapotkuilla" }),
  row("grand chien", { en: "Tarzan drill", de: "Kopf-oben-Kraul", es: "perrito", ja: "頭上クロール", nl: "hoofd boven water", it: "cagnolino", pt: "crol com a cabeça fora", "pt-BR": "cachorrinho", sv: "huvud över ytan", da: "hoved over vand", nb: "hode over vann", fi: "pää pinnalla" }),
  row("petit chien", { en: "puppy drill", de: "kleines Hundepaddeln", es: "perrito corto", ja: "小さめの頭上クロール", nl: "korte hoofd-boven", it: "cagnolino corto", pt: "cão pequeno", "pt-BR": "cachorrinho curto", sv: "kort huvud över ytan", da: "lille hundepaddle", nb: "kort hundeplog", fi: "pieni pää pinnalla" }),
  row("mise en route", { en: "get-in", de: "Einstieg", es: "puesta en marcha", ja: "入り", nl: "instarten", it: "messa in moto", pt: "entrada", "pt-BR": "entrada", sv: "igångsättning", da: "igangsætning", nb: "igangsetting", fi: "alkuun" }),
  row("pull-buoy", { en: "pull buoy", de: "Pullbuoy", es: "pull buoy", ja: "プルブイ", nl: "pullbuoy", it: "pull buoy", pt: "pull buoy", "pt-BR": "pull buoy", sv: "pullbuoy", da: "pullbuoy", nb: "pullbuoy", fi: "pull buoy" }),
  row("pull buoy", { en: "pull buoy", de: "Pullbuoy", es: "pull buoy", ja: "プルブイ", nl: "pullbuoy", it: "pull buoy", pt: "pull buoy", "pt-BR": "pull buoy", sv: "pullbuoy", da: "pullbuoy", nb: "pullbuoy", fi: "pull buoy" }),
  row("4 nages", { en: "medley", de: "Lagen", es: "estilos", ja: "メドレー", nl: "wisselslag", it: "misti", pt: "estilos", "pt-BR": "medley", sv: "medley", da: "medley", nb: "medley", fi: "sekauinti" }),
  row("échauffement", { en: "warm-up", de: "Einschwimmen", es: "calentamiento", ja: "アップ", nl: "inzwemmen", it: "riscaldamento", pt: "aquecimento", "pt-BR": "aquecimento", sv: "uppvärmning", da: "opvarmning", nb: "oppvarming", fi: "alkuverryttely" }),
  row("éducatifs", { en: "drills", de: "Übungen", es: "ejercicios", ja: "ドリル", nl: "oefeningen", it: "esercizi", pt: "exercícios", "pt-BR": "educativos", sv: "övningar", da: "øvelser", nb: "øvelser", fi: "harjoitukset" }),
  row("éducatif", { en: "drill", de: "Übung", es: "ejercicio", ja: "ドリル", nl: "oefening", it: "esercizio", pt: "exercício", "pt-BR": "educativo", sv: "övning", da: "øvelse", nb: "øvelse", fi: "harjoitus" }),
  row("educatifs", { en: "drills", de: "Übungen", es: "ejercicios", ja: "ドリル", nl: "oefeningen", it: "esercizi", pt: "exercícios", "pt-BR": "educativos", sv: "övningar", da: "øvelser", nb: "øvelser", fi: "harjoitukset" }),
  row("educatif", { en: "drill", de: "Übung", es: "ejercicio", ja: "ドリル", nl: "oefening", it: "esercizio", pt: "exercício", "pt-BR": "educativo", sv: "övning", da: "øvelse", nb: "øvelse", fi: "harjoitus" }),
  row("enchaînement", { en: "pace changes", de: "Tempowechsel", es: "cambios de ritmo", ja: "ペース変化", nl: "tempowissel", it: "variazioni", pt: "mudanças de ritmo", "pt-BR": "variações", sv: "temponbyten", da: "temposkift", nb: "temposkifte", fi: "vauhdinvaihto" }),
  row("enchainement", { en: "pace changes", de: "Tempowechsel", es: "cambios de ritmo", ja: "ペース変化", nl: "tempowissel", it: "variazioni", pt: "mudanças de ritmo", "pt-BR": "variações", sv: "temponbyten", da: "temposkift", nb: "temposkifte", fi: "vauhdinvaihto" }),
  row("plaquettes", { en: "paddles", de: "Paddles", es: "palas", ja: "パドル", nl: "paddles", it: "palette", pt: "palas", "pt-BR": "palmares", sv: "paddlar", da: "padler", nb: "padler", fi: "lapiot" }),
  row("rattrapé", { en: "catch-up", de: "Catch-up", es: "punto muerto", ja: "キャッチアップ", nl: "catch-up", it: "catch-up", pt: "catch-up", "pt-BR": "catch-up", sv: "catch-up", da: "catch-up", nb: "catch-up", fi: "catch-up" }),
  row("rattrape", { en: "catch-up", de: "Catch-up", es: "punto muerto", ja: "キャッチアップ", nl: "catch-up", it: "catch-up", pt: "catch-up", "pt-BR": "catch-up", sv: "catch-up", da: "catch-up", nb: "catch-up", fi: "catch-up" }),
  row("battements", { en: "kick", de: "Beinarbeit", es: "piernas", ja: "キック", nl: "beenslag", it: "gambate", pt: "pernas", "pt-BR": "pernada", sv: "benspark", da: "benspark", nb: "beinspark", fi: "potkut" }),
  row("papillon", { en: "butterfly", de: "Schmetterling", es: "mariposa", ja: "バタフライ", nl: "vlinderslag", it: "farfalla", pt: "mariposa", "pt-BR": "borboleta", sv: "fjärilsim", da: "butterfly", nb: "butterfly", fi: "perhosuinti" }),
  row("godille", { en: "sculling", de: "Wriggen", es: "remos", ja: "スカーリング", nl: "sculling", it: "sculling", pt: "remadas", "pt-BR": "remada", sv: "sculling", da: "sculling", nb: "sculling", fi: "sculling" }),
  row("palmes", { en: "fins", de: "Flossen", es: "aletas", ja: "フィン", nl: "zwemvliezen", it: "pinne", pt: "barbatanas", "pt-BR": "nadadeiras", sv: "fenor", da: "finner", nb: "finner", fi: "räpylät" }),
  row("planche", { en: "kickboard", de: "Brett", es: "tabla", ja: "ビート板", nl: "plank", it: "tavoletta", pt: "prancha", "pt-BR": "prancha", sv: "platta", da: "plade", nb: "brett", fi: "lauta" }),
  row("brasse", { en: "breaststroke", de: "Brust", es: "braza", ja: "平泳ぎ", nl: "schoolslag", it: "rana", pt: "bruços", "pt-BR": "peito", sv: "bröstsim", da: "bryst", nb: "bryst", fi: "rintauinti" }),
  row("crawl", { en: "freestyle", de: "Kraul", es: "crol", ja: "クロール", nl: "vrije slag", it: "stile libero", pt: "crol", "pt-BR": "nado livre", sv: "frisim", da: "crawl", nb: "crawl", fi: "vapaauinti" }),
  row("flèche", { en: "streamline", de: "Gleitlage", es: "flecha", ja: "ストリームライン", nl: "pijl", it: "freccia", pt: "flecha", "pt-BR": "flecha", sv: "pil", da: "pil", nb: "pil", fi: "nuoli" }),
  row("fleche", { en: "streamline", de: "Gleitlage", es: "flecha", ja: "ストリームライン", nl: "pijl", it: "freccia", pt: "flecha", "pt-BR": "flecha", sv: "pil", da: "pil", nb: "pil", fi: "nuoli" }),
  row("coulée", { en: "glide", de: "Gleiten", es: "deslizamiento", ja: "グライド", nl: "glijfase", it: "scivolata", pt: "deslize", "pt-BR": "deslize", sv: "glid", da: "glid", nb: "glid", fi: "liuku" }),
  row("coulee", { en: "glide", de: "Gleiten", es: "deslizamiento", ja: "グライド", nl: "glijfase", it: "scivolata", pt: "deslize", "pt-BR": "deslize", sv: "glid", da: "glid", nb: "glid", fi: "liuku" }),
  row("respiration", { en: "breathing", de: "Atmung", es: "respiración", ja: "呼吸", nl: "ademhaling", it: "respirazione", pt: "respiração", "pt-BR": "respiração", sv: "andning", da: "vejrtrækning", nb: "pust", fi: "hengitys" }),
  row("progressif", { en: "build", de: "steigend", es: "progresivo", ja: "ビルド", nl: "opbouwend", it: "progressivo", pt: "progressivo", "pt-BR": "progressivo", sv: "stegrande", da: "stigende", nb: "stigende", fi: "nouseva" }),
  row("descendant", { en: "descend", de: "fallend", es: "descendente", ja: "下り", nl: "aflopend", it: "discendente", pt: "descendente", "pt-BR": "decrescente", sv: "fallande", da: "faldende", nb: "synkende", fi: "laskeva" }),
  row("confortable", { en: "comfortable", de: "komfortabel", es: "cómodo", ja: "快適", nl: "comfortabel", it: "comodo", pt: "confortável", "pt-BR": "confortável", sv: "bekvämt", da: "behageligt", nb: "behagelig", fi: "mukava" }),
  row("récupération", { en: "recovery", de: "Erholung", es: "recuperación", ja: "回復", nl: "herstel", it: "recupero", pt: "recuperação", "pt-BR": "recuperação", sv: "återhämtning", da: "restitution", nb: "hvile", fi: "palautuminen" }),
  row("relâchée", { en: "loose", de: "locker", es: "suelta", ja: "らく", nl: "ontspannen", it: "sciolta", pt: "solta", "pt-BR": "solta", sv: "avslappnad", da: "afslappet", nb: "avslappet", fi: "rento" }),
  row("relâché", { en: "loose", de: "locker", es: "suelto", ja: "らく", nl: "ontspannen", it: "sciolto", pt: "solto", "pt-BR": "solto", sv: "avslappnat", da: "afslappet", nb: "avslappet", fi: "rento" }),
  row("soutenu", { en: "strong", de: "zügig", es: "sostenido", ja: "しっかり", nl: "stevig", it: "sostenuto", pt: "sustentado", "pt-BR": "sustentado", sv: "tufft", da: "hårdt", nb: "hardt", fi: "tiukka" }),
  row("au choix", { en: "your choice", de: "frei wählbar", es: "a elegir", ja: "自由", nl: "naar keuze", it: "a scelta", pt: "à escolha", "pt-BR": "à escolha", sv: "valfritt", da: "frit valg", nb: "fritt valg", fi: "vapaa valinta" }),
  row("longueurs", { en: "lengths", de: "Bahnen", es: "largos", ja: "本", nl: "banen", it: "vasche", pt: "comprimentos", "pt-BR": "piscinas", sv: "längder", da: "baner", nb: "lengder", fi: "altaanmittoja" }),
  row("longueur", { en: "length", de: "Bahn", es: "largo", ja: "本", nl: "baan", it: "vasca", pt: "comprimento", "pt-BR": "piscina", sv: "längd", da: "bane", nb: "lengde", fi: "altaanmitta" }),
  row("matériel", { en: "gear", de: "Hilfsmittel", es: "material", ja: "道具", nl: "materiaal", it: "attrezzi", pt: "material", "pt-BR": "material", sv: "utrustning", da: "udstyr", nb: "utstyr", fi: "välineet" }),
  row("objectif", { en: "goal", de: "Ziel", es: "objetivo", ja: "目標", nl: "doel", it: "obiettivo", pt: "objetivo", "pt-BR": "objetivo", sv: "mål", da: "mål", nb: "mål", fi: "tavoite" }),
  row("consigne", { en: "cue", de: "Hinweis", es: "consigna", ja: "指示", nl: "aanwijzing", it: "consegna", pt: "indicação", "pt-BR": "instrução", sv: "instruktion", da: "instruks", nb: "instruks", fi: "ohje" }),
  row("à éviter", { en: "avoid", de: "vermeiden", es: "a evitar", ja: "避ける", nl: "vermijden", it: "da evitare", pt: "a evitar", "pt-BR": "evitar", sv: "undvik", da: "undgå", nb: "unngå", fi: "vältä" }),
  row("à bloc", { en: "all-out", de: "voll", es: "a tope", ja: "全力", nl: "voluit", it: "a tutta", pt: "a fundo", "pt-BR": "no máximo", sv: "max", da: "max", nb: "maks", fi: "täysi" }),
  row("a bloc", { en: "all-out", de: "voll", es: "a tope", ja: "全力", nl: "voluit", it: "a tutta", pt: "a fundo", "pt-BR": "no máximo", sv: "max", da: "max", nb: "maks", fi: "täysi" }),
  row("apnée", { en: "underwater", de: "Apnoe", es: "apnea", ja: "息止め", nl: "apneu", it: "apnea", pt: "apneia", "pt-BR": "apneia", sv: "apné", da: "apnø", nb: "apné", fi: "hengityksenpidätys" }),
  row("apnee", { en: "underwater", de: "Apnoe", es: "apnea", ja: "息止め", nl: "apneu", it: "apnea", pt: "apneia", "pt-BR": "apneia", sv: "apné", da: "apnø", nb: "apné", fi: "hengityksenpidätys" }),
  row("virage", { en: "turn", de: "Wende", es: "viraje", ja: "ターン", nl: "keerpunt", it: "virata", pt: "viragem", "pt-BR": "virada", sv: "vändning", da: "vending", nb: "vending", fi: "käännös" }),
  row("départ", { en: "send-off", de: "Abgang", es: "salida", ja: "スタート", nl: "start", it: "partenza", pt: "partida", "pt-BR": "saída", sv: "start", da: "start", nb: "start", fi: "lähtö" }),
  row("repos", { en: "rest", de: "Pause", es: "descanso", ja: "レスト", nl: "rust", it: "recupero", pt: "descanso", "pt-BR": "descanso", sv: "vila", da: "pause", nb: "pause", fi: "lepo" }),
  row("souple", { en: "recovery", de: "locker", es: "suave", ja: "らく", nl: "soepel", it: "sciolto", pt: "solto", "pt-BR": "solto", sv: "lätt", da: "let", nb: "lett", fi: "rento" }),
  row("facile", { en: "easy", de: "leicht", es: "fácil", ja: "楽", nl: "makkelijk", it: "facile", pt: "fácil", "pt-BR": "fácil", sv: "lätt", da: "let", nb: "lett", fi: "helppo" }),
  row("rapide", { en: "fast", de: "schnell", es: "rápido", ja: "速い", nl: "snel", it: "veloce", pt: "rápido", "pt-BR": "rápido", sv: "snabbt", da: "hurtigt", nb: "raskt", fi: "nopea" }),
  row("sprint", { en: "sprint", de: "Sprint", es: "sprint", ja: "スプリント", nl: "sprint", it: "sprint", pt: "sprint", "pt-BR": "sprint", sv: "sprint", da: "sprint", nb: "sprint", fi: "sprintti" }),
  row("moyen", { en: "steady", de: "mittel", es: "medio", ja: "ミドル", nl: "middel", it: "medio", pt: "médio", "pt-BR": "médio", sv: "medel", da: "middel", nb: "middels", fi: "keski" }),
  row("nages", { en: "strokes", de: "Lagen", es: "estilos", ja: "泳法", nl: "slagen", it: "stili", pt: "estilos", "pt-BR": "nados", sv: "simsätt", da: "svømmearter", nb: "svømmearter", fi: "lajit" }),
  row("lente", { en: "slow", de: "langsam", es: "lenta", ja: "ゆっくり", nl: "langzaam", it: "lenta", pt: "lenta", "pt-BR": "lenta", sv: "långsam", da: "langsom", nb: "sakte", fi: "hidas" }),
  row("lent", { en: "slow", de: "langsam", es: "lento", ja: "ゆっくり", nl: "langzaam", it: "lento", pt: "lento", "pt-BR": "lento", sv: "långsamt", da: "langsomt", nb: "sakte", fi: "hidas" }),
  row("vite", { en: "fast", de: "schnell", es: "rápido", ja: "速い", nl: "snel", it: "veloce", pt: "rápido", "pt-BR": "rápido", sv: "snabbt", da: "hurtigt", nb: "raskt", fi: "nopea" }),
  row("jambes", { en: "kick", de: "Beine", es: "piernas", ja: "キック", nl: "benen", it: "gambe", pt: "pernas", "pt-BR": "pernas", sv: "ben", da: "ben", nb: "bein", fi: "jalat" }),
  row("série", { en: "set", de: "Serie", es: "serie", ja: "セット", nl: "serie", it: "serie", pt: "série", "pt-BR": "série", sv: "serie", da: "serie", nb: "serie", fi: "sarja" }),
  row("nage", { en: "swim", de: "Schwimmen", es: "nado", ja: "泳法", nl: "zwemmen", it: "nuoto", pt: "nado", "pt-BR": "nado", sv: "sim", da: "svøm", nb: "svøm", fi: "uinti" }),
  row("tuba", { en: "snorkel", de: "Schnorchel", es: "tubo", ja: "シュノーケル", nl: "snorkel", it: "boccaglio", pt: "tubo", "pt-BR": "snorkel", sv: "snorkel", da: "snorkel", nb: "snorkel", fi: "snorkkeli" }),
  row("dos", { en: "backstroke", de: "Rücken", es: "espalda", ja: "背泳ぎ", nl: "rugslag", it: "dorso", pt: "costas", "pt-BR": "costas", sv: "ryggsim", da: "ryg", nb: "rygg", fi: "selkäuinti" }),
  row("séance", { en: "session", de: "Training", es: "sesión", ja: "練習", nl: "training", it: "allenamento", pt: "sessão", "pt-BR": "treino", sv: "pass", da: "pas", nb: "økt", fi: "harjoitus" }),
  row("allure", { en: "pace", de: "Tempo", es: "ritmo", ja: "ペース", nl: "tempo", it: "ritmo", pt: "ritmo", "pt-BR": "ritmo", sv: "tempo", da: "tempo", nb: "tempo", fi: "vauhti" }),
  row("allures", { en: "paces", de: "Tempi", es: "ritmos", ja: "ペース", nl: "tempo's", it: "ritmi", pt: "ritmos", "pt-BR": "ritmos", sv: "tempon", da: "tempoer", nb: "tempo", fi: "vauhdit" }),
  row("minutes", { en: "minutes", de: "Minuten", es: "minutos", ja: "分", nl: "minuten", it: "minuti", pt: "minutos", "pt-BR": "minutos", sv: "minuter", da: "minutter", nb: "minutter", fi: "minuuttia" }),
  row("minute", { en: "minute", de: "Minute", es: "minuto", ja: "分", nl: "minuut", it: "minuto", pt: "minuto", "pt-BR": "minuto", sv: "minut", da: "minut", nb: "minutt", fi: "minuutti" }),
  row("1 par nage · pap → crawl", {
    en: "1 per stroke · fly → free",
    de: "1 pro Lage · Schmett. → Kraul",
    es: "1 por estilo · mariposa → crol",
    ja: "泳法ごと · バタフライ → クロール",
    nl: "1 per slag · vlinder → vrij",
    it: "1 per stile · farfalla → stile",
    pt: "1 por estilo · mariposa → crol",
    "pt-BR": "1 por nado · borboleta → livre",
    sv: "1 per simsätt · fjäril → fri",
    da: "1 pr. svømmeart · butterfly → crawl",
    nb: "1 per svømmeart · butterfly → crawl",
    fi: "1 per laji · perhonen → vapaa",
  }),
  row("même nage", { en: "same stroke", de: "gleiche Lage", es: "mismo estilo", ja: "同じ泳法", nl: "zelfde slag", it: "stesso stile", pt: "mesmo estilo", "pt-BR": "mesmo nado", sv: "samma simsätt", da: "samme svømmeart", nb: "samme svømmeart", fi: "sama laji" }),
  row("Allure de récupération : lente et relâchée. Tu ne forces pas, tu te détends. À ne pas confondre avec « lent » (allure lente contrôlée, pas une récup).", {
    en: "Recovery pace: slow and loose. You are not pushing, you are relaxing. Do not mix it up with “easy controlled” (a controlled slow pace, not recovery).",
    de: "Erholungstempo: langsam und locker. Du drückst nicht, du entspannst. Nicht mit «langsam» verwechseln (kontrolliert langsam, keine Erholung).",
    es: "Ritmo de recuperación: lento y suelto. No fuerzas, te relajas. No lo confundas con «lento» (ritmo lento controlado, no una recuperación).",
    ja: "回復ペース。遅くて力を抜く。押さない。「ゆっくり」（コントロールした遅いペース）とは別。",
    nl: "Hersteltempo: langzaam en los. Je duwt niet, je ontspant. Niet verwarren met «langzaam» (gecontroleerd langzaam, geen herstel).",
    it: "Passo di recupero: lento e sciolto. Non spingi, ti rilassi. Non confonderlo con «lento» (passo lento controllato, non un recupero).",
    pt: "Ritmo de recuperação: lento e solto. Não forças, relaxas. Não confundas com «lento» (ritmo lento controlado, não uma recuperação).",
    "pt-BR": "Ritmo de recuperação: lento e solto. Você não força, relaxa. Não confunda com «lento» (ritmo lento controlado, não uma recuperação).",
    sv: "Återhämtningstempo: långsamt och löst. Du pressar inte, du slappnar av. Blanda inte med «långsamt» (kontrollerat långsamt, inte återhämtning).",
    da: "Restitutionstempo: langsomt og løst. Du presser ikke, du slapper af. Bland det ikke med «langsomt» (kontrolleret langsomt, ikke restitution).",
    nb: "Restitusjonstempo: sakte og løst. Du presser ikke, du slapper av. Ikke bland med «sakte» (kontrollert sakte, ikke restitusjon).",
    fi: "Palautusvauhti: hidas ja rento. Et puske, rentoudut. Älä sekoita «hitaaseen» (hallittu hidas vauhti, ei palautus).",
  }),
  row("Allure lente et contrôlée : tu nages volontairement moins vite pour la technique ou la qualité. Ce n’est pas du souple (récup).", {
    en: "Controlled easy pace: you swim slower on purpose for technique or quality. This is not recovery.",
    de: "Kontrolliert langsam: du schwimmst absichtlich langsamer für Technik oder Qualität. Das ist kein Erholungstempo.",
    es: "Ritmo lento y controlado: nadas más despacio a propósito, por técnica o calidad. No es recuperación.",
    ja: "コントロールした遅いペース。技術や質のために意図的に遅く泳ぐ。回復ではない。",
    nl: "Gecontroleerd langzaam: je zwemt expres langzamer voor techniek of kwaliteit. Dit is geen herstel.",
    it: "Passo lento e controllato: nuoti più piano di proposito, per tecnica o qualità. Non è recupero.",
    pt: "Ritmo lento e controlado: nadas mais devagar de propósito, pela técnica ou qualidade. Não é recuperação.",
    "pt-BR": "Ritmo lento e controlado: você nada mais devagar de propósito, pela técnica ou qualidade. Não é recuperação.",
    sv: "Kontrollerat långsamt: du simmar medvetet långsammare för teknik eller kvalitet. Det är inte återhämtning.",
    da: "Kontrolleret langsomt: du svømmer bevidst langsommere for teknik eller kvalitet. Det er ikke restitution.",
    nb: "Kontrollert sakte: du svømmer med vilje saktere for teknikk eller kvalitet. Det er ikke restitusjon.",
    fi: "Hallittu hidas vauhti: uit tarkoituksella hitaammin tekniikan tai laadun takia. Tämä ei ole palautus.",
  }),
  row("Allure régulière, tenable sur toute la série. Ni trop facile, ni à fond, tu gardes le même rythme.", {
    en: "Steady pace you can hold for the whole set. Not too easy, not all-out. Keep the same rhythm.",
    de: "Gleichmässiges Tempo, das du die ganze Serie hältst. Nicht zu leicht, nicht voll. Gleicher Rhythmus.",
    es: "Ritmo regular, sostenible en toda la serie. Ni demasiado fácil ni a tope. Mismo ritmo.",
    ja: "セット全体で保てる一定ペース。楽すぎず、全力でもない。同じリズム。",
    nl: "Gelijkmatig tempo dat je de hele serie volhoudt. Niet te makkelijk, niet voluit. Zelfde ritme.",
    it: "Passo regolare, sostenibile su tutta la serie. Né troppo facile né a fondo. Stesso ritmo.",
    pt: "Ritmo regular, sustentável em toda a série. Nem fácil demais, nem a fundo. O mesmo ritmo.",
    "pt-BR": "Ritmo regular, sustentável na série inteira. Nem fácil demais, nem no máximo. O mesmo ritmo.",
    sv: "Jämnt tempo du håller hela serien. Inte för lätt, inte fullt. Samma rytm.",
    da: "Jævnt tempo du holder hele serien. Ikke for let, ikke fuld gas. Samme rytme.",
    nb: "Jevnt tempo du holder hele serien. Ikke for lett, ikke fullt. Samme rytme.",
    fi: "Tasainen vauhti, jonka pidät koko sarjan. Ei liian helppo, ei täysillä. Sama rytmi.",
  }),
  row("Tu accélères au fil de la distance : départ facile, fin plus soutenue.", {
    en: "You speed up through the distance: easy start, stronger finish.",
    de: "Du wirst über die Distanz schneller: lockerer Start, kräftigeres Ende.",
    es: "Aceleras a lo largo de la distancia: salida fácil, final más sostenido.",
    ja: "距離とともに速くする。入りは楽、終わりは強め。",
    nl: "Je versnelt over de afstand: makkelijke start, sterker einde.",
    it: "Acceleri lungo la distanza: partenza facile, finale più sostenuto.",
    pt: "Aceleras ao longo da distância: partida fácil, final mais sustentado.",
    "pt-BR": "Você acelera ao longo da distância: saída fácil, final mais forte.",
    sv: "Du ökar farten längs distansen: lätt start, starkare slut.",
    da: "Du sætter farten op hen over distancen: let start, stærkere slut.",
    nb: "Du øker farten gjennom distansen: lett start, sterkere slutt.",
    fi: "Kiihdytät matkan aikana: helppo lähtö, vahvempi loppu.",
  }),
  row("Allure plus soutenue, qualité d’effort. Tu nages plus vite qu’en rythme moyen, sans forcer jusqu’à l’échec.", {
    en: "A stronger pace, quality effort. Faster than steady, without pushing to failure.",
    de: "Kräftigeres Tempo, Qualitätsbelastung. Schneller als gleichmässig, ohne bis zum Abbruch zu gehen.",
    es: "Ritmo más sostenido, calidad de esfuerzo. Más rápido que el medio, sin llegar al fallo.",
    ja: "強めのペース。質の努力。中くらいより速い。限界まで押さない。",
    nl: "Steviger tempo, kwaliteit. Sneller dan gelijkmatig, zonder tot falen te gaan.",
    it: "Passo più sostenuto, qualità dello sforzo. Più veloce del medio, senza arrivare al cedimento.",
    pt: "Ritmo mais sustentado, qualidade de esforço. Mais rápido que o médio, sem ir até à falha.",
    "pt-BR": "Ritmo mais forte, qualidade do esforço. Mais rápido que o médio, sem ir até a falha.",
    sv: "Starkare tempo, kvalitet. Snabbare än jämnt, utan att gå till failure.",
    da: "Stærkere tempo, kvalitet. Hurtigere end jævnt, uden at gå til udmattelse.",
    nb: "Sterkere tempo, kvalitet. Raskere enn jevnt, uten å gå til utmattelse.",
    fi: "Vahvempi vauhti, laadukas veto. Nopeampi kuin tasainen, ilman uupumukseen asti.",
  }),
  row("Sprint court : tu donnes le maximum sur la distance indiquée, puis tu récupères bien.", {
    en: "Short sprint: maximum on the distance shown, then recover well.",
    de: "Kurzer Sprint: Maximum auf der angegebenen Distanz, dann gut erholen.",
    es: "Sprint corto: el máximo en la distancia indicada, luego recuperas bien.",
    ja: "短いスプリント。示した距離で最大。そのあと十分に休む。",
    nl: "Korte sprint: maximum op de aangegeven afstand, daarna goed herstellen.",
    it: "Sprint corto: il massimo sulla distanza indicata, poi recuperi bene.",
    pt: "Sprint curto: o máximo na distância indicada, depois recuperas bem.",
    "pt-BR": "Sprint curto: o máximo na distância indicada, depois você recupera bem.",
    sv: "Kort sprint: max på den angivna distansen, sedan återhämtar du dig.",
    da: "Kort sprint: maksimum på den angivne distance, så restituerer du godt.",
    nb: "Kort sprint: maksimum på den angitte distansen, så restituerer du godt.",
    fi: "Lyhyt sprintti: maksimi annetulla matkalla, sitten palautut kunnolla.",
  }),
  row("Effort court et explosif. Tu donnes le maximum sur la distance, puis tu récupères bien avant la suivante.", {
    en: "Short explosive effort. Maximum on the distance, then recover well before the next one.",
    de: "Kurze explosive Belastung. Maximum auf der Distanz, dann gut erholen vor der nächsten.",
    es: "Esfuerzo corto y explosivo. El máximo en la distancia, luego recuperas bien antes del siguiente.",
    ja: "短く爆発的。距離で最大。次の前に十分休む。",
    nl: "Korte explosieve inspanning. Maximum op de afstand, dan goed herstellen voor de volgende.",
    it: "Sforzo corto ed esplosivo. Il massimo sulla distanza, poi recuperi bene prima del successivo.",
    pt: "Esforço curto e explosivo. O máximo na distância, depois recuperas bem antes do seguinte.",
    "pt-BR": "Esforço curto e explosivo. O máximo na distância, depois você recupera bem antes do próximo.",
    sv: "Kort explosiv insats. Max på distansen, sedan återhämtning före nästa.",
    da: "Kort eksplosiv indsats. Maksimum på distancen, så restitution før den næste.",
    nb: "Kort eksplosiv innsats. Maksimum på distansen, så restitusjon før den neste.",
    fi: "Lyhyt räjähtävä veto. Maksimi matkalla, sitten palautus ennen seuraavaa.",
  }),
  row("Plusieurs allures dans la même série, dans l’ordre indiqué sous la ligne.", {
    en: "Several paces in the same set, in the order shown under the line.",
    de: "Mehrere Tempi in derselben Serie, in der Reihenfolge unter der Zeile.",
    es: "Varios ritmos en la misma serie, en el orden indicado bajo la línea.",
    ja: "同じセットに複数のペース。行の下の順。",
    nl: "Meerdere tempo's in dezelfde serie, in de volgorde onder de regel.",
    it: "Più ritmi nella stessa serie, nell'ordine indicato sotto la riga.",
    pt: "Vários ritmos na mesma série, na ordem indicada por baixo da linha.",
    "pt-BR": "Vários ritmos na mesma série, na ordem indicada abaixo da linha.",
    sv: "Flera tempon i samma serie, i ordningen under raden.",
    da: "Flere tempoer i samme serie, i den rækkefølge der står under linjen.",
    nb: "Flere tempo i samme serie, i rekkefølgen under linjen.",
    fi: "Useita vauhteja samassa sarjassa, rivin alla olevassa järjestyksessä.",
  }),
  row("nage lente et contrôlée (technique / qualité)", {
    en: "controlled easy swim (technique / quality)", de: "kontrolliert langsam (Technik / Qualität)", es: "nado lento y controlado (técnica / calidad)", ja: "コントロールした遅い泳ぎ（技術 / 質）", nl: "gecontroleerd langzaam (techniek / kwaliteit)", it: "nuoto lento e controllato (tecnica / qualità)", pt: "nado lento e controlado (técnica / qualidade)", "pt-BR": "nado lento e controlado (técnica / qualidade)", sv: "kontrollerat långsamt (teknik / kvalitet)", da: "kontrolleret langsomt (teknik / kvalitet)", nb: "kontrollert sakte (teknikk / kvalitet)", fi: "hallittu hidas uinti (tekniikka / laatu)",
  }),
  row("rythme régulier, tenable sur toute la série", {
    en: "steady rhythm, hold it for the whole set", de: "gleichmässiges Tempo, über die ganze Serie", es: "ritmo regular, sostenible en toda la serie", ja: "一定のリズム、セット全体", nl: "gelijkmatig ritme, vol te houden", it: "ritmo regolare, sostenibile", pt: "ritmo regular, sustentável na série", "pt-BR": "ritmo regular, sustentável na série", sv: "jämn rytm, håll hela serien", da: "jævn rytme, hold hele serien", nb: "jevn rytme, hold hele serien", fi: "tasainen rytmi, koko sarja",
  }),
  row("tu accélères au fil de la distance", {
    en: "you speed up through the distance", de: "du wirst über die Distanz schneller", es: "aceleras a lo largo", ja: "距離とともに加速", nl: "je versnelt over de afstand", it: "acceleri lungo la distanza", pt: "aceleras ao longo", "pt-BR": "você acelera ao longo", sv: "du ökar farten", da: "du sætter farten op", nb: "du øker farten", fi: "kiihdytät matkan aikana",
  }),
  row("plus soutenu que le moyen, sans aller à l’échec", {
    en: "stronger than steady, without going to failure", de: "kräftiger als gleichmässig, ohne Abbruch", es: "más sostenido que el medio, sin llegar al fallo", ja: "中くらいより強い。限界まで行かない", nl: "steviger dan gelijkmatig, niet tot falen", it: "più sostenuto del medio, senza cedimento", pt: "mais sustentado que o médio, sem falha", "pt-BR": "mais forte que o médio, sem falha", sv: "starkare än jämnt, utan failure", da: "stærkere end jævnt, uden udmattelse", nb: "sterkere enn jevnt, uten utmattelse", fi: "vahvempi kuin tasainen, ilman uupumusta",
  }),
  row("récupération : lente et relâchée", {
    en: "recovery: slow and loose", de: "Erholung: langsam und locker", es: "recuperación: lenta y suelta", ja: "回復：遅く力を抜く", nl: "herstel: langzaam en los", it: "recupero: lento e sciolto", pt: "recuperação: lenta e solta", "pt-BR": "recuperação: lenta e solta", sv: "återhämtning: långsam och lös", da: "restitution: langsom og løs", nb: "restitusjon: sakte og løs", fi: "palautus: hidas ja rento",
  }),
  row("maximum sur la distance, puis bonne récup", {
    en: "maximum on the distance, then recover well", de: "Maximum auf der Distanz, dann gute Erholung", es: "máximo en la distancia, luego buena recuperación", ja: "距離で最大、そのあと休む", nl: "maximum op de afstand, dan goed herstel", it: "massimo sulla distanza, poi buon recupero", pt: "máximo na distância, depois boa recuperação", "pt-BR": "máximo na distância, depois boa recuperação", sv: "max på distansen, sedan återhämtning", da: "maksimum, så restitution", nb: "maksimum, så restitusjon", fi: "maksimi matkalla, sitten palautus",
  }),
  row("effort court et explosif, puis bonne récup", {
    en: "short explosive effort, then recover well", de: "kurzer explosiver Einsatz, dann Erholung", es: "esfuerzo corto y explosivo, luego recuperación", ja: "短く爆発的、そのあと休む", nl: "korte explosieve inspanning, dan herstel", it: "sforzo corto ed esplosivo, poi recupero", pt: "esforço curto e explosivo, depois recuperação", "pt-BR": "esforço curto e explosivo, depois recuperação", sv: "kort explosiv insats, sedan återhämtning", da: "kort eksplosiv indsats, så restitution", nb: "kort eksplosiv innsats, så restitusjon", fi: "lyhyt räjähtävä veto, sitten palautus",
  }),
  row("confortable, sans forcer", {
    en: "comfortable, no pushing", de: "komfortabel, ohne Druck", es: "cómodo, sin forzar", ja: "楽に、押さない", nl: "comfortabel, zonder duwen", it: "comodo, senza forzare", pt: "confortável, sem forçar", "pt-BR": "confortável, sem forçar", sv: "bekvämt, utan press", da: "behageligt, uden pres", nb: "komfortabelt, uten press", fi: "mukava, ilman puskemista",
  }),
  row("effort marqué mais tenable", {
    en: "a clear effort you can hold", de: "deutliche, haltbare Belastung", es: "esfuerzo marcado pero sostenible", ja: "はっきりした努力、保てる", nl: "duidelijke inspanning die je volhoudt", it: "sforzo marcato ma sostenibile", pt: "esforço marcado mas sustentável", "pt-BR": "esforço marcado, mas sustentável", sv: "tydlig insats du kan hålla", da: "tydelig indsats du kan holde", nb: "tydelig innsats du kan holde", fi: "selvä veto, jonka jaksat",
  }),
  row("tu ralentis au fil de la distance", {
    en: "you slow down through the distance", de: "du wirst über die Distanz langsamer", es: "frenas a lo largo de la distancia", ja: "距離とともに遅くする", nl: "je vertraagt over de afstand", it: "rallenti lungo la distanza", pt: "abrandas ao longo da distância", "pt-BR": "você desacelera ao longo da distância", sv: "du saktar av längs distansen", da: "du sænker farten hen over distancen", nb: "du senker farten gjennom distansen", fi: "hidastat matkan aikana",
  }),
  row("sur cette série, enchaîne les allures dans cet ordre.", {
    en: "On this set, swim the paces in this order.",
    de: "In dieser Serie schwimmst du die Tempi in dieser Reihenfolge.",
    es: "En esta serie, encadena los ritmos en este orden.",
    ja: "このセットは、この順でペースを泳ぐ。",
    nl: "In deze serie zwem je de tempo's in deze volgorde.",
    it: "In questa serie, nuota i ritmi in quest'ordine.",
    pt: "Nesta série, encadeia os ritmos por esta ordem.",
    "pt-BR": "Nesta série, nade os ritmos nesta ordem.",
    sv: "I den här serien simmar du tempon i den här ordningen.",
    da: "I denne serie svømmer du tempoerne i denne rækkefølge.",
    nb: "I denne serien svømmer du tempoene i denne rekkefølgen.",
    fi: "Tässä sarjassa uit vauhdit tässä järjestyksessä.",
  }),
].sort((a, b) => b.fr.length - a.fr.length);

function isLetter(ch) {
  return /\p{L}/u.test(ch || "");
}

function boundaryOk(src, start, len) {
  if (start > 0 && isLetter(src[start - 1])) return false;
  const end = start + len;
  if (end < src.length && isLetter(src[end])) return false;
  return true;
}

function applyCase(sample, translated) {
  const letters = sample.replace(/[^\p{L}]/gu, "");
  if (!letters) return translated;
  if (letters === letters.toLocaleUpperCase("fr")) return translated.toLocaleUpperCase("en");
  if (letters[0] === letters[0].toLocaleUpperCase("fr")) {
    return translated.charAt(0).toLocaleUpperCase("en") + translated.slice(1);
  }
  return translated;
}

export function translateSessionText(text, lang = getSessionDisplayLang()) {
  if (text == null || text === "") return text;
  const code = lang === "pt-br" ? "pt-BR" : lang;
  if (!code || code === "fr" || !LANGS.includes(code)) return text;
  const src = String(text);
  const lower = src.toLowerCase();
  let i = 0;
  let out = "";
  while (i < src.length) {
    let hit = null;
    for (const phrase of PHRASES) {
      if (lower.startsWith(phrase.frLower, i) && boundaryOk(src, i, phrase.fr.length)) {
        hit = phrase;
        break;
      }
    }
    if (hit) {
      out += applyCase(src.slice(i, i + hit.fr.length), hit[code]);
      i += hit.fr.length;
    } else {
      out += src[i];
      i += 1;
    }
  }
  return out;
}
