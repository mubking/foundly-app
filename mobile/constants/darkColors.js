// Dark counterpart to constants/colors.js — same keys, same semantic role
// for each token, so ThemeContext can swap this in without any consumer
// caring which palette is active. Primary stays a recognizable "Foundly
// blue" but lifted a step lighter for contrast against dark surfaces.
export default {
  primary: "#3B82F6",
  primaryHover: "#60A5FA",
  primaryDeep: "#1E3A8A",
  primaryLight: "#60A5FA",
  primaryLighter: "#93C5FD",
  secondary: "#FBBF24",
  purple: "#A78BFA",

  background: "#0B1220",
  surface: "#141B2D",
  surfaceAlt: "#1E293B",

  text: "#F1F5F9",
  textLight: "#94A3B8",
  ink2: "#CBD5E1",
  subtle: "#64748B",
  ghost: "#475569",

  success: "#22C55E",
  danger: "#F87171",

  border: "#27324A",

  primaryTint: "#1E293B",
  primaryTintDark: "#1E3A8A",
  greenTint: "#14532D",
  amberTint: "#78350F",
  redTint: "#7F1D1D",
  purpleTint: "#3B2E66",
};
