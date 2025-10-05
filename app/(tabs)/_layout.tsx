import { useOnShow } from '@/features/auth/useOnShow';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// AsyncStorage keys
const AUTH_CACHE_KEY = '@auth:authorization_cache';
const AUTH_CHECK_INTERVAL = 120 * 60 * 1000; // 2 hour

interface AuthCache {
  userId: string;
  girlId: string;
  isAuthorized: boolean;
  isBlocked: boolean;
  timestamp: number;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const checkingRef = React.useRef(false);

  // Load cache and initialize on mount
  useEffect(() => {
    loadCacheAndInitialize();
  }, []);

  // Load cached authorization state
  const loadCacheAndInitialize = async () => {
    try {
      const cacheJson = await AsyncStorage.getItem(AUTH_CACHE_KEY);
      
      if (!cacheJson) {
        console.log('📭 No cache found, will check on first show');
        return;
      }

      const cache: AuthCache = JSON.parse(cacheJson);
      const now = Date.now();
      const cacheAge = now - cache.timestamp;

      console.log(`📦 Cache found (age: ${Math.round(cacheAge / 1000)}s)`);

      // Check if cache is still valid
      if (cacheAge < AUTH_CHECK_INTERVAL) {
        console.log('✅ Cache valid, using cached authorization');
        setIsAuthorized(cache.isAuthorized);
        setIsInitialLoad(false);
        return;
      }

      console.log('⏰ Cache expired, will check on first show');
    } catch (error) {
      console.error('📦 Failed to load cache:', error);
    }
  };

  // Save authorization state to cache
  const saveCache = async (userId: string, girlId: string, isBlocked: boolean) => {
    try {
      const cache: AuthCache = {
        userId,
        girlId,
        isAuthorized: !isBlocked,
        isBlocked,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
      console.log('💾 Cache saved');
    } catch (error) {
      console.error('💾 Failed to save cache:', error);
    }
  };

  // Clear cache (on unauthorized or blocked)
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_CACHE_KEY);
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('🗑️ Failed to clear cache:', error);
    }
  };

  // Authorization check callback (silent background check)
  const checkAuthorization = useCallback(async () => {
    // Prevent concurrent checks
    if (checkingRef.current) {
      console.log('⏭️ Already checking, skip');
      return;
    }

    // Load cache and check if still valid
    try {
      const cacheJson = await AsyncStorage.getItem(AUTH_CACHE_KEY);
      
      if (cacheJson) {
        const cache: AuthCache = JSON.parse(cacheJson);
        const now = Date.now();
        const cacheAge = now - cache.timestamp;

        // Cache valid for 1 hour
        if (cacheAge < AUTH_CHECK_INTERVAL) {
          const remainingMinutes = Math.round((AUTH_CHECK_INTERVAL - cacheAge) / 60000);
          console.log(`⏭️ Cache valid (${remainingMinutes}min remaining), skip check`);
          
          // Update state from cache if needed
          if (cache.isAuthorized !== isAuthorized) {
            setIsAuthorized(cache.isAuthorized);
            if (isInitialLoad) {
              setIsInitialLoad(false);
            }
          }
          return;
        }

        console.log('⏰ Cache expired, performing check...');
      }
    } catch (error) {
      console.error('📦 Cache read error:', error);
    }

    console.log('🔍 Database authorization check...');
    checkingRef.current = true;
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('❌ No user, sign out');
        await clearCache();
        checkingRef.current = false;
        setIsAuthorized(false);
        return;
      }

      // Check girls table - ONLY query necessary fields
      const { data: girl, error: girlError } = await supabase
        .from('girls')
        .select('id, is_blocked')
        .eq('user_id', user.id)
        .maybeSingle();

      // Not bound to any girl profile
      if (girlError || !girl) {
        console.log('⚠️ Not bound - redirect to unauthorized');
        await clearCache();
        checkingRef.current = false;
        setIsAuthorized(false);
        router.replace('/(auth)/unauthorized');
        return;
      }

      // Account is blocked
      if (girl.is_blocked) {
        console.log('🚫 Blocked - redirect to unauthorized');
        await clearCache();
        checkingRef.current = false;
        setIsAuthorized(false);
        router.replace('/(auth)/unauthorized');
        return;
      }

      // Authorized - save to cache
      console.log('✅ Authorization OK - saving to cache');
      await saveCache(user.id, girl.id, girl.is_blocked);
      setIsAuthorized(true);
      
      // Clear initial load flag after first successful check
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
      checkingRef.current = false;
    } catch (error) {
      console.error('💥 Check error:', error);
      await clearCache();
      checkingRef.current = false;
      router.replace('/(auth)/unauthorized');
    }
  }, [isInitialLoad, isAuthorized]);

  // Check authorization on show (mount, tab switch, foreground)
  useOnShow(checkAuthorization);

  // Show loading ONLY on initial load
  if (isInitialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39b59a" />
      </View>
    );
  }

  // Don't render tabs if not authorized (but don't show loading)
  if (!isAuthorized) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#39b59a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workbench',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
