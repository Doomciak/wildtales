import { useState } from "react";

import useTravelData from "./travelApp/useTravelData";
import usePlaceForm from "./travelApp/usePlaceForm";
import useJourneyEditing from "./travelApp/useJourneyEditing";
import useFinishedTrip from "./travelApp/useFinishedTrip";

export default function useTravelApp() {
  // Keep app-level shell state here.
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  // Main travel data, filters, and derived state.
  const travelData = useTravelData();

  // Place form flow: add, edit, photos, and location.
  const placeForm = usePlaceForm({
    places: travelData.places,
    setActiveTab,
    loadPlaces: travelData.loadPlaces,
    loadRoutes: travelData.loadRoutes,
    loadActiveRouteLink: travelData.loadActiveRouteLink,
  });

  // Journey editing flow: title, note, photos, and delete.
  const journeyEditing = useJourneyEditing({
    loadRoutes: travelData.loadRoutes,
  });

  // Finished trip save flow.
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