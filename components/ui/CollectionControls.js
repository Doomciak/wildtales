import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { colors, shadows } from "../../constants/theme";
import { radius, spacing } from "../../constants/layout";
import FilterChip from "./FilterChip";

// Search bar with optional filter and sort controls for collection-style screens.
export default function CollectionControls({
  search = "",
  onChangeSearch,
  searchPlaceholder = "Search",
  showControls = false,
  onToggleControls,
  activeCount = 0,
  hasActiveControls = false,
  onClear,
  summary,
  sections = [],
  toggleAccessibilityLabel = "Open filters and sorting",
}) {
  return (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9fb2a6" />

          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor="#9fb2a6"
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
          />

          {/* Only show the clear button when the search field has text. */}
          {search.trim() ? (
            <Pressable
              onPress={() => onChangeSearch?.("")}
              style={styles.searchClearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color="#9fb2a6" />
            </Pressable>
          ) : null}
        </View>

        {/* Toggle the expanded filter and sort panel. */}
        <Pressable
          style={[
            styles.toggleButton,
            showControls && styles.toggleButtonActive,
          ]}
          onPress={onToggleControls}
          accessibilityRole="button"
          accessibilityLabel={toggleAccessibilityLabel}
        >
          <Feather
            name="sliders"
            size={18}
            color={showControls ? colors.textDark : colors.textSecondary}
          />

          {/* Show how many filters or sort options are currently active. */}
          {activeCount > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {showControls ? (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Filters & sort</Text>

            {/* Only show clear when there is something to reset. */}
            {hasActiveControls ? (
              <Pressable
                style={styles.clearButton}
                onPress={onClear}
                accessibilityRole="button"
                accessibilityLabel="Clear filters and sorting"
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Each section renders one group of filter or sort choices. */}
          {sections.map((section) => (
            <View key={section.key || section.title} style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>{section.title}</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {section.options.map((option) => {
                  // Support both plain string options and object-based options.
                  const value =
                    typeof option === "object" ? option.value : option;
                  const label =
                    typeof option === "object" ? option.label : option;

                  return (
                    <FilterChip
                      key={`${section.key || section.title}-${value}`}
                      label={label}
                      active={section.selectedValue === value}
                      onPress={() => section.onSelect?.(value)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          ))}

          {/* Optional short summary shown under the controls. */}
          {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    height: 48,
    marginLeft: 10,
  },
  searchClearButton: {
    marginLeft: spacing.sm,
  },
  toggleButton: {
    width: 54,
    height: 54,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
    ...shadows.tabActive,
  },
  countBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  countText: {
    color: colors.textDark,
    fontSize: 10,
    fontWeight: "700",
  },
  panel: {
    backgroundColor: "#142B20",
    borderRadius: radius.xxxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  clearButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearButtonText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    paddingRight: spacing.sm,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});