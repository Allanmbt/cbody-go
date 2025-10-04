import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth flow, AuthGate will handle the rest
  return <Redirect href="/(auth)/sign-in" />;
}
