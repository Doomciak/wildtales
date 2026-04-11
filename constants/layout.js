import { Platform } from "react-native";

// Shared spacing values used across the app for consistent layout.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

// Shared border radius values for cards, buttons, and pills.
export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 26,
  pill: 999,
};

// Screen layout values shared across the app.
// Some values are adjusted slightly per platform for more consistent spacing.
export const screen = {
  topPadding: 68,
  bottomSpacing: Platform.OS === "android" ? 82 : 76,
  tabBarBottomOffset: Platform.OS === "android" ? 8 : 10,
  tabBarBottomPadding: Platform.OS === "android" ? 10 : 10,
  tabBarTopPadding: Platform.OS === "android" ? 10 : 10,
  tabBarMinHeight: Platform.OS === "android" ? 64 : 62,
  tabBarSideInset: Platform.OS === "android" ? 16 : 18,
};

// Standard icon sizes to keep icons visually consistent.
export const iconSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

// Shared map settings for default regions and point-based fallbacks.
export const map = {
  defaultRegion: {
    latitude: 54.5,
    longitude: -3.5,
    latitudeDelta: 8,
    longitudeDelta: 8,
  },
  singlePointDelta: {
    latitude: 0.05,
    longitude: 0.05,
  },
  fallbackPointDelta: {
    latitude: 0.08,
    longitude: 0.08,
  },
};