import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  getCurrentGirlProfile,
  getCurrentUser,
  getSession,
  signIn as signInApi,
  signOut as signOutApi,
  type SignInCredentials
} from './api';

/**
 * Hook for sign in mutation
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (credentials: SignInCredentials) => {
      const result = await signInApi(credentials);

      if (!result.success && result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
    onSuccess: () => {
      // Clear query cache
      queryClient.clear();
    },
  });

  return mutation;
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
