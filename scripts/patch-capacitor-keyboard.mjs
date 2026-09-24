/**
 * @capacitor/keyboard 8.0.5 : Xcode 26 / clang casse si
 * `@implementation` n’a pas le nom de classe (le parseur croit implémenter NSTimer).
 * Upstream a `@implementation KeyboardPlugin` ; on rétablit après npm i.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(
  new URL("../node_modules/@capacitor/keyboard/ios/Sources/KeyboardPlugin/Keyboard.m", import.meta.url),
);

let text;
try {
  text = readFileSync(file, "utf8");
} catch {
  process.stderr.write("[patch-keyboard] fichier absent, skip\n");
  process.exit(0);
}

const broken = "@implementation\n\nNSTimer *hideTimer;";
const fixed = "@implementation KeyboardPlugin\n\nNSTimer *hideTimer;";
if (text.includes(broken)) {
  writeFileSync(file, text.replace(broken, fixed));
  process.stderr.write("[patch-keyboard] @implementation KeyboardPlugin rétabli\n");
} else if (text.includes("@implementation KeyboardPlugin")) {
  process.stderr.write("[patch-keyboard] déjà bon\n");
} else {
  process.stderr.write("[patch-keyboard] motif inattendu, skip\n");
}
