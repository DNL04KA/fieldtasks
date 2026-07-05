import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useTaskStore } from '../store/taskStore';

/**
 * Bridges NetInfo connectivity events into the store. When the connection is
 * restored the store automatically flushes pending changes to the mock server.
 */
export function useNetworkSync(): void {
  const setOnline = useTaskStore((s) => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected === true);
    });
    return unsubscribe;
  }, [setOnline]);
}
