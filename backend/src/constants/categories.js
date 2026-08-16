// Single source of truth for the item category enum — LostItem, FoundItem,
// their create-validation schemas, and the search-suggestions endpoint all
// import this instead of each hand-declaring the same 10 values.
export const ITEM_CATEGORIES = [
  "Phone",
  "Laptop",
  "Wallet",
  "Bag",
  "Keys",
  "Documents",
  "Jewelry",
  "Clothing",
  "Pet",
  "Other",
];
