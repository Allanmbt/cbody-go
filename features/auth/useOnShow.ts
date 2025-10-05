import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook that triggers callback when page is shown
 * Covers: tab switch, page navigation, and app coming back from background
 * 
 * @param callback - Function to execute when page is shown
 */
export function useOnShow(callback: () => void | Promise<void>) {
  const appState = useRef(AppState.currentState);
  const isFirstMount = useRef(true);

  // Handle app state changes (background -> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App coming from background to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        await callback();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);

  // Handle tab switch and page navigation
  useFocusEffect(
    useCallback(() => {
      // Skip first mount to avoid double trigger with AppState
      if (isFirstMount.current) {
        isFirstMount.current = false;
        // Trigger on first mount
        callback();
        return;
      }

      // Trigger when screen gets focus (tab switch or navigation)
      callback();
    }, [callback])
  );
}

