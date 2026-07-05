import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Mock server (json-server) base URL.
 *
 * In development the dev-server host is derived from Expo's hostUri
 * (e.g. "192.168.1.20:8081"), so a physical device automatically talks to
 * the same machine that serves the JS bundle. Fallbacks:
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator can use localhost
 * For a standalone release build set your machine's LAN IP below (README).
 */
function resolveDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host) return host;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_BASE_URL = `http://${resolveDevHost()}:3001`;

export const REQUEST_TIMEOUT_MS = 8000;
