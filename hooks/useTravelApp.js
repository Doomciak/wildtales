import { useState } from "react";

import useTravelData from "./travelApp/useTravelData";
import usePlaceForm from "./travelApp/usePlaceForm";
import useJourneyEditing from "./travelApp/useJourneyEditing";
import useFinishedTrip from "./travelApp/useFinishedTrip";

export default function useTravelApp() {
  // These stay here because they control the whole app shell.
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Main data loading, filtering, and derived travel state.
  const travelData = useTravelData();

  // Place form flow: add, edit, photos, and location.
  const placeForm = usePlaceForm({
    places: travelData.places,
    setActiveTab,
    loadPlaces: travelData.loadPlaces,
    loadRoutes: travelData.loadRoutes,
    loadActiveRouteLink: travelData.loadActiveRouteLink,
  });

  // Journey editing flow: rename, notes, photos, delete.
  const journeyEditing = useJourneyEditing({
    routes: travelData.routes,
    loadRoutes: travelData.loadRoutes,
  });

  // Finished trip modal flow.
  const finishedTrip = useFinishedTrip({
    loadRoutes: travelData.loadRoutes,
    setActiveTab,
  });

  return {
    showWelcome,
    setShowWelcome,
    activeTab,
    setActiveTab,

    ...travelData,
    ...placeForm,
    ...journeyEditing,
    ...finishedTrip,
  };
}