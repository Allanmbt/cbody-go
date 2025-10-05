import { supabase } from '@/lib/supabase';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface GirlProfile {
  id: string;
  user_id: string | null;
  username: string;
  name: string;
  is_blocked: boolean;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password (min 6 chars, must contain letters and numbers)
 */
export function validatePassword(password: string): boolean {
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Sign in with email and password (authentication only)
 */
export async function signIn(
  credentials: SignInCredentials
): Promise<{ success: boolean; error?: AuthError }> {
  const { email, password } = credentials;

  if (!validateEmail(email)) {
    return {
      success: false,
      error: {
        code: 'invalid_email',
        message: 'Please enter a valid email address',
      },
    };
  }

  if (!validatePassword(password)) {
    return {
      success: false,
      error: {
        code: 'invalid_password',
        message: 'Password must be at least 6 characters with letters and numbers',
      },
    };
  }

  try {
    // Sign in with Supabase auth - only check credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error.message);
      return {
        success: false,
        error: {
          code: error.status?.toString() || 'auth_error',
          message: errorMessage,
        },
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: 'no_user',
          message: 'Authentication failed',
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: {
        code: 'network_error',
        message: 'Network error. Please check your connection',
      },
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: {
          code: 'signout_error',
          message: 'Failed to sign out',
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: {
        code: 'network_error',
        message: 'Network error. Please try again',
      },
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    return null;
  }

  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    return null;
  }

  return user;
}

/**
 * Get current girl profile (technician profile)
 */
export async function getCurrentGirlProfile(): Promise<GirlProfile | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const { data: girl, error } = await supabase
    .from('girls')
    .select('id, user_id, username, name, is_blocked')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Get girl profile error:', error);
    return null;
  }

  return girl;
}

/**
 * Map Supabase auth error messages to user-friendly messages
 */
function getAuthErrorMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  // Invalid credentials
  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid_credentials')) {
    return 'Invalid email or password';
  }

  // Email confirmation
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please verify your email address';
  }

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Network error. Please check your connection';
  }

  return 'Authentication failed. Please try again';
}
