// Shared colour tokens used across the app UI.
export const colors = {
  // Main background and surface colours.
  background: "#10251B",
  surface: "#183328",
  surfaceAlt: "#224234",
  surfaceMuted: "#274033",
  surfaceOverlay: "rgba(10, 27, 19, 0.98)",

  // Text colours for different emphasis levels.
  textPrimary: "#F6FAF7",
  textSecondary: "#DCE8E0",
  textMuted: "#A9BBB0",
  textSoft: "#9EB2A5",
  textDim: "#8FA297",
  textDark: "#183126",

  white: "#FFFFFF",

  // Accent colours used for buttons, pills, and highlights.
  accent: "#F4F7F3",
  accentSoft: "#DCE8E0",

  // Border colours for cards, inputs, and tab areas.
  borderSoft: "rgba(255,255,255,0.05)",
  borderTab: "rgba(255,255,255,0.06)",

  // Overlay colours used above images and modal backgrounds.
  overlayDark: "rgba(8, 16, 12, 0.72)",
  overlayImage: "rgba(8, 18, 13, 0.28)",
  overlayWelcome: "rgba(10, 22, 16, 0.34)",

  // Status and route colours.
  success: "#34C759",
  routeLine: "#1F6B4F",
};

// Shared shadow presets for elevated UI elements.
export const shadows = {
  tabActive: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floating: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};