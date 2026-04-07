import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import ModalActionRow from "./shared/ModalActionRow";
import ModalCardShell from "./shared/ModalCardShell";
import ModalHeader from "./shared/ModalHeader";
import ModalTextField from "./shared/ModalTextField";
import InfoPill from "../ui/InfoPill";
import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

export default function SaveTripModal({
  visible,
  saving,
  tripTitle,
  setTripTitle,
  tripNote,
  setTripNote,
  distanceText,
  durationText,
  locationLine,
  onClose,
  onSaveJourney,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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