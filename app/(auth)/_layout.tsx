import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sign-in-phone" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
