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
