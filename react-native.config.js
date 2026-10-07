module.exports = {
  dependencies: {
    '@react-native-google-signin/google-signin': {
      platforms: {
        android: null, // CLI-Autolinking für Android abschalten, Expo-Plugin übernimmt
      },
    },
  },
};
