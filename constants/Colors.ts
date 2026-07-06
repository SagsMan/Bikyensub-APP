/**
 * Includes both Light and Dark mode variations.
 * Updated to match the uploaded BG logo colors.
 */

export const Colors = {
  light: {
    primary: "#0B0B8C", // Deep royal blue from logo
    secondary: "#E1064A", // Vibrant magenta-red
    accent: "#5B21B6", // Purple transition tone
    background: "#F5F7FA", // Clean light background
    surface: "#FFFFFF", // Cards/Modals
    text: "#111827", // Dark neutral text
    onPrimary: "#FFFFFF",
    textMuted: "#6B7280",
    border: "#D6DAF5",
    inputBorder: "#A5B4FC",

    success: "#22C55E",
    error: "#EF4444",

    icon: "#0B0B8C",

    tabActive: "#E1064A",
    tabInactive: "#9CA3AF",

    gradient: ["#FF0000", "#0B0B8C"] as const,
  },

  dark: {
    primary: "#3B4DFF", // Brightened blue for dark mode
    secondary: "#FF2E63", // Neon magenta-red
    accent: "#8B5CF6", // Soft purple glow

    background: "#090935", // Deep navy background
    surface: "#15153F", // Elevated dark surface

    text: "#FFFFFF",
    onPrimary: "#FFFFFF",

    textMuted: "#C7C9D1",

    border: "#312E81",
    inputBorder: "#4338CA",

    success: "#4ADE80",
    error: "#F87171",

    icon: "#FFFFFF",

    tabActive: "#FF2E63",
    tabInactive: "#818CF8",

    gradient: ["#FF0000", "#0B0B8C"] as const,
  },
};

export type ThemeType = "light" | "dark";
