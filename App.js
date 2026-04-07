import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import HomeScreen from "./features/home/HomeScreen";
import WelcomeScreen from "./features/home/WelcomeScreen";
import PlacesScreen from "./features/places/PlacesScreen";
import AddPlaceScreen from "./features/places/AddPlaceScreen";
import JourneysScreen from "./features/journeys/JourneysScreen";
import SafetyScreen from "./features/safety/SafetyScreen";
import SaveTripModal from "./components/modals/SaveTripModal";
import EditJourneyModal from "./components/modals/EditJourneyModal";
import useTravelApp from "./hooks/useTravelApp";
import { colors, shadows } from "./constants/theme";
import { radius, screen } from "./constants/layout";

function TabButton({ label, icon, isActive, onPress }) {
  return (
    <Pressable
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={19}
        color={isActive ? colors.textDark : "#D3DED7"}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();

  const {
    showWelcome,
    setShowWelcome,
    activeTab,
    setActiveTab,
    loading,

    title,
    note,
    images,
    placeName,
    latitude,
    longitude,
    locationLoading,
    setTitle,
    setNote,

    editingPlace,
    editingRoute,
    editingRouteTitle,
    setEditingRouteTitle,
    editingRouteNote,
    setEditingRouteNote,
    savingRouteEdit,

    placesWithDetails,
    filteredPlaces,
    mapPlaces,
    routes,
    recentRoutes,
    latestRoute,
    activeRouteLink,

    search,
    setSearch,
    countries,
    cities,
    selectedCountry,
    selectedCity,
    hasActiveFilters,
    setSelectedCountry,
    setSelectedCity,

    saveTripModalVisible,
    finishedTripTitle,
    setFinishedTripTitle,
    finishedTripNote,
    setFinishedTripNote,
    savingTripChoice,
    finishedTripDistanceText,
    finishedTripDurationText,
    finishedTripLocationLine,

    savePlace,
    cancelEditing,
    openImageOptions,
    confirmRemoveAllImages,
    getCurrentLocation,
    clearLocation,
    removePlace,
    startEditing,

    removeRoute,
    startEditingJourney,
    closeRouteEditing,
    saveRouteChanges,
    openJourneyPhotoOptions,

    handleTripFinished,
    closeFinishedTripModal,
    saveFinishedTripAsJourney,

    clearForm,
  } = useTravelApp();

  const safeBottomInset = insets.bottom;
  const tabBarBottomOffset = Math.max(safeBottomInset, 8) + 8;
  const contentBottomPadding =
    Math.max(safeBottomInset, 8) + screen.tabBarMinHeight + 10;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#EAF2EC" />
        <Text style={styles.loadingText}>Loading WildTales...</Text>
      </View>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingBottom: contentBottomPadding }]}>
        {activeTab === "home" ? (
          <HomeScreen
            featuredPlace={placesWithDetails[0] || null}
            recentPlaces={placesWithDetails.slice(0, 3)}
            recentRoutes={recentRoutes}
            totalPlaces={placesWithDetails.length}
            totalRoutes={routes.length}
            activeRouteLink={activeRouteLink}
            latestRoute={latestRoute}
            onOpenPlaces={() => setActiveTab("places")}
            onOpenRoutes={() => setActiveTab("journeys")}
            onOpenAdd={() => {
              clearForm();
              setActiveTab("add");
            }}
            onEditPlace={startEditing}
            onEditRoute={startEditingJourney}
            onRemovePlace={removePlace}
            onRemoveRoute={removeRoute}
            onAddJourneyPhotos={openJourneyPhotoOptions}
          />
        ) : activeTab === "places" ? (
          <PlacesScreen
            places={filteredPlaces}
            totalPlaces={placesWithDetails.length}
            mapPlaces={mapPlaces}
            search={search}
            setSearch={setSearch}
            onRemovePlace={removePlace}
            onEditPlace={startEditing}
            countries={countries}
            cities={cities}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            onSelectCountry={(value) => {
              setSelectedCountry(value);
              setSelectedCity("All");
            }}
            onSelectCity={setSelectedCity}
            onClearFilters={() => {
              setSearch("");
              setSelectedCountry("All");
              setSelectedCity("All");
            }}
            hasActiveFilters={hasActiveFilters}
            activeRouteLink={activeRouteLink}
          />
        ) : activeTab === "safety" ? (
          <SafetyScreen onTripFinished={handleTripFinished} />
        ) : activeTab === "journeys" ? (
          <JourneysScreen
            routes={routes}
            onRemoveRoute={removeRoute}
            onEditRoute={startEditingJourney}
            onAddJourneyPhotos={openJourneyPhotoOptions}
          />
        ) : (
          <AddPlaceScreen
            title={title}
            note={note}
            images={images}
            placeName={placeName}
            latitude={latitude}
            longitude={longitude}
            locationLoading={locationLoading}
            setTitle={setTitle}
            setNote={setNote}
            onSavePlace={savePlace}
            onCancel={cancelEditing}
            onOpenImageOptions={openImageOptions}
            onRemoveAllImages={confirmRemoveAllImages}
            onGetLocation={getCurrentLocation}
            onClearLocation={clearLocation}
            isEditing={Boolean(editingPlace)}
          />
        )}
      </View>

      <View
        style={[
          styles.tabBarWrap,
          {
            left: screen.tabBarSideInset,
            right: screen.tabBarSideInset,
            bottom: tabBarBottomOffset,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.tabBar}>
          <TabButton
            label="Home"
            icon="home-outline"
            isActive={activeTab === "home"}
            onPress={() => setActiveTab("home")}
          />

          <TabButton
            label="Places"
            icon="images-outline"
            isActive={activeTab === "places"}
            onPress={() => setActiveTab("places")}
          />

          <TabButton
            label="Safety"
            icon="shield-checkmark-outline"
            isActive={activeTab === "safety"}
            onPress={() => setActiveTab("safety")}
          />

          <TabButton
            label="Routes"
            icon="trail-sign-outline"
            isActive={activeTab === "journeys"}
            onPress={() => setActiveTab("journeys")}
          />

          <TabButton
            label="Add"
            icon="add-circle-outline"
            isActive={activeTab === "add"}
            onPress={() => {
              if (activeTab !== "add") {
                clearForm();
              }
              setActiveTab("add");
            }}
          />
        </View>
      </View>

      <SaveTripModal
        visible={saveTripModalVisible}
        saving={savingTripChoice}
        tripTitle={finishedTripTitle}
        setTripTitle={setFinishedTripTitle}
        tripNote={finishedTripNote}
        setTripNote={setFinishedTripNote}
        distanceText={finishedTripDistanceText}
        durationText={finishedTripDurationText}
        locationLine={finishedTripLocationLine}
        onClose={closeFinishedTripModal}
        onSaveJourney={saveFinishedTripAsJourney}
      />

      <EditJourneyModal
        visible={Boolean(editingRoute)}
        savingRouteEdit={savingRouteEdit}
        editingRouteTitle={editingRouteTitle}
        setEditingRouteTitle={setEditingRouteTitle}
        editingRouteNote={editingRouteNote}
        setEditingRouteNote={setEditingRouteNote}
        onClose={closeRouteEditing}
        onSaveChanges={saveRouteChanges}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#EAF2EC",
    marginTop: 14,
    fontSize: 16,
  },
  tabBarWrap: {
    position: "absolute",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(8, 26, 18, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(214, 232, 219, 0.08)",
    borderRadius: radius.xxl,
    ...shadows.tabActive,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    color: "#D3DED7",
    fontSize: 10,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: colors.textDark,
  },
});