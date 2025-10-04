import { validateEmail } from '@/features/auth/api';
import { useSendOtp, useVerifyOtp } from '@/features/auth/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
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

const RESEND_COOLDOWN = 60; // 60 seconds

export default function SignInEmailScreen() {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [emailError, setEmailError] = useState('');
    const [touched, setTouched] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Refs for OTP inputs
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const { mutate: sendOtp, isPending: isSending, error: sendError } = useSendOtp();
    const { mutate: verifyOtp, isPending: isVerifying, error: verifyError } = useVerifyOtp();

    // Handle resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Auto-focus first input when entering code step
    useEffect(() => {
        if (step === 'code' && inputRefs.current[0]) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [step]);

    const handleEmailBlur = () => {
        setTouched(true);
        if (email && !validateEmail(email)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    useEffect(() => {
        if (touched && email) {
            if (!validateEmail(email)) {
                setEmailError('Please enter a valid email address');
            } else {
                setEmailError('');
            }
        }
    }, [email, touched]);

    const handleSendCode = () => {
        setTouched(true);

        if (!email) {
            setEmailError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        sendOtp(email, {
            onSuccess: () => {
                setStep('code');
                setResendTimer(RESEND_COOLDOWN);
            },
        });
    };

    const handleResendCode = () => {
        if (resendTimer > 0) return;

        sendOtp(email, {
            onSuccess: () => {
                setResendTimer(RESEND_COOLDOWN);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            },
        });
    };

    const handleCodeChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1); // Only take last character
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (index === 5 && value && newCode.every((digit) => digit !== '')) {
            handleVerifyCode(newCode.join(''));
        }
    };

    const handleKeyPress = (index: number, key: string) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyCode = (finalCode?: string) => {
        const verificationCode = finalCode || code.join('');

        if (verificationCode.length !== 6) {
            return;
        }

        verifyOtp({ email, token: verificationCode });
    };

    const handleBackToEmail = () => {
        setStep('email');
        setCode(['', '', '', '', '', '']);
        setResendTimer(0);
    };

    const handleBackToSignIn = () => {
        router.replace('/(auth)/sign-in');
    };

    const isEmailValid = email && !emailError && validateEmail(email);
    const isCodeComplete = code.every((digit) => digit !== '');

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
                    {/* Back Button */}
                    <Pressable
                        style={styles.backButton}
                        onPress={step === 'email' ? handleBackToSignIn : handleBackToEmail}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </Pressable>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#39b59a', '#46c5a7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoCircle}
                        >
                            <Ionicons name="mail-outline" size={36} color="#ffffff" />
                        </LinearGradient>
                    </View>

                    {/* Step 1: Email Input */}
                    {step === 'email' && (
                        <>
                            {/* Title */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.title} data-i18n="login.emailTitle">
                                    Sign in with Email
                                </Text>
                                <Text style={styles.subtitle} data-i18n="login.emailSubtitle">
                                    We'll send you a verification code
                                </Text>
                            </View>

                            {/* Email Input */}
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label} data-i18n="login.email">
                                        Email
                                    </Text>
                                    <TextInput
                                        style={[styles.input, emailError && touched && styles.inputError]}
                                        placeholder="your@email.com"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={setEmail}
                                        onBlur={handleEmailBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                        onSubmitEditing={handleSendCode}
                                        editable={!isSending}
                                        autoFocus
                                    />
                                    {emailError && touched && (
                                        <Text style={styles.errorText}>{emailError}</Text>
                                    )}
                                </View>

                                {/* Send Error */}
                                {sendError && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                                        <Text style={styles.errorMessage}>{sendError.message}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Send Code Button */}
                            <TouchableOpacity
                                style={styles.buttonContainer}
                                activeOpacity={0.8}
                                onPress={handleSendCode}
                                disabled={isSending || !isEmailValid}
                            >
                                <LinearGradient
                                    colors={['#39b59a', '#46c5a7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.button,
                                        (isSending || !isEmailValid) && styles.buttonDisabled,
                                    ]}
                                >
                                    {isSending ? (
                                        <Text style={styles.buttonText} data-i18n="login.sending">
                                            Sending...
                                        </Text>
                                    ) : (
                                        <Text style={styles.buttonText} data-i18n="login.sendCode">
                                            Send Code
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 2: Code Input */}
                    {step === 'code' && (
                        <>
                            {/* Title */}
                            <View style={styles.titleContainer}>
                                <Text style={styles.title} data-i18n="login.codeTitle">
                                    Verify Your Email
                                </Text>
                                <Text style={styles.subtitle} data-i18n="login.codeSubtitle">
                                    Enter the 6-digit code sent to
                                </Text>
                                <Text style={styles.emailDisplay}>{email}</Text>
                            </View>

                            {/* Code Inputs */}
                            <View style={styles.codeContainer}>
                                {code.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => {
                                            inputRefs.current[index] = ref;
                                        }}
                                        style={[
                                            styles.codeInput,
                                            digit && styles.codeInputFilled,
                                            verifyError && styles.codeInputError,
                                        ]}
                                        value={digit}
                                        onChangeText={(value) => handleCodeChange(index, value)}
                                        onKeyPress={({ nativeEvent }) =>
                                            handleKeyPress(index, nativeEvent.key)
                                        }
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        selectTextOnFocus
                                        editable={!isVerifying}
                                    />
                                ))}
                            </View>

                            {/* Verify Error */}
                            {verifyError && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                                    <Text style={styles.errorMessage}>{verifyError.message}</Text>
                                </View>
                            )}

                            {/* Resend Code */}
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText} data-i18n="login.didntReceive">
                                    Didn't receive the code?
                                </Text>
                                {resendTimer > 0 ? (
                                    <Text style={styles.resendTimer}>
                                        Resend in {resendTimer}s
                                    </Text>
                                ) : (
                                    <Pressable onPress={handleResendCode} disabled={isSending}>
                                        <Text style={styles.resendLink} data-i18n="login.resend">
                                            {isSending ? 'Sending...' : 'Resend Code'}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>

                            {/* Verify Button */}
                            <TouchableOpacity
                                style={styles.buttonContainer}
                                activeOpacity={0.8}
                                onPress={() => handleVerifyCode()}
                                disabled={isVerifying || !isCodeComplete}
                            >
                                <LinearGradient
                                    colors={['#39b59a', '#46c5a7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.button,
                                        (isVerifying || !isCodeComplete) && styles.buttonDisabled,
                                    ]}
                                >
                                    {isVerifying ? (
                                        <Text style={styles.buttonText} data-i18n="login.verifying">
                                            Verifying...
                                        </Text>
                                    ) : (
                                        <Text style={styles.buttonText} data-i18n="login.verify">
                                            Verify & Sign In
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

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
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
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
    titleContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailDisplay: {
        fontSize: 16,
        fontWeight: '600',
        color: '#39b59a',
        textAlign: 'center',
        marginTop: 4,
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
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
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
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
    },
    codeInputFilled: {
        borderColor: '#39b59a',
        backgroundColor: '#ffffff',
    },
    codeInputError: {
        borderColor: '#ef4444',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        gap: 4,
    },
    resendText: {
        fontSize: 14,
        color: '#6b7280',
    },
    resendTimer: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    resendLink: {
        fontSize: 14,
        color: '#39b59a',
        fontWeight: '600',
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
                elevation: 3,
            },
        }),
    },
    button: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
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

