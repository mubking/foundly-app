// Must stay in sync with the backend's category enum — see
// backend/src/models/FoundItem.js, models/LostItem.js, and
// validations/{found,lost}-item.validation.js. These labels are submitted to
// the API, so an unlisted label fails validation server-side.
export const ITEM_CATEGORIES = [
  { emoji: "📱", label: "Phone" },
  { emoji: "💻", label: "Laptop" },
  { emoji: "💳", label: "Wallet" },
  { emoji: "👜", label: "Bag" },
  { emoji: "🔑", label: "Keys" },
  { emoji: "📄", label: "Documents" },
  { emoji: "💍", label: "Jewelry" },
  { emoji: "👕", label: "Clothing" },
  { emoji: "🐾", label: "Pet" },
  { emoji: "✨", label: "Other" },
];
