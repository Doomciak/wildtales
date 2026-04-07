module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
  },
  ios: {
    ...config.ios,
    ...(process.env.GOOGLE_MAPS_IOS_API_KEY
      ? {
          config: {
            ...config.ios?.config,
            googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
          },
        }
      : {}),
  },
});