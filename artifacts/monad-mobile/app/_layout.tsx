import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColors } from '@/hooks/useColors';
import { setBaseUrl } from '@workspace/api-client-react';

// Set the API base URL once at module load time.
// EXPO_PUBLIC_DOMAIN is injected by the dev script (= $REPLIT_DEV_DOMAIN).
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
});

function RootLayoutNav() {
  const colors = useColors();

  const headerStyle = {
    backgroundColor: colors.background,
  } as const;

  return (
    <Stack
      screenOptions={{
        headerStyle,
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          color: colors.foreground,
          fontSize: 17,
        },
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerBackTitleStyle: {
          fontFamily: 'Inter_400Regular',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="project/[id]/index"
        options={{
          title: 'Project',
          headerStyle,
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: 'Inter_600SemiBold',
            color: colors.foreground,
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="project/[id]/audit"
        options={{
          title: 'AI Audit',
          headerStyle,
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: 'Inter_600SemiBold',
            color: colors.foreground,
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
