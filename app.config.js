// Add the Android Google Maps API key only when it is available in env.
module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      config: apiKey
        ? {
            ...config.android?.config,
            googleMaps: {
              apiKey,
            },
          }
        : config.android?.config,
    },
  };
};