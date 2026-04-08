import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

// Small button used for filter and sort options.
export default function FilterChip({ label, active, onPress }) {
  return (
    <Pressable
      // Change the chip style when this option is currently selected.
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        // Text colour also changes to match the active state.
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: colors.textDark,
  },
});