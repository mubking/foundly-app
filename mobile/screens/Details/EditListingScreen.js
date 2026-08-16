import React from "react";
import { useRoute } from "@react-navigation/native";

import EditLostItemScreen from "../Lost/EditLostItemScreen";
import EditFoundItemScreen from "../Found/EditFoundItemScreen";

/**
 * Single "EditListing" nav entry that dispatches to the Lost- or
 * Found-specific edit screen based on `route.params.type` — ItemDetails
 * only knows one item type at a time, so this keeps the navigator from
 * needing two separate routes for what's really one "edit this listing"
 * action from the caller's point of view.
 */
export default function EditListingScreen() {
  const route = useRoute();
  return route.params?.type === "found" ? <EditFoundItemScreen /> : <EditLostItemScreen />;
}
