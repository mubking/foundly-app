import { ITEMS } from "./homeMockData";

export const MY_FOUND_ITEMS = [
  { ...ITEMS[0], status: "claim_pending", foundDays: 0 },
  { ...ITEMS[2], status: "returned", foundDays: 3 },
  { ...ITEMS[4], status: "returned", foundDays: 7 },
];

export const SUMMARY_STATS = [
  { label: "Total Found", value: "12", colorKey: "primary" },
  { label: "Returned", value: "9", colorKey: "success" },
  { label: "Pending", value: "3", colorKey: "secondary" },
];
