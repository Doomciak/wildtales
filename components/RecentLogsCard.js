import { StyleSheet, Text, View } from "react-native";

function getShortStatus(log) {
  if (log.sentVia === "sms") {
    return "Text opened";
  }

  if (log.sendStatus === "sent") {
    return "Sent";
  }

  if (log.sendStatus === "failed") {
    return "Failed";
  }

  return "Pending";
}

export default function RecentLogsCard({ logs }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recent logs</Text>

      {logs.length === 0 ? (
        <Text style={styles.subText}>No location logs yet.</Text>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={styles.logItem}>
            <Text style={styles.mainText}>
              {Number(log.latitude).toFixed(2)},{" "}
              {Number(log.longitude).toFixed(2)}
            </Text>

            {log.placeName ? (
              <Text style={styles.subText}>{log.placeName}</Text>
            ) : null}

            <Text style={styles.subText}>
              {new Date(log.recordedAt).toLocaleString()}
            </Text>

            <Text style={styles.statusText}>{getShortStatus(log)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#183328",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#F6FAF7",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  mainText: {
    color: "#F6FAF7",
    fontSize: 15,
    marginBottom: 4,
  },
  subText: {
    color: "#A9BBB0",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  statusText: {
    color: "#B7C8BE",
    fontSize: 12,
    marginTop: 2,
  },
  logItem: {
    borderTopWidth: 1,
    borderTopColor: "#264437",
    paddingTop: 12,
    marginTop: 12,
  },
});