import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import { spacing } from "../../constants/layout";

// Shared header used at the top of screens.
export default function ScreenHeader({
  title,
  subtitle,
  maxWidth = 320,
  style,
  titleStyle,
  subtitleStyle,
}) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>

      {/* Subtitle is optional, so only render it when it exists */}
      {subtitle ? (
        <Text style={[styles.subtitle, { maxWidth }, subtitleStyle]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: "800",
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});