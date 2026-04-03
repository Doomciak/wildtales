import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import BottomTabBar from "./components/BottomTabBar";
import usePlaces from "./hooks/usePlaces";
import AddPlaceScreen from "./screens/AddPlaceScreen";
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";
import SafetyScreen from "./screens/SafetyScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  const {
    places,
    filteredPlaces,
    mapPlaces,
    search,
    setSearch,
    title,
    setTitle,
    placeName,
    note,
    setNote,
    image,
    latitude,
    longitude,
    loading,
    editingPlace,
    locationLoading,
    savePlace,
    removePlace,
    startEditing,
    clearForm,
    cancelEditing,
    openImageOptions,
    removeImage,
    getCurrentLocation,
    clearLocation,
  } = usePlaces();

  async function handleSavePlace() {
    const saved = await savePlace();

    if (saved) {
      setActiveTab("home");
    }
  }

  function handleEditPlace(place) {
    startEditing(place);
    setActiveTab("add");
  }

  function handleTabChange(tab) {
    if (tab === "add" && activeTab !== "add") {
      clearForm();
    }

    setActiveTab(tab);
  }

  function handleCancelEditing() {
    cancelEditing();
    setActiveTab("home");
  }

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
            places={filteredPlaces}
            totalPlacesCount={places.length}
            search={search}
            setSearch={setSearch}
            onRemovePlace={removePlace}
            onEditPlace={handleEditPlace}
          />
        ) : activeTab === "map" ? (
          <MapScreen places={mapPlaces} />
        ) : activeTab === "safety" ? (
          <SafetyScreen />
        ) : (
          <AddPlaceScreen
            title={title}
            setTitle={setTitle}
            note={note}
            setNote={setNote}
            image={image}
            placeName={placeName}
            latitude={latitude}
            longitude={longitude}
            locationLoading={locationLoading}
            onSavePlace={handleSavePlace}
            onCancel={handleCancelEditing}
            onOpenImageOptions={openImageOptions}
            onRemoveImage={removeImage}
            onGetLocation={getCurrentLocation}
            onClearLocation={clearLocation}
            isEditing={Boolean(editingPlace)}
          />
        )}
      </View>

      <BottomTabBar activeTab={activeTab} onSelectTab={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#10251B",
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#10251B",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#EAF2EC",
    marginTop: 14,
    fontSize: 16,
  },
});