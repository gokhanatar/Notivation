#!/bin/bash
# Patch Capacitor & CapacitorCordova headers to fix Xcode warnings
# This runs automatically via postinstall in package.json

CORDOVA_DIR="node_modules/@capacitor/ios/CapacitorCordova/CapacitorCordova/Classes/Public"
CAPACITOR_DIR="node_modules/@capacitor/ios/Capacitor/Capacitor"

# ── 1. CapacitorCordova: Fix double-quoted includes in .h files ──
if [ -d "$CORDOVA_DIR" ]; then
  for f in "$CORDOVA_DIR"/*.h; do
    sed -i '' 's/#import "\(CDV[^"]*\.h\)"/#import <Cordova\/\1>/g' "$f"
    sed -i '' 's/#import "NSDictionary+CordovaPreferences.h"/#import <Cordova\/NSDictionary+CordovaPreferences.h>/g' "$f"
  done

  # Suppress WKProcessPool deprecation warning
  HEADER="$CORDOVA_DIR/CDVWebViewProcessPoolFactory.h"
  if [ -f "$HEADER" ] && ! grep -q "pragma clang diagnostic" "$HEADER"; then
    sed -i '' 's/@interface CDVWebViewProcessPoolFactory/#pragma clang diagnostic push\
#pragma clang diagnostic ignored "-Wdeprecated-declarations"\
@interface CDVWebViewProcessPoolFactory/' "$HEADER"
    echo "#pragma clang diagnostic pop" >> "$HEADER"
  fi
fi

# ── 2. Capacitor: Fix double-quoted includes & @import Cordova ──
if [ -d "$CAPACITOR_DIR" ]; then
  # CAPBridgedPlugin.h
  if [ -f "$CAPACITOR_DIR/CAPBridgedPlugin.h" ]; then
    sed -i '' 's/#import "CAPPluginMethod.h"/#import <Capacitor\/CAPPluginMethod.h>/' "$CAPACITOR_DIR/CAPBridgedPlugin.h"
  fi

  # CAPPluginMethod.h
  if [ -f "$CAPACITOR_DIR/CAPPluginMethod.h" ]; then
    sed -i '' 's/#import "CAPPluginCall.h"/#import <Capacitor\/CAPPluginCall.h>/' "$CAPACITOR_DIR/CAPPluginMethod.h"
    sed -i '' 's/#import "CAPPlugin.h"/#import <Capacitor\/CAPPlugin.h>/' "$CAPACITOR_DIR/CAPPluginMethod.h"
  fi

  # CAPInstanceDescriptor.h — leave @import Cordova; as-is (module verifier is disabled)

  # CAPBridgeViewController+CDVScreenOrientationDelegate.h — add missing Cordova import
  ORIENT_HEADER="$CAPACITOR_DIR/CAPBridgeViewController+CDVScreenOrientationDelegate.h"
  if [ -f "$ORIENT_HEADER" ] && ! grep -q "CDVScreenOrientationDelegate.h" "$ORIENT_HEADER"; then
    sed -i '' 's/#import <Capacitor\/Capacitor-Swift.h>/#import <Capacitor\/Capacitor-Swift.h>\
#import <Cordova\/CDVScreenOrientationDelegate.h>/' "$ORIENT_HEADER"
  fi
fi

echo "Capacitor headers patched successfully"
