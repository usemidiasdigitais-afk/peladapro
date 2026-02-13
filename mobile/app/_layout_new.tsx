import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      router.replace('/login');
      return;
    }

    // Redirecionar baseado em role
    switch (user?.role) {
      case 'SUPER_ADMIN':
        router.replace('/super-admin-dashboard');
        break;
      case 'ADMIN':
        router.replace('/admin-dashboard');
        break;
      case 'PLAYER':
        router.replace('/(tabs)');
        break;
      default:
        router.replace('/login');
    }
  }, [isLoading, isSignedIn, user?.role]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth Screens */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />

        {/* Super Admin */}
        <Stack.Screen name="super-admin-dashboard" options={{ headerShown: false }} />

        {/* Admin */}
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="create-match" options={{ headerShown: false }} />
        <Stack.Screen name="payment-settings" options={{ headerShown: false }} />

        {/* Player */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="pix-payment" options={{ headerShown: false }} />
        <Stack.Screen name="share-match" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
