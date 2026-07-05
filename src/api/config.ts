import { Platform } from 'react-native';

/**
 * Mock server (json-server) base URL.
 * - Android emulator reaches the host machine via 10.0.2.2
 * - iOS simulator can use localhost
 * - On a physical device, replace with your computer's LAN IP,
 *   e.g. http://192.168.1.20:3001 (see README).
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:3001`;

export const REQUEST_TIMEOUT_MS = 8000;
