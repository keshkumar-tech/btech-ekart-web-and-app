import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/store/auth";
import { ThemeProvider } from "@/store/theme";
import { guestStore } from "@/store/guest";
import { registerForPushNotifications } from "@/lib/notifications";
import RootNavigator from "@/navigation/RootNavigator";
import WelcomePopup from "@/components/WelcomePopup";

// Show notifications even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  useEffect(() => {
    // Rehydrate guest cart/wishlist cache so signed-out users keep their picks.
    guestStore.init();
    registerForPushNotifications().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <StatusBar style="auto" />
              <RootNavigator />
              {/* Shown on every app open, as on the web. */}
              <WelcomePopup />
              <Toast />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
