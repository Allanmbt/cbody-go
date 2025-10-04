import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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
 * Get device information for login tracking
 */
async function getDeviceInfo() {
  // Web doesn't have expo-device, use Platform instead
  if (Platform.OS === 'web') {
    return {
      device_id: Constants.sessionId || 'web-' + Date.now(),
      device_model: 'web',
      device_os: 'web',
      device_os_version: navigator.userAgent || 'unknown',
      app_version: Constants.expoConfig?.version || '1.0.0',
    };
  }

  return {
    device_id: Constants.sessionId || 'unknown',
    device_model: Device.modelName || 'unknown',
    device_os: Device.osName || 'unknown',
    device_os_version: Device.osVersion || 'unknown',
    app_version: Constants.expoConfig?.version || '1.0.0',
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  credentials: SignInCredentials
): Promise<{ success: boolean; error?: AuthError }> {
  const { email, password } = credentials;

  // Client-side validation
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
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Map Supabase error codes to user-friendly messages
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

    // Check if user is banned
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_banned')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Profile check error:', profileError);
    }

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'account_banned',
          message: 'Your account has been suspended',
        },
      };
    }

    // Check if user is linked to a girl profile
    const { data: girl, error: girlError } = await supabase
      .from('girls')
      .select('id, user_id, username, name, is_blocked')
      .eq('user_id', data.user.id)
      .single();

    if (girlError || !girl) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'no_girl_profile',
          message: 'Account not linked to a service provider',
        },
      };
    }

    if (girl.is_blocked) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'girl_blocked',
          message: 'Your account has been suspended',
        },
      };
    }

    // Update login tracking
    try {
      const deviceInfo = await getDeviceInfo();
      await supabase.rpc('handle_login', {
        p_user_id: data.user.id,
        p_provider: 'password',
        p_device_info: deviceInfo,
      });
    } catch (rpcError) {
      // Don't fail login if tracking fails
      console.error('Login tracking error:', rpcError);
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
 * Sign out current user
 */
export async function signOut(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          code: 'signout_error',
          message: error.message,
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
        message: 'Failed to sign out',
      },
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get girl profile for current user
 */
export async function getCurrentGirlProfile(): Promise<GirlProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('girls')
      .select('id, user_id, username, name, is_blocked')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Get girl profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get girl profile error:', error);
    return null;
  }
}

/**
 * Send OTP code to email
 */
export async function sendOtp(
  email: string
): Promise<{ success: boolean; error?: AuthError }> {
  // Client-side validation
  if (!validateEmail(email)) {
    return {
      success: false,
      error: {
        code: 'invalid_email',
        message: 'Please enter a valid email address',
      },
    };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true, // 允许新用户
      },
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error.message);
      return {
        success: false,
        error: {
          code: error.status?.toString() || 'otp_error',
          message: errorMessage,
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Send OTP error:', error);
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
 * Verify OTP code
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<{ success: boolean; error?: AuthError }> {
  if (!validateEmail(email)) {
    return {
      success: false,
      error: {
        code: 'invalid_email',
        message: 'Please enter a valid email address',
      },
    };
  }

  if (!token || token.length !== 6) {
    return {
      success: false,
      error: {
        code: 'invalid_token',
        message: 'Please enter a valid 6-digit code',
      },
    };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error.message);
      return {
        success: false,
        error: {
          code: error.status?.toString() || 'verify_error',
          message: errorMessage,
        },
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: 'no_user',
          message: 'Verification failed',
        },
      };
    }

    // Check if user is banned
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_banned')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile check error:', profileError);
    }

    if (profile?.is_banned) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'account_banned',
          message: 'Your account has been suspended',
        },
      };
    }

    // Check if user is linked to a girl profile
    const { data: girl, error: girlError } = await supabase
      .from('girls')
      .select('id, user_id, username, name, is_blocked')
      .eq('user_id', data.user.id)
      .single();

    if (girlError || !girl) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'no_girl_profile',
          message: 'Account not linked to a service provider',
        },
      };
    }

    if (girl.is_blocked) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          code: 'girl_blocked',
          message: 'Your account has been suspended',
        },
      };
    }

    // Update login tracking
    try {
      const deviceInfo = await getDeviceInfo();
      await supabase.rpc('handle_login', {
        p_user_id: data.user.id,
        p_provider: 'email',
        p_device_info: deviceInfo,
      });
    } catch (rpcError) {
      console.error('Login tracking error:', rpcError);
    }

    return { success: true };
  } catch (error) {
    console.error('Verify OTP error:', error);
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
 * Map auth errors to user-friendly messages
 */
function getAuthErrorMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid_credentials')) {
    return 'Invalid email or password';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Please verify your email address';
  }

  if (lowerMessage.includes('over_email_send_rate_limit') || lowerMessage.includes('rate limit')) {
    return 'Too many attempts. Please try again later';
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Network error. Please check your connection';
  }

  if (lowerMessage.includes('otp_expired') || lowerMessage.includes('expired')) {
    return 'Verification code has expired';
  }

  if (lowerMessage.includes('invalid_otp') || lowerMessage.includes('token_not_found')) {
    return 'Invalid verification code';
  }

  return 'Authentication failed. Please try again';
}
