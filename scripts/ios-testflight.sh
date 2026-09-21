#!/usr/bin/env bash
# Upload TestFlight MySWYM (archive → App Store Connect).
# Prérequis Xcode → Settings → Accounts : Apple ID connecté, team F6DRCXLFT7.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TEAM_ID="F6DRCXLFT7"
ARCHIVE="${ARCHIVE_PATH:-/tmp/myswym-tf/MySWYM.xcarchive}"
EXPORT_DIR="${EXPORT_PATH:-/tmp/myswym-tf/export}"
EXPORT_OPTS="${ROOT}/ios/ExportOptions.plist"

echo "==> Préflight comptes / certificats"
IDENTITIES="$(security find-identity -v -p codesigning 2>/dev/null || true)"
if ! echo "$IDENTITIES" | grep -q "Apple Distribution\|iPhone Distribution\|Apple Development"; then
  echo "Aucun certificat de signature trouvé."
  echo "Ouvre Xcode → Settings → Accounts → + → Apple ID, puis Manage Certificates → + → Apple Distribution."
  open -a Xcode
  exit 1
fi
if ! echo "$IDENTITIES" | grep -qE "Apple Distribution|iPhone Distribution"; then
  echo "Certificat Apple Distribution manquant (seul Development présent)."
  echo "Xcode → Settings → Accounts → ton compte → Manage Certificates → + → Apple Distribution."
  open -a Xcode
  exit 1
fi

echo "==> cap:sync"
npm run cap:sync

MARKETING="$(/usr/libexec/PlistBuddy -c 'Print :objects:96A1E0012FE9A00100000001' "$ROOT/ios/App/App.xcodeproj/project.pbxproj" 2>/dev/null || true)"
# Lit versions depuis le pbxproj
MV="$(rg -N "MARKETING_VERSION = " "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | head -1 | sed -E 's/.*= ([0-9.]+);/\1/')"
BV="$(rg -N "CURRENT_PROJECT_VERSION = " "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | head -1 | sed -E 's/.*= ([0-9]+);/\1/')"
echo "==> Version ${MV:-?} (${BV:-?})"

echo "==> Archive Release (Any iOS Device)"
rm -rf "$ARCHIVE"
mkdir -p "$(dirname "$ARCHIVE")"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  archive \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID"

echo "==> Export + upload App Store Connect"
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"
if ! xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$EXPORT_OPTS" \
  -exportPath "$EXPORT_DIR" \
  -allowProvisioningUpdates; then
  echo ""
  echo "Export échoué. Causes fréquentes :"
  echo "  1) Xcode → Settings → Accounts : reconnecte ton Apple ID"
  echo "  2) Manage Certificates → + → Apple Distribution"
  echo "  3) developer.apple.com → Identifiers → app.myswym.ios → activer HealthKit → Save"
  echo "  4) Puis Organizer → Distribute App"
  open "$ARCHIVE"
  open "https://developer.apple.com/account/resources/identifiers/list"
  exit 1
fi

echo "OK : upload lancé (processing Apple 5–15 min). TestFlight ensuite."
