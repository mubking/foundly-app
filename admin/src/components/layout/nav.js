export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/users", label: "Users", icon: "👤" },
  { href: "/listings", label: "Listings", icon: "📦" },
  { href: "/claims", label: "Claims", icon: "🧾" },
  { href: "/matches", label: "Matches", icon: "🔗" },
  { href: "/spam", label: "Spam", icon: "⚠️" },
  { href: "/reports", label: "Reports", icon: "🚩" },
  { href: "/verification", label: "Verification", icon: "🛡️" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/audit-log", label: "Audit Log", icon: "📜" },
];

// Shown in the sidebar so the intended IA is visible end-to-end, but not
// yet navigable — no backend admin endpoint exists for it yet.
export const UPCOMING_NAV_ITEMS = [{ label: "Settings", icon: "⚙️" }];
