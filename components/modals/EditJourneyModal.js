import { Modal, ScrollView, StyleSheet } from "react-native";

import EditableImageManager from "../ui/EditableImageManager";
import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import ModalTextField from "./shared/ModalTextField";
import { spacing } from "../../constants/layout";

// Modal used to edit an already saved journey.
// It now supports both text editing and full photo CRUD in one place.
export default function EditJourneyModal({
  visible,
  savingRouteEdit,
  editingRouteTitle,
  setEditingRouteTitle,
  editingRouteNote,
  setEditingRouteNote,
  editingRouteImages,
  onAddImages,
  onReplaceImage,
  onRemoveImage,
  onRemoveAllImages,
  onClose,
  onSaveChanges,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // While saving, closing is temporarily blocked
      // so the modal cannot be dismissed in the middle of the update.
      onRequestClose={savingRouteEdit ? undefined : onClose}
    >
      <ModalCardShell>
        <ModalHeader
          title="Edit journey"
          subtitle="Update the title, note, or photos for this saved journey."
          onClose={onClose}
          disabled={savingRouteEdit}
          closeLabel="Close edit journey modal"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Title field for the saved journey. */}
          <ModalTextField
            label="Journey title"
            iconName="type"
            value={editingRouteTitle}
            onChangeText={setEditingRouteTitle}
            placeholder="Forest walk"
            editable={!savingRouteEdit}
          />

          {/* Optional note field for extra journey details. */}
          <ModalTextField
            label="Note"
            iconName="edit-3"
            value={editingRouteNote}
            onChangeText={setEditingRouteNote}
            placeholder="Anything special about this journey?"
            editable={!savingRouteEdit}
            multiline
          />

          {/* Shared image manager keeps journey photo actions consistent
              with the place form, while the hook handles the actual logic. */}
          <EditableImageManager
            label="Journey photos"
            images={editingRouteImages}
            onAddImages={onAddImages}
            onReplaceImage={onReplaceImage}
            onRemoveImage={onRemoveImage}
            onRemoveAllImages={onRemoveAllImages}
            disabled={savingRouteEdit}
            emptyTitle="Add journey photos"
            emptyHint="Tap to choose or take one"
            addMoreLabel="Add more"
            removeAllLabel="Remove all"
            coverLabel="Cover"
            helperText="Use the buttons below each photo to replace or remove one image without affecting the others."
            stageHeight={180}
          />
        </ScrollView>

        {/* Bottom action buttons for cancelling or saving the edit. */}
        <ModalActionRow
          leftAction={{
            label: "Cancel",
            onPress: onClose,
            disabled: savingRouteEdit,
            variant: "secondary",
            accessibilityLabel: "Cancel editing journey",
          }}
          rightAction={{
            label: "Save changes",
            onPress: onSaveChanges,
            disabled: savingRouteEdit,
            loading: savingRouteEdit,
            iconName: "save",
            variant: "accent",
            accessibilityLabel: "Save journey changes",
          }}
        />
      </ModalCardShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.sm,
  },
});