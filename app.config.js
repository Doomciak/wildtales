module.exports = ({ config }) => {
  // Read the Google Maps API key from the build environment
  // instead of hardcoding it in the project.
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  // Stop the build early if the key is missing,
  // because Google Maps will not work without it.
  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_ANDROID_API_KEY during build");
  }

  // Return the Expo config with the Android Google Maps key injected.
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey,
        },
      },
    },
  };
};