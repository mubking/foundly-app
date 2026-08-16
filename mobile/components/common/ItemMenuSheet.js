import React from "react";

import { useTheme } from "../../context/ThemeContext";
import BottomSheet from "./BottomSheet";
import MenuRow from "./MenuRow";
import LinkIcon from "./LinkIcon";
import FlagIcon from "./FlagIcon";
import Edit3Icon from "./Edit3Icon";
import Trash2Icon from "./Trash2Icon";

/** Item Details' 3-dot menu, opened from the hero's overflow button. */
export default function ItemMenuSheet({
  visible,
  onClose,
  isOwner,
  onCopyLink,
  onReport,
  onEdit,
  onDelete,
  deleting,
}) {
  const colors = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <MenuRow
        icon={<LinkIcon size={18} color={colors.primary} />}
        iconColor={colors.primary}
        label="Copy Link"
        showChevron={false}
        onPress={onCopyLink}
      />

      {!isOwner ? (
        <MenuRow
          icon={<FlagIcon size={18} color={colors.danger} />}
          iconColor={colors.danger}
          label="Report Listing"
          labelColor={colors.danger}
          showChevron={false}
          onPress={onReport}
        />
      ) : null}

      {isOwner ? (
        <>
          <MenuRow
            icon={<Edit3Icon size={18} color={colors.primary} />}
            iconColor={colors.primary}
            label="Edit Listing"
            showChevron={false}
            onPress={onEdit}
          />
          <MenuRow
            icon={<Trash2Icon size={18} color={colors.danger} />}
            iconColor={colors.danger}
            label={deleting ? "Deleting…" : "Delete Listing"}
            labelColor={colors.danger}
            showChevron={false}
            onPress={deleting ? undefined : onDelete}
          />
        </>
      ) : null}
    </BottomSheet>
  );
}

