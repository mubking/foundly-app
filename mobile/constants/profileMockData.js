import images from "./images";

export const PROFILE_USER = {
  name: "Alex Johnson",
  handle: "@alexj",
  location: "New York, NY",
  initials: "AJ",
  avatar: images.avatars.alexJohnson,
};

export const TRUST_SCORE = {
  score: 4.9,
  maxScore: 5,
  percent: 0.97,
  stats: [
    { label: "Items Returned", value: "23", icon: "📦" },
    { label: "Rewards Earned", value: "$340", icon: "💰" },
    { label: "Response Rate", value: "98%", icon: "⚡" },
  ],
};

export const ACHIEVEMENTS = [
  { emoji: "🏆", label: "Top Returner", color: "#F59E0B" },
  { emoji: "⭐", label: "5-Star Finder", color: "#2563EB" },
  { emoji: "🤝", label: "Community Hero", color: "#22C55E" },
  { emoji: "🔥", label: "30-Day Streak", color: "#EF4444" },
  { emoji: "🎯", label: "Precision Claimer", color: "#8B5CF6" },
];

export const PROFILE_MENU = [
  {
    key: "myLost",
    icon: "package",
    label: "My Lost Items",
    subtitle: "3 active reports",
    badge: "3",
    color: "#EF4444",
    route: "MyLostItems",
  },
  {
    key: "myFound",
    icon: "search",
    label: "My Found Items",
    subtitle: "12 items, 9 returned",
    badge: "12",
    color: "#22C55E",
    route: "MyFoundItems",
  },
  {
    key: "rewards",
    icon: "gift",
    label: "Reward History",
    subtitle: "$340 earned lifetime",
    badge: null,
    color: "#F59E0B",
    route: "RewardHistory",
  },
  {
    key: "messages",
    icon: "message",
    label: "Messages",
    subtitle: "2 unread conversations",
    badge: "2",
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
