import images from "./images";

export const CURRENT_USER = {
  name: "Alex Johnson",
  initials: "AJ",
  avatar: images.avatars.alexJohnson,
};

export const ITEMS = [
  {
    id: 1,
    type: "found",
    title: "iPhone 15 Pro",
    category: "Electronics",
    location: "Central Park",
    neighborhood: "Midtown, NY",
    time: "2h ago",
    image: images.items.iphone,
    reward: null,
    verified: true,
  },
  {
    id: 2,
    type: "lost",
    title: "Black Leather Wallet",
    category: "Wallet",
    location: "Times Square",
    neighborhood: "Midtown, NY",
    time: "4h ago",
    image: images.items.wallet,
    reward: 50,
    verified: false,
  },
  {
    id: 3,
    type: "found",
    title: "Ray-Ban Aviators",
    category: "Accessories",
    location: "Brooklyn Bridge",
    neighborhood: "DUMBO, NY",
    time: "6h ago",
    image: images.items.sunglasses,
    reward: null,
    verified: true,
  },
  {
    id: 4,
    type: "lost",
    title: "AirPods Pro 2nd Gen",
    category: "Electronics",
    location: "Grand Central",
    neighborhood: "Midtown, NY",
    time: "8h ago",
    image: images.items.airpods,
    reward: 30,
    verified: false,
  },
  {
    id: 5,
    type: "found",
    title: "Vintage Briefcase",
    category: "Bags",
    location: "Penn Station",
    neighborhood: "Midtown, NY",
    time: "1d ago",
    image: images.items.briefcase,
    reward: null,
    verified: true,
  },
  {
    id: 6,
    type: "lost",
    title: "Toyota Car Keys",
    category: "Keys",
    location: "Park Slope",
    neighborhood: "Brooklyn, NY",
    time: "1d ago",
    image: images.items.keys,
    reward: 20,
    verified: false,
  },
];

export const CATEGORIES = [
  { emoji: "📱", label: "Electronics", count: 128 },
  { emoji: "👜", label: "Bags", count: 84 },
  { emoji: "🔑", label: "Keys", count: 213 },
  { emoji: "💳", label: "Wallet", count: 97 },
  { emoji: "👓", label: "Glasses", count: 61 },
  { emoji: "🎧", label: "Audio", count: 45 },
  { emoji: "⌚", label: "Jewelry", count: 72 },
  { emoji: "📄", label: "Docs", count: 38 },
];

export const COMMUNITY_IMPACT = {
  itemsReturned: 2847,
  trend: "+18%",
};

export const QUICK_STATS = [
  { label: "Found Today", value: "52", trend: "+12%", color: "success" },
  { label: "Near You", value: "34", trend: "0.5km", color: "primary" },
  { label: "Avg. Return", value: "2.3d", trend: "Fast", color: "secondary" },
];
