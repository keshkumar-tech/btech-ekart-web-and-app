// Expo push notification registration.
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { http } from "@/lib/api";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push tokens are only issued on physical devices.
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2874f0",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const token = (
    await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
  ).data;

  // Best-effort: only the backend cares, and only when the user is signed in.
  try {
    await http.post("/api/notifications/register-device/", {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Not signed in yet, or offline — will retry on next launch.
  }
  return token;
}
