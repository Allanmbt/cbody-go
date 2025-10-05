import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * AuthGate - Simple authentication guard
 * Redirects users based on auth state:
 * - Unauthenticated -> /(auth)/sign-in
 * - Authenticated -> /(tabs)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inUnauthorizedPage = segments[1] === 'unauthorized';

    // No session -> redirect to sign-in
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // Has session and in auth group (but NOT on unauthorized page) -> redirect to tabs
    // Allow users to stay on unauthorized page if they're already there
    if (session && inAuthGroup && !inUnauthorizedPage) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading, router]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39b59a" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
