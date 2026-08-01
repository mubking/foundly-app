import { ITEMS } from "./homeMockData";

export const MY_LOST_ITEMS = [
  { ...ITEMS[1], status: "active", daysAgo: 2 },
  { ...ITEMS[3], status: "claimed", daysAgo: 5 },
  { ...ITEMS[5], status: "returned", daysAgo: 12 },
];

export const STATUS_CONFIG = {
  active: { variant: "amber", label: "Active" },
  claimed: { variant: "primary", label: "Claim Pending" },
  returned: { variant: "green", label: "Returned ✓" },
};

export const SUMMARY_STATS = [
  { label: "Active", value: "1", colorKey: "secondary" },
  { label: "Pending Claim", value: "1", colorKey: "primary" },
  { label: "Returned", value: "1", colorKey: "success" },
];
