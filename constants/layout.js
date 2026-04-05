import { Platform } from "react-native";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 26,
  pill: 999,
};

export const screen = {
  topPadding: 68,
  bottomSpacing: Platform.OS === "android" ? 120 : 96,
  tabBarBottomPadding: Platform.OS === "android" ? 30 : 20,
  tabBarMinHeight: Platform.OS === "android" ? 88 : 78,
};

export const iconSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

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