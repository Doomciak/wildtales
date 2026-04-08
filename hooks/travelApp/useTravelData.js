import { useEffect, useMemo, useState } from "react";

import {
  cleanupManagedOrphanFiles,
  getActiveTripSession,
  getAllPlaces,
  getAllRoutes,
  getLocationLogsForTrip,
  setupDatabase,
} from "../../db";
import {
  buildActiveRouteLink,
  buildPlaceForUi,
  buildRouteForUi,
} from "./helpers";

export default function useTravelData() {
  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  const [activeRouteLink, setActiveRouteLink] = useState(null);

  useEffect(() => {
    initialiseApp();
  }, []);

  useEffect(() => {
    loadActiveRouteLink();

    // Refresh the active trip link on an interval.
    const interval = setInterval(() => {
      loadActiveRouteLink();
    }, 15000);

    return () => clearInterval(interval);
  }, [places]);

  // Set up the database, clean orphaned files, and load initial data.
  async function initialiseApp() {
    try {
      await setupDatabase();
      await cleanupManagedOrphanFiles();

      const [placeRows, routeRows] = await Promise.all([
        loadPlaces(),
        loadRoutes(),
      ]);

      await loadActiveRouteLink(placeRows);

      return { placeRows, routeRows };
    } catch (error) {
      console.log("Initialise app error:", error);
      return { placeRows: [], routeRows: [] };
    } finally {
      setLoading(false);
    }
  }

  // Load all saved places from the database.
  async function loadPlaces() {
    try {
      const rows = await getAllPlaces();
      setPlaces(rows);
      return rows;
    } catch (error) {
      console.log("Load places error:", error);
      return [];
    }
  }

  // Load all saved routes from the database.
  async function loadRoutes() {
    try {
      const rows = await getAllRoutes();
      const parsedRoutes = rows.map(buildRouteForUi);
      setRoutes(parsedRoutes);
      return parsedRoutes;
    } catch (error) {
      console.log("Load routes error:", error);
      return [];
    }
  }

  // Build the current active trip link from trip logs and saved places.
  async function loadActiveRouteLink(placesOverride = null) {
    try {
      const activeTrip = await getActiveTripSession();

      if (!activeTrip) {
        setActiveRouteLink(null);
        return null;
      }

      const tripLogs = await getLocationLogsForTrip(activeTrip.id);

      const placesSource = Array.isArray(placesOverride)
        ? placesOverride
        : await getAllPlaces();

      const placesForUi = placesSource.map(buildPlaceForUi);
      const nextLink = buildActiveRouteLink(placesForUi, tripLogs);

      setActiveRouteLink(nextLink);
      return nextLink;
    } catch (error) {
      console.log("Load active route link error:", error);
      return null;
    }
  }

  // Build UI-ready place objects from the raw place rows.
  const placesWithDetails = useMemo(() => {
    return places.map(buildPlaceForUi);
  }, [places]);

  // Build the country filter options from saved places.
  const countries = useMemo(() => {
    const uniqueCountries = [
      ...new Set(
        placesWithDetails
          .map((place) => place.country)
          .filter((value) => value && value.trim())
      ),
    ];

    return ["All", ...uniqueCountries];
  }, [placesWithDetails]);

  // Build the city filter options based on the selected country.
  const cities = useMemo(() => {
    const source =
      selectedCountry === "All"
        ? placesWithDetails
        : placesWithDetails.filter((place) => place.country === selectedCountry);

    const uniqueCities = [
      ...new Set(
        source.map((place) => place.city).filter((value) => value && value.trim())
      ),
    ];

    return ["All", ...uniqueCities];
  }, [placesWithDetails, selectedCountry]);

  // Reset the selected country if it is no longer available.
  useEffect(() => {
    if (!countries.includes(selectedCountry)) {
      setSelectedCountry("All");
    }
  }, [countries, selectedCountry]);

  // Reset the selected city if it is no longer available.
  useEffect(() => {
    if (!cities.includes(selectedCity)) {
      setSelectedCity("All");
    }
  }, [cities, selectedCity]);

  // Filter places by search text, country, and city.
  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLowerCase();

    return placesWithDetails.filter((place) => {
      const matchesSearch =
        !query ||
        String(place.title).toLowerCase().includes(query) ||
        String(place.note).toLowerCase().includes(query) ||
        String(place.placeName || "").toLowerCase().includes(query) ||
        String(place.city || "").toLowerCase().includes(query) ||
        String(place.country || "").toLowerCase().includes(query);

      const matchesCountry =
        selectedCountry === "All" || place.country === selectedCountry;

      const matchesCity = selectedCity === "All" || place.city === selectedCity;

      return matchesSearch && matchesCountry && matchesCity;
    });
  }, [placesWithDetails, search, selectedCountry, selectedCity]);

  // Keep only places that have coordinates for the map.
  const mapPlaces = useMemo(() => {
    return filteredPlaces.filter(
      (place) => place.latitude != null && place.longitude != null
    );
  }, [filteredPlaces]);

  // Sort routes so the newest finished route appears first.
  const routesSorted = useMemo(() => {
    return [...routes].sort((a, b) => {
      const firstTime = new Date(a.endedAt || a.startedAt || 0).getTime();
      const secondTime = new Date(b.endedAt || b.startedAt || 0).getTime();
      return secondTime - firstTime;
    });
  }, [routes]);

  // Read the latest saved route.
  const latestRoute = routesSorted[0] || null;

  // Read the three most recent routes.
  const recentRoutes = routesSorted.slice(0, 3);

  // Check whether any place filters are currently active.
  const hasActiveFilters =
    selectedCountry !== "All" ||
    selectedCity !== "All" ||
    search.trim().length > 0;

  return {
    places,
    routes,
    loading,

    activeRouteLink,

    search,
    setSearch,
    selectedCountry,
    setSelectedCountry,
    selectedCity,
    setSelectedCity,

    placesWithDetails,
    filteredPlaces,
    mapPlaces,
    countries,
    cities,
    hasActiveFilters,

    routesSorted,
    latestRoute,
    recentRoutes,

    loadPlaces,
    loadRoutes,
    loadActiveRouteLink,
  };
}