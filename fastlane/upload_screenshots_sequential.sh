#!/bin/bash
# Upload screenshots one locale at a time to avoid App Store Connect API race conditions

SCREENSHOTS_DIR="./fastlane/screenshots"
TEMP_DIR="./fastlane/screenshots_temp"
LOCALES=("en-US" "tr" "ar-SA" "de-DE" "es-ES" "fr-FR" "hi" "pt-BR" "zh-Hans")

echo "🚀 Sequential screenshot upload - 9 locales"
echo ""

for locale in "${LOCALES[@]}"; do
  echo "══════════════════════════════════════════"
  echo "📱 Uploading: $locale"
  echo "══════════════════════════════════════════"

  # Create temp dir with only this locale
  rm -rf "$TEMP_DIR"
  mkdir -p "$TEMP_DIR/$locale"
  cp "$SCREENSHOTS_DIR/$locale/"*.png "$TEMP_DIR/$locale/"

  count=$(ls "$TEMP_DIR/$locale/"*.png 2>/dev/null | wc -l | tr -d ' ')
  echo "  📸 $count screenshots to upload"

  # Run fastlane with temp dir (only this locale)
  fastlane deliver \
    --screenshots_path "$TEMP_DIR" \
    --skip_binary_upload true \
    --skip_screenshots false \
    --skip_metadata true \
    --overwrite_screenshots true \
    --submit_for_review false \
    --force true \
    --app_identifier "com.mindfulnotes.app" 2>&1 | while IFS= read -r line; do
      # Filter out noise, show important lines
      if echo "$line" | grep -qE "(Uploaded|Error|error|Success|success|finished|Deleted|Skipping|Too many)"; then
        echo "  $line"
      fi
    done

  echo "  ✅ $locale done!"
  echo ""

  # Wait between locales to let API settle
  echo "  ⏳ Waiting 15 seconds before next locale..."
  sleep 15
done

# Cleanup
rm -rf "$TEMP_DIR"
echo ""
echo "🎉 All locales uploaded!"
