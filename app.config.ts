import type { ExpoConfig } from 'expo/config';

/**
 * GOOGLE_MAPS_API_KEY is read from the environment (.env is git-ignored,
 * see .env.example). Without a key the map falls back to blank tiles on
 * Android release builds — markers and callouts still work.
 */
const config: ExpoConfig = {
  name: 'FieldTasks',
  slug: 'fieldtasks',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Attach photos from your library to field tasks.',
    },
  },
  android: {
    package: 'com.fieldtasks.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['POST_NOTIFICATIONS', 'READ_MEDIA_IMAGES', 'ACCESS_NETWORK_STATE'],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    '@react-native-community/datetimepicker',
    ['expo-notifications', {}],
    [
      'expo-image-picker',
      { photosPermission: 'Attach photos from your library to field tasks.' },
    ],
  ],
};

export default config;
