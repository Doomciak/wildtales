import { StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors } from "../../../constants/theme";
import { radius, spacing } from "../../../constants/layout";

// Text input used in modals, with an optional icon next to the label.
export default function ModalTextField({
  label,
  iconName,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  minHeight = 110,
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        {/* Show the icon only when one is passed in */}
        {iconName ? (
          <Feather name={iconName} size={15} color={colors.textSecondary} />
        ) : null}

        <Text style={[styles.label, !iconName && styles.labelNoIcon]}>
          {label}
        </Text>
      </View>

      <TextInput
        // If multiline is enabled, allow the input to grow taller
        style={[styles.input, multiline && { minHeight }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        editable={editable}
        multiline={multiline}
        // For multiline fields, start typing from the top instead of the middle
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  labelNoIcon: {
    marginLeft: 0,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});