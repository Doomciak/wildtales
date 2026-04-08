import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import EditableImageManager from "../../components/ui/EditableImageManager";
import ScreenHeader from "../../components/ui/ScreenHeader";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";

// Screen used for both creating a new place and editing an existing one.
export default function AddPlaceScreen({
  title,
  note,
  images,
  placeName,
  latitude,
  longitude,
  locationLoading,
  setTitle,
  setNote,
  onSavePlace,
  onCancel,
  onOpenImageOptions,
  onReplaceImage,
  onRemoveImage,
  onRemoveAllImages,
  onGetLocation,
  onClearLocation,
  isEditing,
}) {
  // Used to decide whether location details should be shown
  // or whether the user still needs to fetch a location.
  const hasLocation = latitude != null && longitude != null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.addScrollContent}
    >
      <ScreenHeader
        title={isEditing ? "Update place" : "Add a place"}
        subtitle="Save the places you want to remember beautifully."
        maxWidth={280}
        style={styles.addHeader}
      />

      <View style={styles.formCard}>
        <View style={styles.field}>
          <View style={styles.inputLabelRow}>
            <Feather name="type" size={15} color={colors.textSecondary} />
            <Text style={styles.inputLabel}>Place title</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Forest trail"
            placeholderTextColor={colors.textDim}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.inputLabelRow}>
            <Feather name="edit-3" size={15} color={colors.textSecondary} />
            <Text style={styles.inputLabel}>Short note</Text>
          </View>

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="What made this place special?"
            placeholderTextColor={colors.textDim}
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Shared image manager now handles add / replace / remove actions
            so place photo editing behaves the same way as journeys. */}
        <EditableImageManager
          label="Photos"
          images={images}
          onAddImages={onOpenImageOptions}
          onReplaceImage={onReplaceImage}
          onRemoveImage={onRemoveImage}
          onRemoveAllImages={onRemoveAllImages}
          emptyTitle="Add photos"
          emptyHint="Tap to choose or take one"
          addMoreLabel="Add more"
          removeAllLabel="Remove all"
          coverLabel="Cover"
          helperText="Tap the main image to add more. Use the thumbnail buttons below to replace or remove one photo."
          stageHeight={190}
        />

        <View style={styles.field}>
          <View style={styles.inputLabelRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.inputLabel}>Location</Text>
          </View>

          {hasLocation ? (
            <View style={styles.locationCard}>
              {/* Place name is shown only if a readable name was found. */}
              {placeName ? (
                <View style={styles.inlineRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.locationPlaceName}>{placeName}</Text>
                </View>
              ) : null}

              {/* Coordinates are kept visible even if there is no place name. */}
              <View style={styles.inlineRow}>
                <Feather
                  name="crosshair"
                  size={13}
                  color={colors.textPrimary}
                />
                <Text style={styles.locationText}>
                  {Number(latitude).toFixed(3)}, {Number(longitude).toFixed(3)}
                </Text>
              </View>

              <View style={styles.locationActions}>
                <Pressable
                  style={styles.primaryMiniButton}
                  onPress={onGetLocation}
                  disabled={locationLoading}
                >
                  {/* While refreshing location, show a loader instead of the icon. */}
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.textDark} />
                  ) : (
                    <Ionicons
                      name="locate-outline"
                      size={15}
                      color={colors.textDark}
                      style={styles.actionIcon}
                    />
                  )}
                  <Text style={styles.primaryMiniButtonText}>
                    {locationLoading ? "Finding..." : "Refresh"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryMiniButton}
                  onPress={onClearLocation}
                >
                  <Feather
                    name="x-circle"
                    size={15}
                    color={colors.textSecondary}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.secondaryMiniButtonText}>Clear</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // If no location has been added yet, show one main button to fetch it.
            <Pressable
              style={styles.locationButton}
              onPress={onGetLocation}
              disabled={locationLoading}
            >
              <View style={styles.locationButtonContent}>
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Ionicons
                    name="locate-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                )}
                <Text style={styles.locationButtonText}>
                  {locationLoading ? "Finding location..." : "Use current location"}
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.footer}>
          {/* Cancel button is only shown in edit mode. */}
          {isEditing ? (
            <Pressable style={styles.secondaryButton} onPress={onCancel}>
              <Text style={styles.secondaryButtonText}>Cancel editing</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}

          <Pressable style={styles.primaryButton} onPress={onSavePlace}>
            <View style={styles.buttonContent}>
              <Feather name="save" size={14} color={colors.textDark} />
              <Text style={styles.primaryButtonText}>
                {isEditing ? "Update place" : "Save place"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addScrollContent: {
    paddingTop: screen.topPadding,
    paddingBottom: screen.bottomSpacing,
    paddingHorizontal: spacing.xl,
  },
  addHeader: {
    marginBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxxl,
    padding: spacing.xl,
    marginBottom: 18,
  },
  field: {
    marginBottom: spacing.md,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginLeft: spacing.sm,
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
  textarea: {
    minHeight: 130,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  locationCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl - 2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  locationButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  locationPlaceName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  locationText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  locationActions: {
    flexDirection: "row",
  },
  primaryMiniButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 5,
  },
  primaryMiniButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryMiniButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginLeft: 5,
  },
  secondaryMiniButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  locationButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: 10,
  },
  footer: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  footerSpacer: {
    flex: 1,
    marginRight: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  primaryButtonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    marginRight: 6,
  },
});