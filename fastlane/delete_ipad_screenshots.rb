#!/usr/bin/env ruby
# frozen_string_literal: true

# Delete ALL iPad screenshots from App Store Connect using Spaceship (App Store Connect API).
#
# Usage:
#   ruby fastlane/delete_ipad_screenshots.rb
#
# Required env / hardcoded:
#   API key file : fastlane/AuthKey_3Y4L9XJC76.p8
#   Key ID       : 3Y4L9XJC76
#   Issuer ID    : 7927d78f-7f09-4ff0-bad9-6c36b8afcaf5
#   App Bundle ID: com.mindfulnotes.app

require "spaceship"

KEY_ID    = "3Y4L9XJC76"
ISSUER_ID = "7927d78f-7f09-4ff0-bad9-6c36b8afcaf5"
KEY_FILE  = File.expand_path("AuthKey_3Y4L9XJC76.p8", __dir__)
BUNDLE_ID = "com.mindfulnotes.app"

# iPad screenshot display types we want to delete
IPAD_DISPLAY_TYPES = %w[
  APP_IPAD_PRO_129
  APP_IPAD_PRO_3GEN_11
  APP_IPAD_PRO_6GEN_13
].freeze

puts "=== Delete iPad Screenshots from App Store Connect ==="
puts ""
puts "Key ID:    #{KEY_ID}"
puts "Issuer ID: #{ISSUER_ID}"
puts "Key File:  #{KEY_FILE}"
puts "Bundle ID: #{BUNDLE_ID}"
puts "iPad types: #{IPAD_DISPLAY_TYPES.join(', ')}"
puts ""

# ── Authenticate via API Key ──
token = Spaceship::ConnectAPI::Token.create(
  key_id: KEY_ID,
  issuer_id: ISSUER_ID,
  filepath: KEY_FILE
)
Spaceship::ConnectAPI.token = token
puts "✅ Authenticated with App Store Connect API"

# ── Find the app ──
app = Spaceship::ConnectAPI::App.find(BUNDLE_ID)
unless app
  puts "❌ App not found: #{BUNDLE_ID}"
  exit 1
end
puts "✅ Found app: #{app.name} (#{app.bundle_id})"

# ── Get the latest editable version (or live) ──
version = app.get_edit_app_store_version || app.get_live_app_store_version
unless version
  puts "❌ No editable or live App Store version found"
  exit 1
end
puts "✅ App Store version: #{version.version_string} (state: #{version.app_store_state})"
puts ""

# ── Get all localizations ──
localizations = version.get_app_store_version_localizations
puts "Found #{localizations.length} localizations"

total_deleted = 0

localizations.each do |localization|
  locale = localization.locale
  screenshot_sets = localization.get_app_screenshot_sets

  ipad_sets = screenshot_sets.select { |s| IPAD_DISPLAY_TYPES.include?(s.screenshot_display_type) }
  next if ipad_sets.empty?

  puts ""
  puts "── #{locale} ──"

  ipad_sets.each do |ss_set|
    display_type = ss_set.screenshot_display_type
    screenshots = ss_set.app_screenshots

    if screenshots.empty?
      puts "  #{display_type}: (empty set, deleting set)"
      begin
        ss_set.delete!
        puts "    🗑️  Deleted empty set"
      rescue => e
        puts "    ⚠️  Could not delete set: #{e.message}"
      end
      next
    end

    puts "  #{display_type}: #{screenshots.length} screenshot(s)"

    # Delete each screenshot in the set
    screenshots.each do |screenshot|
      begin
        screenshot.delete!
        total_deleted += 1
        puts "    🗑️  Deleted: #{screenshot.file_name || screenshot.id}"
      rescue => e
        puts "    ⚠️  Failed to delete #{screenshot.id}: #{e.message}"
      end
    end

    # Now delete the empty set itself
    begin
      ss_set.delete!
      puts "    🗑️  Deleted empty screenshot set"
    rescue => e
      # Some API versions auto-clean empty sets; ignore if already gone
      puts "    ℹ️  Set cleanup: #{e.message}" unless e.message.include?("not_found")
    end
  end
end

puts ""
puts "═══════════════════════════════════════"
puts "✅ Done! Deleted #{total_deleted} iPad screenshot(s) from App Store Connect."
puts "═══════════════════════════════════════"
