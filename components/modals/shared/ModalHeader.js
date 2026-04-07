import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors } from "../../../constants/theme";
import { spacing } from "../../../constants/layout";

export default function ModalHeader({
  title,
  subtitle,
  onClose,
  disabled = false,
  closeLabel = "Close modal",
  titleStyle,
  subtitleStyle,
  containerStyle,
}) {
  return (
    <View
      style={[
        styles.header,
        !subtitle && styles.headerCentered,
        containerStyle,
      ]}
    >
      <View style={styles.headerTextWrap}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>

        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.closeButton}
        onPress={onClose}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      >
        <Feather name="x" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  headerCentered: {
    alignItems: "center",
    marginBottom: spacing.lg - 2,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
});