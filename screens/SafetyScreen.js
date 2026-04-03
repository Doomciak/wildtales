import { ScrollView, StyleSheet } from "react-native";

import ScreenHeader from "../components/ScreenHeader";
import RecentLogsCard from "../components/RecentLogsCard";
import RouteMapCard from "../components/RouteMapCard";
import SafetyContactCard from "../components/SafetyContactCard";
import TripStatusCard from "../components/TripStatusCard";
import UpdatesCard from "../components/UpdatesCard";
import useSafetyTrip from "../hooks/useSafetyTrip";

export default function SafetyScreen() {
  const {
    contact,
    tripActive,
    logs,
    routeCoords,
    chooseContact,
    startTrip,
    stopTrip,
    retryPendingUploads,
    sendLatestLocationSms,
  } = useSafetyTrip();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <ScreenHeader eyebrow="Safety mode" title="Trip check-in" />

      <SafetyContactCard contact={contact} onChooseContact={chooseContact} />

      <TripStatusCard
        tripActive={tripActive}
        onStartTrip={startTrip}
        onStopTrip={stopTrip}
      />

      <RouteMapCard routeCoords={routeCoords} />

      <UpdatesCard
        onRetry={retryPendingUploads}
        onSendSms={sendLatestLocationSms}
      />

      <RecentLogsCard logs={logs} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
});