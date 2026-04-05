import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

export default function SaveTripModal({
  visible,
  savingTripChoice,
  finishedTripDraft,
  finishedTripTitle,
  setFinishedTripTitle,
  finishedTripNote,
  setFinishedTripNote,
  finishedTripDistanceText,
  finishedTripDurationText,
  finishedTripLocationLine,
  onClose,
  onSaveAsJourney,
  onSaveAsPlace,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.previewOverlay}>
        <View style={styles.tripSaveModal}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>Journey finished</Text>

            <Pressable
              style={styles.previewCloseButton}
              onPress={onClose}
              disabled={savingTripChoice}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.tripSaveLead}>
            Your live route is ready to save.
          </Text>

          {finishedTripDraft ? (
            <>
              <View style={styles.tripSummaryCard}>
                {finishedTripLocationLine ? (
                  <View style={styles.inlineRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={colors.textDark}
                    />
                    <Text style={styles.tripSummaryLocation}>
                      {finishedTripLocationLine}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.tripSummaryMetaRow}>
                  <View style={styles.tripSummaryPill}>
                    <Ionicons
                      name="navigate-outline"
                      size={13}
                      color={colors.textDark}
                    />
                    <Text style={styles.tripSummaryPillText}>
                      {finishedTripDistanceText}
                    </Text>
                  </View>

                  <View style={styles.tripSummaryPill}>
                    <Feather
                      name="clock"
                      size={13}
                      color={colors.textDark}
                    />
                    <Text style={styles.tripSummaryPillText}>
                      {finishedTripDurationText}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputLabelRow}>
                <Feather name="type" size={15} color={colors.textSecondary} />
                <Text style={styles.inputLabel}>Journey title</Text>
              </View>

              <TextInput
                style={styles.input}
                value={finishedTripTitle}
                onChangeText={setFinishedTripTitle}
                placeholder="Loch Lomond walk"
                placeholderTextColor={colors.textDim}
              />

              <View style={styles.inputLabelRow}>
                <Feather
                  name="edit-3"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={styles.inputLabel}>Optional note</Text>
              </View>

              <TextInput
                style={[styles.input, styles.tripSaveTextarea]}
                value={finishedTripNote}
                onChangeText={setFinishedTripNote}
                placeholder="A calm walk, lovely views, windy near the end..."
                placeholderTextColor={colors.textDim}
                multiline
                textAlignVertical="top"
              />
            </>
          ) : null}

          <View style={styles.tripSaveActionStack}>
            <Pressable
              style={styles.primaryButton}
              onPress={onSaveAsJourney}
              disabled={savingTripChoice}
            >
              <View style={styles.buttonContent}>
                {savingTripChoice ? (
                  <ActivityIndicator size="small" color={colors.textDark} />
                ) : (
                  <Ionicons
                    name="trail-sign-outline"
                    size={16}
                    color={colors.textDark}
                  />
                )}
                <Text style={styles.primaryButtonText}>Save as journey</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.tripPlaceButton}
              onPress={onSaveAsPlace}
              disabled={savingTripChoice}
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.tripPlaceButtonText}>Save as place</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.tripDiscardButton}
              onPress={onClose}
              disabled={savingTripChoice}
            >
              <Text style={styles.tripDiscardButtonText}>Not now</Text>
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
  tripSummaryCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: spacing.lg,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  tripSummaryLocation: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  tripSummaryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
  },
  tripSummaryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  tripSummaryPillText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
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
  tripPlaceButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.md,
  },
  tripPlaceButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  tripDiscardButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: spacing.sm,
  },
  tripDiscardButtonText: {
    color: "#B7C8BE",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});