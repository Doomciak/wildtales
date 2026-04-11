import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import EditableImageManager from "../ui/EditableImageManager";
import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import ModalTextField from "./shared/ModalTextField";
import InfoPill from "../ui/InfoPill";
import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

// Modal shown after a live trip ends so it can be saved as a journey.
export default function SaveTripModal({
  visible,
  saving,
  tripTitle,
  setTripTitle,
  tripNote,
  setTripNote,
  tripImages,
  distanceText,
  durationText,
  locationLine,
  onAddImages,
  onReplaceImage,
  onRemoveImage,
  onRemoveAllImages,
  onClose,
  onSaveJourney,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Prevent the modal from closing while the save is still in progress.
      onRequestClose={saving ? undefined : onClose}
    >
      <ModalCardShell>
        <ModalHeader
          title="Save finished journey"
          subtitle="Keep this route in Journeys with its snapshot, stats, and photos."
          onClose={onClose}
          disabled={saving}
          closeLabel="Close save journey modal"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Show a quick summary of the finished trip before it is saved. */}
          <View style={styles.summaryCard}>
            <View style={styles.statsWrap}>
              <InfoPill
                icon="navigate-outline"
                label={distanceText}
                style={styles.statPillItem}
              />

              <InfoPill
                icon="clock"
                iconSet="feather"
                label={durationText}
                style={styles.statPillItem}
              />
            </View>

            {/* Only show the location line when route location details are available. */}
            {locationLine ? (
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.locationText}>{locationLine}</Text>
              </View>
            ) : null}
          </View>

          <ModalTextField
            label="Journey title"
            value={tripTitle}
            onChangeText={setTripTitle}
            placeholder="Forest walk"
            editable={!saving}
          />

          <ModalTextField
            label="Journey note"
            value={tripNote}
            onChangeText={setTripNote}
            placeholder="Anything special about this journey?"
            editable={!saving}
            multiline
          />

          {/* Reuse the shared photo manager here so images can be adjusted
              before the journey is saved for the first time. */}
          <EditableImageManager
            label="Journey photos"
            images={tripImages}
            onAddImages={onAddImages}
            onReplaceImage={onReplaceImage}
            onRemoveImage={onRemoveImage}
            onRemoveAllImages={onRemoveAllImages}
            disabled={saving}
            emptyTitle="Add journey photos"
            emptyHint="Tap to choose or take one"
            addMoreLabel="Add more"
            removeAllLabel="Remove all"
            coverLabel="Cover"
            helperText="Use the thumbnail buttons below to replace or remove one photo before saving this journey."
            stageHeight={180}
          />
        </ScrollView>

        <ModalActionRow
          leftAction={{
            label: "Cancel",
            onPress: onClose,
            disabled: saving,
            variant: "secondary",
            accessibilityLabel: "Cancel saving journey",
          }}
          rightAction={{
            label: "Save journey",
            onPress: onSaveJourney,
            disabled: saving,
            loading: saving,
            iconName: "save",
            variant: "accent",
            accessibilityLabel: "Save finished journey",
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
  summaryCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl - 2,
    padding: 14,
    marginBottom: spacing.lg,
  },
  statsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xs,
  },
  statPillItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: spacing.sm,
    flexShrink: 1,
    lineHeight: 18,
  },
});