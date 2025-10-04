import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  getCurrentGirlProfile,
  getCurrentUser,
  getSession,
  sendOtp as sendOtpApi,
  signIn as signInApi,
  signOut as signOutApi,
  verifyOtp as verifyOtpApi,
  type SignInCredentials
} from './api';

const FAILED_ATTEMPTS_KEY = '@auth:failed_attempts';
const COOLDOWN_UNTIL_KEY = '@auth:cooldown_until';
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Hook for sign in mutation
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  // Load failed attempts on mount
  useEffect(() => {
    loadFailedAttempts();
  }, []);

  const loadFailedAttempts = async () => {
    try {
      const [attempts, cooldown] = await Promise.all([
        AsyncStorage.getItem(FAILED_ATTEMPTS_KEY),
        AsyncStorage.getItem(COOLDOWN_UNTIL_KEY),
      ]);

      const attemptCount = attempts ? parseInt(attempts, 10) : 0;
      const cooldownTime = cooldown ? parseInt(cooldown, 10) : null;

      // Check if cooldown has expired
      if (cooldownTime && Date.now() > cooldownTime) {
        await clearFailedAttempts();
        setFailedAttempts(0);
        setCooldownUntil(null);
      } else {
        setFailedAttempts(attemptCount);
        setCooldownUntil(cooldownTime);
      }
    } catch (error) {
      console.error('Failed to load login attempts:', error);
    }
  };

  const incrementFailedAttempts = async () => {
    let newCount = 0;

    setFailedAttempts((prev) => {
      newCount = prev + 1;
      return newCount;
    });

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const cooldownTime = Date.now() + COOLDOWN_DURATION;
      setCooldownUntil(cooldownTime);
      await AsyncStorage.setItem(COOLDOWN_UNTIL_KEY, cooldownTime.toString());
    }

    await AsyncStorage.setItem(FAILED_ATTEMPTS_KEY, newCount.toString());

    return newCount;
  };

  const clearFailedAttempts = async () => {
    setFailedAttempts(0);
    setCooldownUntil(null);
    await Promise.all([
      AsyncStorage.removeItem(FAILED_ATTEMPTS_KEY),
      AsyncStorage.removeItem(COOLDOWN_UNTIL_KEY),
    ]);
  };

  const mutation = useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      // Check cooldown
      if (cooldownUntil && Date.now() < cooldownUntil) {
        const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`);
      }

      const result = await signInApi(credentials);

      if (!result.success && result.error) {
        await incrementFailedAttempts();
        throw new Error(result.error.message);
      }

      // Clear failed attempts on success
      await clearFailedAttempts();

      return result;
    },
    onSuccess: async () => {
      // Invalidate all queries on successful login
      queryClient.clear();

      // Pre-fetch essential data
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['session'],
          queryFn: getSession,
        }),
        queryClient.prefetchQuery({
          queryKey: ['currentUser'],
          queryFn: getCurrentUser,
        }),
        queryClient.prefetchQuery({
          queryKey: ['girlProfile'],
          queryFn: getCurrentGirlProfile,
        }),
      ]);

      // AuthGate will handle navigation automatically
    },
  });

  return {
    ...mutation,
    failedAttempts,
    cooldownUntil,
    isInCooldown: cooldownUntil ? Date.now() < cooldownUntil : false,
  };
}

/**
 * Hook for sign out mutation
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutApi,
    onSuccess: async () => {
      // Clear all cached data
      queryClient.clear();

      // AuthGate will handle navigation automatically
    },
  });
}

/**
 * Hook to get current session
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get girl profile
 */
export function useGirlProfile() {
  return useQuery({
    queryKey: ['girlProfile'],
    queryFn: getCurrentGirlProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for sending OTP
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await sendOtpApi(email);

      if (!result.success && result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
  });
}

/**
 * Hook for verifying OTP
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const result = await verifyOtpApi(email, token);

      if (!result.success && result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
    onSuccess: async () => {
      // Invalidate all queries on successful login
      queryClient.clear();

      // Pre-fetch essential data
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['session'],
          queryFn: getSession,
        }),
        queryClient.prefetchQuery({
          queryKey: ['currentUser'],
          queryFn: getCurrentUser,
        }),
        queryClient.prefetchQuery({
          queryKey: ['girlProfile'],
          queryFn: getCurrentGirlProfile,
        }),
      ]);

      // AuthGate will handle navigation automatically
    },
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: girl, isLoading: girlLoading } = useGirlProfile();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear cache on sign out
          const queryClient = useQueryClient();
          queryClient.clear();
        }

        setIsInitializing(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    girl,
    isAuthenticated: !!session && !!user && !!girl,
    isLoading: isInitializing || sessionLoading || userLoading || girlLoading,
  };
}
