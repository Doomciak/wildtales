import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.previewOverlay}>
        <View style={styles.tripSaveModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>Edit journey</Text>

            <Pressable
              style={styles.previewCloseButton}
              onPress={onClose}
              disabled={savingRouteEdit}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.tripSaveLead}>
            Update the title or note for this saved journey.
          </Text>

          <View style={styles.inputLabelRow}>
            <Feather name="type" size={15} color={colors.textSecondary} />
            <Text style={styles.inputLabel}>Journey title</Text>
          </View>

          <TextInput
            style={styles.input}
            value={editingRouteTitle}
            onChangeText={setEditingRouteTitle}
            placeholder="Forest walk"
            placeholderTextColor={colors.textDim}
          />

          <View style={styles.inputLabelRow}>
            <Feather name="edit-3" size={15} color={colors.textSecondary} />
            <Text style={styles.inputLabel}>Note</Text>
          </View>

          <TextInput
            style={[styles.input, styles.tripSaveTextarea]}
            value={editingRouteNote}
            onChangeText={setEditingRouteNote}
            placeholder="Anything special about this journey?"
            placeholderTextColor={colors.textDim}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.tripSaveActionStack}>
            <Pressable
              style={styles.primaryButton}
              onPress={onSaveChanges}
              disabled={savingRouteEdit}
            >
              <View style={styles.buttonContent}>
                {savingRouteEdit ? (
                  <ActivityIndicator size="small" color={colors.textDark} />
                ) : (
                  <Feather name="save" size={16} color={colors.textDark} />
                )}
                <Text style={styles.primaryButtonText}>Save changes</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={onClose}
              disabled={savingRouteEdit}
            >
              <View style={styles.buttonContent}>
                <Feather name="x" size={15} color="#B7C8BE" />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    padding: spacing.xl,
  },
  tripSaveModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl + 2,
    padding: 18,
    maxHeight: "90%",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg - 2,
  },
  previewHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  previewCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  tripSaveLead: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  tripSaveTextarea: {
    minHeight: 110,
    marginBottom: spacing.sm,
  },
  tripSaveActionStack: {
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#B7C8BE",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});