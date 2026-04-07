import { Pressable, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors, shadows } from "../../constants/theme";

export default function ActionIconButton({
  icon,
  iconSet = "feather",
  onPress,
  accessibilityLabel,
  variant = "secondary",
  size = 38,
  style,
  disabled = false,
}) {
  const iconColor =
    variant === "primary" ? colors.textDark : colors.textSecondary;

  const buttonStyle = [
    styles.button,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    variant === "primary" && styles.buttonPrimary,
    variant === "danger" && styles.buttonDanger,
    disabled && styles.buttonDisabled,
    style,
  ];

  return (
    <Pressable
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {iconSet === "ionicons" ? (
        <Ionicons name={icon} size={16} color={iconColor} />
      ) : (
        <Feather name={icon} size={16} color={iconColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    ...shadows.tabActive,
  },
  buttonDanger: {
    backgroundColor: colors.surfaceMuted,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});