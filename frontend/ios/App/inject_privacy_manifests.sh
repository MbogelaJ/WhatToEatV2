#!/bin/bash

# Privacy Manifest Injection Script for WhatToEat
# This script copies PrivacyInfo.xcprivacy into frameworks that don't have them

FRAMEWORKS_DIR="${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}"

# Privacy manifest content
PRIVACY_MANIFEST='<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>35F9.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>E174.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>'

# Frameworks that need privacy manifests
FRAMEWORKS=(
    "Capacitor.framework"
    "Cordova.framework"
    "GoogleSignIn.framework"
    "GTMAppAuth.framework"
    "GTMSessionFetcher.framework"
    "AppAuth.framework"
)

echo "Injecting privacy manifests into frameworks..."

for FRAMEWORK in "${FRAMEWORKS[@]}"; do
    FRAMEWORK_PATH="${FRAMEWORKS_DIR}/${FRAMEWORK}"
    if [ -d "$FRAMEWORK_PATH" ]; then
        PRIVACY_FILE="${FRAMEWORK_PATH}/PrivacyInfo.xcprivacy"
        if [ ! -f "$PRIVACY_FILE" ]; then
            echo "$PRIVACY_MANIFEST" > "$PRIVACY_FILE"
            echo "✅ Added PrivacyInfo.xcprivacy to ${FRAMEWORK}"
        else
            echo "ℹ️ ${FRAMEWORK} already has PrivacyInfo.xcprivacy"
        fi
    fi
done

echo "Privacy manifest injection complete!"
