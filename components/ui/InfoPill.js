import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { colors } from "../../constants/theme";
import { radius } from "../../constants/layout";

function renderIcon(iconSet, icon, size, color) {
  if (!icon) {
    return null;
  }

  if (iconSet === "feather") {
    return <Feather name={icon} size={size} color={color} />;
  }

  if (iconSet === "material-community") {
    return <MaterialCommunityIcons name={icon} size={size} color={color} />;
  }

  return <Ionicons name={icon} size={size} color={color} />;
}

export default function InfoPill({
  label,
  icon,
  iconSet = "ionicons",
  variant = "surface",
  onPress,
  fullWidth = false,
  accessibilityLabel,
  disabled = false,
  iconSize = 13,
  numberOfLines = 1,
  style,
  textStyle,
}) {
  const isAccent = variant === "accent";
  const isMuted = variant === "muted";

  const Container = onPress ? Pressable : View;

  const iconColor = isAccent ? colors.textDark : colors.textSecondary;
  const labelColor = isAccent ? styles.textAccent : styles.textDefault;

  return (
    <Container
      style={[
        styles.base,
        isAccent && styles.accent,
        isMuted && styles.muted,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {renderIcon(iconSet, icon, iconSize, iconColor)}

      <Text
        style={[
          styles.text,
          labelColor,
          icon ? styles.textWithIcon : null,
          textStyle,
        ]}
        numberOfLines={numberOfLines}
      >
        {label}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  textDefault: {
    color: colors.textSecondary,
  },
  textAccent: {
    color: colors.textDark,
  },
  textWithIcon: {
    marginLeft: 6,
  },
});