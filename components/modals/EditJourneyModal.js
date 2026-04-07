import { Modal, ScrollView, StyleSheet } from "react-native";

import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import ModalTextField from "./shared/ModalTextField";
import { spacing } from "../../constants/layout";

export default function EditJourneyModal({
  visible,
  savingRouteEdit,
  editingRouteTitle,
  setEditingRouteTitle,
  editingRouteNote,
  setEditingRouteNote,
  onClose,
  onSaveChanges,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={savingRouteEdit ? undefined : onClose}
    >
      <ModalCardShell>
        <ModalHeader
          title="Edit journey"
          subtitle="Update the title or note for this saved journey."
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