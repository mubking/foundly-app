// Static per-row config (icon/label/color/route) — real, not mock. `subtitle`
// and `badge` are intentionally omitted for rows that used to carry a
// fabricated count (myLost, myFound, rewards, messages): ProfileScreen fills
// those in from useProfileStats.js (real per-user counts) instead, falling
// back to no subtitle/badge if a count hasn't loaded rather than showing a
// stale or invented number.
export const PROFILE_MENU = [
  {
    key: "myLost",
    icon: "package",
    label: "My Lost Items",
    color: "#EF4444",
    route: "MyLostItems",
  },
  {
    key: "myFound",
    icon: "search",
    label: "My Found Items",
    color: "#22C55E",
    route: "MyFoundItems",
  },
  {
    key: "matches",
    icon: "zap",
    label: "Matches",
    subtitle: "See possible matches for your items",
    badge: null,
    color: "#D97706",
    route: "Matches",
  },
  {
    key: "rewards",
    icon: "gift",
    label: "Reward History",
    color: "#F59E0B",
    route: "RewardHistory",
  },
  {
    key: "ownerClaims",
    icon: "shield",
    label: "Claims on My Items",
    subtitle: "Review and respond to claims",
    badge: null,
    color: "#2563EB",
    route: "OwnerClaims",
  },
  {
    key: "messages",
    icon: "message",
    label: "Messages",
    color: "#2563EB",
    route: "Chat",
  },
  {
    key: "settings",
    icon: "settings",
    label: "Settings",
    subtitle: "Privacy, notifications, theme",
    badge: null,
    color: "#6B7280",
    route: "Settings",
  },
];
