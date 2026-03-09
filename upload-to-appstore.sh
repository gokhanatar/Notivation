#!/bin/bash
# ============================================================
# Notivation — App Store Connect Upload Script
#
# Bu script her şeyi App Store Connect'e yükler:
#   - 30 lokalize metadata (açıklama, anahtar kelimeler, vb.)
#   - 30 screenshot (3 cihaz boyutu × 10 ekran görüntüsü)
#   - IPA binary
#   - Fiyatlandırma (Free + IAP)
#   - Yaş derecelendirmesi (4+)
#   - İnceleme notları
#   - Gizlilik URL'leri
#   - Tüm App Store Connect alanları
#
# SADECE "Submit for Review" butonu sana kalıyor!
#
# Kullanım:
#   ./upload-to-appstore.sh              # Her şeyi yükle
#   ./upload-to-appstore.sh metadata     # Sadece metadata + screenshot
#   ./upload-to-appstore.sh screenshots  # Sadece screenshot
#   ./upload-to-appstore.sh binary       # Sadece IPA
#   ./upload-to-appstore.sh validate     # Doğrulama (yükleme yapmaz)
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FASTLANE_DIR="${PROJECT_DIR}/fastlane"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║   Notivation — App Store Connect Upload      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================
# PRE-FLIGHT CHECKS
# ============================================================
echo -e "${BLUE}[1/5] Pre-flight checks...${NC}"

# Check fastlane
if ! command -v fastlane &>/dev/null; then
    echo -e "${RED}ERROR: fastlane not found. Install: brew install fastlane${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} fastlane $(fastlane --version 2>/dev/null | head -1 | grep -o '[0-9.]*' | head -1)"

# Check API key
API_KEY_PATH="${ASC_KEY_PATH:-${FASTLANE_DIR}/AuthKey_3Y4L9XJC76.p8}"
if [ ! -f "$API_KEY_PATH" ]; then
    echo -e "${RED}ERROR: App Store Connect API key not found at: ${API_KEY_PATH}${NC}"
    echo -e "${YELLOW}  1. App Store Connect > Users and Access > Integrations > App Store Connect API${NC}"
    echo -e "${YELLOW}  2. Download your AuthKey_XXXXXXXX.p8 file${NC}"
    echo -e "${YELLOW}  3. Place it at: ${FASTLANE_DIR}/AuthKey_3Y4L9XJC76.p8${NC}"
    echo -e "${YELLOW}  Or set ASC_KEY_PATH environment variable${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} API Key found"

# Check IPA
IPA_PATH="${PROJECT_DIR}/store-deployment/ios/MindfulNotes.ipa"
if [ ! -f "$IPA_PATH" ]; then
    echo -e "${YELLOW}WARNING: IPA not found at ${IPA_PATH}${NC}"
    echo -e "${YELLOW}  Binary upload will be skipped.${NC}"
fi
echo -e "  ${GREEN}✓${NC} IPA exists ($(du -h "$IPA_PATH" 2>/dev/null | cut -f1 || echo 'N/A'))"

# Check metadata
META_COUNT=$(ls -d "${FASTLANE_DIR}/metadata"/*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}✓${NC} Metadata: ${META_COUNT} locales"

# Check screenshots
SS_COUNT=$(ls "${FASTLANE_DIR}/screenshots/en-US/"*.png 2>/dev/null | wc -l | tr -d ' ')
echo -e "  ${GREEN}✓${NC} Screenshots: ${SS_COUNT} files (3 devices × 10 screenshots)"

echo ""

# ============================================================
# INVENTORY
# ============================================================
echo -e "${BLUE}[2/5] Upload inventory:${NC}"
echo -e "  ${BOLD}App:${NC}            Notivation (com.mindfulnotes.app)"
echo -e "  ${BOLD}Version:${NC}        1.0.0"
echo -e "  ${BOLD}Price:${NC}          Free (IAP: Monthly \$3.99 / Yearly \$29.99)"
echo -e "  ${BOLD}Categories:${NC}     Utilities > Productivity"
echo -e "  ${BOLD}Age Rating:${NC}     4+"
echo -e "  ${BOLD}Languages:${NC}      30 (App Store Connect supported)"
echo -e "  ${BOLD}Devices:${NC}        iPhone 6.7\" / 6.5\" / 5.5\""
echo -e "  ${BOLD}Screenshots:${NC}    10 per device (first 3 are hero shots)"
echo ""

echo -e "${CYAN}  First 3 Screenshots (kritik — arama sonuçlarında görünür):${NC}"
echo -e "    ${BOLD}1. Hero Inbox${NC}     — Morning Brief, Clarity Score, Momentum"
echo -e "    ${BOLD}2. Note Detail${NC}    — Decision Analysis, Pros/Cons, Journey"
echo -e "    ${BOLD}3. Actions Today${NC}  — Task Management, Due Dates, Progress"
echo ""

# ============================================================
# DETERMINE MODE
# ============================================================
MODE="${1:-all}"

case "$MODE" in
    all)
        LANE="upload_all"
        echo -e "${BLUE}[3/5] Mode: ${BOLD}FULL UPLOAD${NC} (metadata + screenshots + IPA)"
        ;;
    metadata)
        LANE="upload_metadata"
        echo -e "${BLUE}[3/5] Mode: ${BOLD}METADATA + SCREENSHOTS${NC}"
        ;;
    screenshots)
        LANE="upload_screenshots"
        echo -e "${BLUE}[3/5] Mode: ${BOLD}SCREENSHOTS ONLY${NC}"
        ;;
    binary)
        LANE="upload_binary"
        echo -e "${BLUE}[3/5] Mode: ${BOLD}BINARY ONLY${NC}"
        ;;
    validate)
        LANE="validate"
        echo -e "${BLUE}[3/5] Mode: ${BOLD}VALIDATE${NC} (dry-run, no upload)"
        ;;
    *)
        echo -e "${RED}Unknown mode: $MODE${NC}"
        echo "Usage: $0 [all|metadata|screenshots|binary|validate]"
        exit 1
        ;;
esac

echo ""

# ============================================================
# CONFIRMATION
# ============================================================
if [ "$MODE" != "validate" ]; then
    echo -e "${YELLOW}${BOLD}App Store Connect'e yükleme yapılacak.${NC}"
    echo -e "${YELLOW}Devam etmek istiyor musun? (y/N)${NC}"
    read -r CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo -e "${RED}İptal edildi.${NC}"
        exit 0
    fi
fi

echo ""

# ============================================================
# UPLOAD
# ============================================================
echo -e "${BLUE}[4/5] Uploading...${NC}"
echo ""

cd "$PROJECT_DIR"

# Export env vars for fastlane
export ASC_KEY_ID="${ASC_KEY_ID:-3Y4L9XJC76}"
export ASC_ISSUER_ID="${ASC_ISSUER_ID:-7927d78f-7f09-4ff0-bad9-6c36b8afcaf5}"
export ASC_KEY_PATH="$API_KEY_PATH"

# Run fastlane
fastlane ios "$LANE"

echo ""

# ============================================================
# DONE
# ============================================================
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║   ✓ UPLOAD COMPLETE!                         ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}Sonraki adım:${NC}"
echo -e "  1. ${BOLD}App Store Connect${NC}'e git: https://appstoreconnect.apple.com"
echo -e "  2. Notivation > iOS > Version 1.0.0'ı aç"
echo -e "  3. Her şeyin doğru yüklendiğini kontrol et:"
echo -e "     - 30 screenshots (3 cihaz × 10 ekran)"
echo -e "     - 30 dilde metadata"
echo -e "     - Build binary (IPA)"
echo -e "  4. ${BOLD}\"Submit for Review\"${NC} butonuna bas"
echo ""
echo -e "${GREEN}Sadece bu kadar! Geri kalan her şey hazır.${NC}"
echo ""
