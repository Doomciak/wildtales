import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import ScreenHeader from "../../components/ui/ScreenHeader";
import { colors } from "../../constants/theme";
import { radius, screen, spacing } from "../../constants/layout";

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
  onRemoveAllImages,
  onGetLocation,
  onClearLocation,
  isEditing,
}) {
  const coverImage = images[0] || null;
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

        <View style={styles.field}>
          <View style={styles.inputLabelRow}>
            <Feather name="image" size={15} color={colors.textSecondary} />
            <Text style={styles.inputLabel}>Photos</Text>
          </View>

          <Pressable
            style={[styles.imageStage, !coverImage && styles.imageStageCompact]}
            onPress={onOpenImageOptions}
            onLongPress={onRemoveAllImages}
            accessibilityRole="button"
            accessibilityLabel={
              coverImage ? "Edit place photos" : "Add place photos"
            }
          >
            {coverImage ? (
              <>
                <Image source={{ uri: coverImage }} style={styles.imageStageImage} />

                <View style={styles.imageBadgeTopRight}>
                  <Feather name="edit-2" size={15} color={colors.textDark} />
                </View>

                {images.length > 0 ? (
                  <View style={styles.imageCountPill}>
                    <Feather name="image" size={12} color={colors.textPrimary} />
                    <Text style={styles.imageCountText}>
                      {images.length} photo{images.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.imageBadgeTopRight}>
                  <Feather name="edit-2" size={15} color={colors.textDark} />
                </View>

                <View style={styles.emptyImageContent}>
                  <View style={styles.emptyImageIconWrap}>
                    <Ionicons
                      name="images-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                  <Text style={styles.imageStageTitle}>Add photos</Text>
                  <Text style={styles.imageStageHint}>
                    Tap to choose or take one
                  </Text>
                </View>
              </>
            )}
          </Pressable>

          {images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addThumbsRow}
            >
              {images.map((uri, index) => (
                <Pressable
                  key={`${uri}-${index}`}
                  onPress={onOpenImageOptions}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit photo ${index + 1}`}
                >
                  <Image source={{ uri }} style={styles.addThumb} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {images.length > 0 ? (
            <Text style={styles.photoRemoveHint}>
              Long press the photo area to remove all photos
            </Text>
          ) : null}
        </View>

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
  imageStage: {
    height: 190,
    borderRadius: radius.xxl - 2,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  imageStageCompact: {
    height: 150,
  },
  imageStageImage: {
    width: "100%",
    height: "100%",
  },
  imageBadgeTopRight: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  emptyImageContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyImageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  imageStageTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  imageStageHint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  imageCountPill: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,37,27,0.82)",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  imageCountText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  addThumbsRow: {
    paddingRight: 6,
    marginBottom: 10,
  },
  addThumb: {
    width: 74,
    height: 74,
    borderRadius: radius.md,
    marginRight: 10,
  },
  photoRemoveHint: {
    color: colors.textDim,
    fontSize: 12,
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