import { validateEmail, validatePassword } from '@/features/auth/api';
import { useSignIn } from '@/features/auth/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const { mutate: signIn, isPending, error } = useSignIn();

  // Validate on blur
  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    if (password && !validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters with letters and numbers');
    } else {
      setPasswordError('');
    }
  };

  // Clear errors on input change
  useEffect(() => {
    if (touched.email && email) {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password && password) {
      if (!validatePassword(password)) {
        setPasswordError('Password must be at least 6 characters with letters and numbers');
      } else {
        setPasswordError('');
      }
    }
  }, [password, touched.password]);

  const handleLogin = async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters with letters and numbers');
      return;
    }

    signIn({ email, password });
  };

  const isFormValid = email && password && !emailError && !passwordError;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#39b59a', '#46c5a7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="person-outline" size={36} color="#ffffff" />
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle} data-i18n="login.title">
              Welcome Back
            </Text>
            <Text style={styles.welcomeSubtitle} data-i18n="login.subtitle">
              Sign in to continue to CBODY Partner
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label} data-i18n="login.email">
                Email
              </Text>
              <TextInput
                style={[styles.input, emailError && touched.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                onBlur={handleEmailBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isPending}
              />
              {emailError && touched.email && (
                <Text style={styles.errorText}>{emailError}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label} data-i18n="login.password">
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    passwordError && touched.password && styles.inputError,
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={handlePasswordBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isPending}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </Pressable>
              </View>
              {passwordError && touched.password && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
            </View>

            {/* Server Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorMessage}>{error.message}</Text>
              </View>
            )}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.buttonContainer}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={isPending || !isFormValid}
          >
            <LinearGradient
              colors={['#39b59a', '#46c5a7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.button,
                (isPending || !isFormValid) && styles.buttonDisabled,
              ]}
            >
              {isPending ? (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText} data-i18n="login.signingIn">
                    Signing in...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText} data-i18n="login.signIn">
                  Sign In
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms & Privacy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to Cbody Go's{' '}
            </Text>
            <Pressable>
              <Text style={styles.termsLink} data-i18n="login.terms">
                Terms of Service
              </Text>
            </Pressable>
            <Text style={styles.termsText}> and </Text>
            <Pressable>
              <Text style={styles.termsLink} data-i18n="login.privacy">
                Privacy Policy
              </Text>
            </Pressable>
            <Text style={styles.termsText}>.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  welcomeContainer: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#d97706',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        // Remove elevation to avoid shadow issues with overflow:hidden
        elevation: 0,
      },
    }),
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
    ...Platform.select({
      android: {
        // On Android, use backgroundColor overlay instead of opacity
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
      },
    }),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    color: '#39b59a',
    fontWeight: '600',
    lineHeight: 18,
  },
});
