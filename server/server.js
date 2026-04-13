const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Store received location logs locally in this JSON file.
const dataFilePath = path.join(__dirname, "location-logs.json");

app.use(express.json());

function readLogs() {
  try {
    // Return an empty list if the file does not exist yet.
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }

    const file = fs.readFileSync(dataFilePath, "utf8");
    return file ? JSON.parse(file) : [];
  } catch (error) {
    console.log("Read logs error:", error);
    return [];
  }
}

function writeLogs(logs) {
  try {
    // Save the full logs array back to the JSON file.
    fs.writeFileSync(dataFilePath, JSON.stringify(logs, null, 2), "utf8");
  } catch (error) {
    console.log("Write logs error:", error);
  }
}

app.get("/api/ping", (req, res) => {
  // Simple route to check that the server is running.
  res.json({ ok: true, message: "WildTales server is running" });
});

app.get("/api/location-logs", (req, res) => {
  // Return all saved location logs.
  const logs = readLogs();
  res.json(logs);
});

app.post("/api/location-logs", (req, res) => {
  const { tripId, latitude, longitude, placeName, recordedAt } = req.body;

  // Basic validation to make sure the required tracking data is present.
  if (
    tripId == null ||
    latitude == null ||
    longitude == null ||
    !recordedAt
  ) {
    return res.status(400).json({
      ok: false,
      message: "tripId, latitude, longitude, and recordedAt are required",
    });
  }

  const logs = readLogs();

  // Create one new log object from the request data.
  const newLog = {
    id: Date.now(),
    tripId,
    latitude,
    longitude,
    placeName: placeName || "",
    recordedAt,
    receivedAt: new Date().toISOString(),
  };

  logs.push(newLog);
  writeLogs(logs);

  res.status(201).json({
    ok: true,
    message: "Location log stored",
    log: newLog,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  // Start the server and allow connections outside localhost.
  console.log(`WildTales server running on port ${PORT}`);
});