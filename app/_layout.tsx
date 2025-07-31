import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';

const queryClient = new QueryClient();

const RootLayout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
};

const RootLayoutNav = () => {
  const { session, isLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const { setColorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Sync NativeWind theme with our custom theme context
    setColorScheme(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavThemeProvider value={effectiveTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
    </NavThemeProvider>
  );
};

export default RootLayout;
