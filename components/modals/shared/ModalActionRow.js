import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors } from "../../../constants/theme";
import { radius, spacing } from "../../../constants/layout";

function ActionButton({ action, side }) {
  if (!action) {
    return (
      <View
        style={[styles.button, side === "left" ? styles.leftGap : styles.rightGap]}
      />
    );
  }

  const {
    label,
    onPress,
    disabled = false,
    loading = false,
    iconName,
    iconColor,
    variant = "secondary",
    accessibilityLabel,
  } = action;

  const isAccent = variant === "accent";
  const isMuted = variant === "muted";
  const isDanger = variant === "danger";

  const buttonStyle = [
    styles.button,
    side === "left" ? styles.leftGap : styles.rightGap,
    isAccent && styles.accentButton,
    isMuted && styles.mutedButton,
    isDanger && styles.dangerButton,
    disabled && styles.disabledButton,
  ];

  const textStyle = [
    styles.buttonText,
    isAccent && styles.accentButtonText,
    isMuted && styles.mutedButtonText,
    isDanger && styles.dangerButtonText,
  ];

  const spinnerColor = isAccent ? colors.textDark : colors.textSecondary;

  return (
    <Pressable
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {iconName ? (
            <Feather
              name={iconName}
              size={14}
              color={iconColor || (isAccent ? colors.textDark : colors.textSecondary)}
              style={styles.icon}
            />
          ) : null}

          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ModalActionRow({ leftAction, rightAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <ActionButton action={leftAction} side="left" />
      <ActionButton action={rightAction} side="right" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    minHeight: 46,
  },
  leftGap: {
    marginRight: 6,
  },
  rightGap: {
    marginLeft: 6,
  },
  accentButton: {
    backgroundColor: colors.accent,
  },
  mutedButton: {
    backgroundColor: colors.surfaceMuted,
  },
  dangerButton: {
    backgroundColor: "#c63d3d",
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 6,
  },
  buttonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  accentButtonText: {
    color: colors.textDark,
  },
  mutedButtonText: {
    color: colors.textSecondary,
  },
  dangerButtonText: {
    color: colors.white,
  },
});