import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";
import * as Location from "expo-location";

import { sendLocationLogToApi } from "../api";
import {
  getActiveTripSession,
  getLatestLocationLog,
  getLatestPendingLocationLog,
  getLocationLogsForTrip,
  getPendingLocationLogs,
  getRecentLocationLogs,
  getSafetyContact,
  incrementLocationLogAttempt,
  markLocationLogSent,
  markLocationLogSmsPrepared,
  saveLocationLog,
  saveSafetyContact,
  startTripSession,
  stopTripSession,
} from "../db";

export default function useSafetyTrip() {
  const [contact, setContact] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);

  const watchRef = useRef(null);
  const autoCheckRef = useRef(null);
  const autoSmsTriggeredIdsRef = useRef(new Set());
  const autoCheckBusyRef = useRef(false);

  useEffect(() => {
    loadInitialData();

    return () => {
      stopWatchingOnly();
      stopAutoCheckOnly();
    };
  }, []);

  useEffect(() => {
    stopAutoCheckOnly();

    if (tripActive && contact) {
      autoCheckRef.current = setInterval(() => {
        checkAutoSmsFallback();
      }, 60000);
    }

    return () => {
      stopAutoCheckOnly();
    };
  }, [tripActive, contact, tripId]);

  async function loadInitialData() {
    try {
      const savedContact = await getSafetyContact();
      const recentLogs = await getRecentLocationLogs();
      const activeTrip = await getActiveTripSession();

      setContact(savedContact);
      setLogs(recentLogs);

      if (activeTrip) {
        setTripId(activeTrip.id);
        setTripActive(true);
        await refreshRoute(activeTrip.id);
        await beginWatching(activeTrip.id);
      } else {
        setRouteCoords([]);
      }
    } catch (error) {
      console.log("Load safety data error:", error);
    }
  }

  function stopWatchingOnly() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  }

  function stopAutoCheckOnly() {
    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
      autoCheckRef.current = null;
    }
  }

  async function refreshLogs() {
    try {
      const recentLogs = await getRecentLocationLogs();
      setLogs(recentLogs);
    } catch (error) {
      console.log("Refresh logs error:", error);
    }
  }

  async function refreshRoute(currentTripId) {
    try {
      if (!currentTripId) {
        setRouteCoords([]);
        return;
      }

      const tripLogs = await getLocationLogsForTrip(currentTripId);

      const coords = tripLogs
        .filter((log) => log.latitude != null && log.longitude != null)
        .map((log) => ({
          latitude: Number(log.latitude),
          longitude: Number(log.longitude),
        }));

      setRouteCoords(coords);
    } catch (error) {
      console.log("Refresh route error:", error);
    }
  }

  async function chooseContact() {
    try {
      const permission = await Contacts.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to contacts.");
        return;
      }

      const picked = await Contacts.presentContactPickerAsync();

      if (!picked) {
        return;
      }

      const phoneNumber =
        picked.phoneNumbers && picked.phoneNumbers.length > 0
          ? picked.phoneNumbers[0].number
          : null;

      if (!phoneNumber) {
        Alert.alert("No phone number", "That contact has no phone number.");
        return;
      }

      const cleanContact = {
        name: picked.name || "Unnamed contact",
        phone: phoneNumber,
      };

      await saveSafetyContact(cleanContact);
      setContact(cleanContact);
    } catch (error) {
      console.log("Choose contact error:", error);
    }
  }

  async function buildPlaceName(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        return "";
      }

      const first = results[0];

      return (
        first.city ||
        first.district ||
        first.subregion ||
        first.region ||
        first.name ||
        first.street ||
        ""
      );
    } catch (error) {
      console.log("Reverse geocode watch error:", error);
      return "";
    }
  }

  async function trySendLog(log) {
    try {
      await sendLocationLogToApi(log);
      await markLocationLogSent(log.id, "api");
    } catch (error) {
      console.log("Send log error:", error);
      await incrementLocationLogAttempt(log.id);
    }
  }

  function shouldOpenAutoText(log) {
    if (!log) {
      return false;
    }

    if (log.sendStatus === "sent") {
      return false;
    }

    if (log.sentVia === "sms") {
      return false;
    }

    const failedAttempts = Number(log.sendAttempts || 0);
    const ageMs = Date.now() - new Date(log.recordedAt).getTime();

    return failedAttempts >= 3 || ageMs >= 10 * 60 * 1000;
  }

  async function sendSmsForLog(log) {
    if (!contact) {
      Alert.alert("No contact", "Please choose a safety contact first.");
      return;
    }

    const smsAvailable = await SMS.isAvailableAsync();

    if (!smsAvailable) {
      Alert.alert("Text unavailable", "Text messaging is not available here.");
      return;
    }

    const message =
      `WildTales safety update\n` +
      `Last known location: ${Number(log.latitude).toFixed(2)}, ${Number(
        log.longitude
      ).toFixed(2)}\n` +
      `${log.placeName ? `Place: ${log.placeName}\n` : ""}` +
      `Recorded: ${new Date(log.recordedAt).toLocaleString()}`;

    await SMS.sendSMSAsync([contact.phone], message);

    if (log.id) {
      await markLocationLogSmsPrepared(log.id);
    }

    await refreshLogs();
  }

  async function checkAutoSmsFallback() {
    if (autoCheckBusyRef.current) {
      return;
    }

    autoCheckBusyRef.current = true;

    try {
      if (!tripActive || !contact) {
        return;
      }

      const latestPending = await getLatestPendingLocationLog();

      if (!latestPending) {
        return;
      }

      if (autoSmsTriggeredIdsRef.current.has(latestPending.id)) {
        return;
      }

      if (!shouldOpenAutoText(latestPending)) {
        return;
      }

      autoSmsTriggeredIdsRef.current.add(latestPending.id);

      Alert.alert(
        "Text update ready",
        "Online sending has not worked, so a text update will open with the latest saved location."
      );

      await sendSmsForLog(latestPending);
    } catch (error) {
      console.log("Auto text fallback error:", error);
    } finally {
      autoCheckBusyRef.current = false;
    }
  }

  async function retryPendingUploads() {
    try {
      const pending = await getPendingLocationLogs();

      for (const log of pending) {
        await trySendLog(log);
      }

      await refreshLogs();

      if (tripId) {
        await refreshRoute(tripId);
      }

      await checkAutoSmsFallback();
    } catch (error) {
      console.log("Retry uploads error:", error);
    }
  }

  async function beginWatching(currentTripId) {
    stopWatchingOnly();

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000,
        distanceInterval: 20,
      },
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const placeName = await buildPlaceName(latitude, longitude);
          const recordedAt = new Date().toISOString();

          const newLogId = await saveLocationLog({
            tripId: currentTripId,
            latitude,
            longitude,
            placeName,
            recordedAt,
          });

          await trySendLog({
            id: newLogId,
            tripId: currentTripId,
            latitude,
            longitude,
            placeName,
            recordedAt,
          });

          await retryPendingUploads();
          await refreshLogs();
          await refreshRoute(currentTripId);
          await checkAutoSmsFallback();
        } catch (error) {
          console.log("Watch callback error:", error);
        }
      }
    );
  }

  async function startTrip() {
    try {
      if (tripActive) {
        return;
      }

      if (!contact) {
        Alert.alert("Choose contact", "Please choose a safety contact first.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow location access before starting a trip."
        );
        return;
      }

      autoSmsTriggeredIdsRef.current.clear();

      const newTripId = await startTripSession();

      setTripId(newTripId);
      setTripActive(true);
      setRouteCoords([]);

      await beginWatching(newTripId);
      await refreshLogs();
      await refreshRoute(newTripId);
    } catch (error) {
      console.log("Start trip error:", error);
    }
  }

  async function stopTrip() {
    try {
      stopWatchingOnly();
      stopAutoCheckOnly();

      if (tripId) {
        await stopTripSession(tripId);
      }

      setTripActive(false);
      setTripId(null);
      await refreshLogs();
    } catch (error) {
      console.log("Stop trip error:", error);
    }
  }

  async function sendLatestLocationSms() {
    try {
      let latestLog = await getLatestPendingLocationLog();

      if (!latestLog) {
        latestLog = await getLatestLocationLog();
      }

      if (!latestLog) {
        const fallback = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 30,
          requiredAccuracy: 1000,
        });

        if (!fallback) {
          Alert.alert("No location", "No saved or recent location was found.");
          return;
        }

        latestLog = {
          id: null,
          latitude: fallback.coords.latitude,
          longitude: fallback.coords.longitude,
          placeName: "",
          recordedAt: new Date().toISOString(),
        };
      }

      await sendSmsForLog(latestLog);
    } catch (error) {
      console.log("Send SMS error:", error);
    }
  }

  return {
    contact,
    tripActive,
    logs,
    routeCoords,
    chooseContact,
    startTrip,
    stopTrip,
    retryPendingUploads,
    sendLatestLocationSms,
  };
}