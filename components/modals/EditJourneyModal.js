import { Modal, ScrollView, StyleSheet } from "react-native";

import EditableImageManager from "../ui/EditableImageManager";
import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import ModalTextField from "./shared/ModalTextField";
import { spacing } from "../../constants/layout";

// Modal for updating a saved journey, including its text details and photos.
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
      // Prevent the modal from being dismissed while changes are saving.
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
          <ModalTextField
            label="Journey title"
            iconName="type"
            value={editingRouteTitle}
            onChangeText={setEditingRouteTitle}
            placeholder="Forest walk"
            editable={!savingRouteEdit}
          />

          <ModalTextField
            label="Note"
            iconName="edit-3"
            value={editingRouteNote}
            onChangeText={setEditingRouteNote}
            placeholder="Anything special about this journey?"
            editable={!savingRouteEdit}
            multiline
          />

          {/* Reuse the shared image manager so photo editing stays consistent
              with the rest of the app while the parent handles the update logic. */}
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