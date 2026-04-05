import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

export default function App() {
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
    routesSorted,
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
    finishedTripDraft,
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

    handleTripFinished,
    closeFinishedTripModal,
    saveFinishedTripAsJourney,
    saveFinishedTripAsPlace,
    saveExistingRouteAsPlace,

    clearForm,
  } = useTravelApp();

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

      <View style={styles.content}>
        {activeTab === "home" ? (
          <HomeScreen
            featuredPlace={placesWithDetails[0] || null}
            recentPlaces={placesWithDetails.slice(0, 3)}
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
            onRemoveRoute={removeRoute}
            onSaveRouteAsPlace={saveExistingRouteAsPlace}
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
            routes={routesSorted}
            onRemoveRoute={removeRoute}
            onSaveRouteAsPlace={saveExistingRouteAsPlace}
            onEditRoute={startEditingJourney}
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

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === "home" && styles.tabActive]}
          onPress={() => setActiveTab("home")}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color={activeTab === "home" ? colors.textDark : "#D3DED7"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "home" && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "places" && styles.tabActive]}
          onPress={() => setActiveTab("places")}
        >
          <Ionicons
            name="images-outline"
            size={20}
            color={activeTab === "places" ? colors.textDark : "#D3DED7"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "places" && styles.tabLabelActive,
            ]}
          >
            Places
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "safety" && styles.tabActive]}
          onPress={() => setActiveTab("safety")}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={activeTab === "safety" ? colors.textDark : "#D3DED7"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "safety" && styles.tabLabelActive,
            ]}
          >
            Safety
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === "journeys" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("journeys")}
        >
          <Ionicons
            name="trail-sign-outline"
            size={20}
            color={activeTab === "journeys" ? colors.textDark : "#D3DED7"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "journeys" && styles.tabLabelActive,
            ]}
          >
            Routes
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "add" && styles.tabActive]}
          onPress={() => {
            if (activeTab !== "add") {
              clearForm();
            }
            setActiveTab("add");
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={activeTab === "add" ? colors.textDark : "#D3DED7"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "add" && styles.tabLabelActive,
            ]}
          >
            Add
          </Text>
        </Pressable>
      </View>

      <SaveTripModal
        visible={saveTripModalVisible}
        savingTripChoice={savingTripChoice}
        finishedTripDraft={finishedTripDraft}
        finishedTripTitle={finishedTripTitle}
        setFinishedTripTitle={setFinishedTripTitle}
        finishedTripNote={finishedTripNote}
        setFinishedTripNote={setFinishedTripNote}
        finishedTripDistanceText={finishedTripDistanceText}
        finishedTripDurationText={finishedTripDurationText}
        finishedTripLocationLine={finishedTripLocationLine}
        onClose={closeFinishedTripModal}
        onSaveAsJourney={saveFinishedTripAsJourney}
        onSaveAsPlace={saveFinishedTripAsPlace}
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
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: screen.tabBarBottomPadding,
    minHeight: screen.tabBarMinHeight,
    backgroundColor: colors.surfaceOverlay,
    borderTopWidth: 1,
    borderTopColor: colors.borderTab,
  },
  tabButton: {
    flex: 1,
    borderRadius: radius.xl,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
  },
  tabActive: {
    backgroundColor: colors.accent,
    ...shadows.tabActive,
  },
  tabIcon: {
    marginBottom: 4,
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