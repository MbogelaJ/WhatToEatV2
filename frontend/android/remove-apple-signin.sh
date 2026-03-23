#!/bin/bash
# This script removes Apple Sign-In references from Android build files
# Run this after any 'npx cap sync' command

echo "Removing Apple Sign-In plugin from Android build (iOS-only plugin)..."

# Remove from capacitor.settings.gradle
sed -i '' "/capacitor-community-apple-sign-in/d" ./capacitor.settings.gradle 2>/dev/null || \
sed -i "/capacitor-community-apple-sign-in/d" ./capacitor.settings.gradle

# Remove from app/capacitor.build.gradle
sed -i '' "/capacitor-community-apple-sign-in/d" ./app/capacitor.build.gradle 2>/dev/null || \
sed -i "/capacitor-community-apple-sign-in/d" ./app/capacitor.build.gradle

echo "Done! Apple Sign-In references removed from Android build."
