import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../lib/session';
import { palette } from '../lib/theme';

export default function RootLayout() {
  return <SafeAreaProvider>
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="page/[number]" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
        <Stack.Screen name="write" />
        <Stack.Screen name="message/compose" />
        <Stack.Screen name="message/[id]" />
      </Stack>
    </SessionProvider>
  </SafeAreaProvider>;
}
