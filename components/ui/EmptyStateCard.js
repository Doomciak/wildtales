import { StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";

// Simple empty state card shown when there is no data to display.
export default function EmptyStateCard({
  title,
  text,
  icon,
  iconSet = "ionicons",
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        {/* Pick the icon component based on the icon set passed into the card */}
        {iconSet === "material-community" ? (
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={colors.textSecondary}
          />
        ) : (
          <Ionicons name={icon} size={24} color={colors.textSecondary} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});