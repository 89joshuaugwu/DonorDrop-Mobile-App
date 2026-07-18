import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission (should ALWAYS be called after a
 * PermissionPrompt explanation screen, never cold — see DESIGN.md
 * Section 4) and returns the Expo push token.
 *
 * NOTE: This does NOT write to Firestore. The donor doc doesn't exist
 * yet at the point this is called during onboarding (finishRegistration
 * creates it right after), so writing here either throws "No document
 * to update" or gets blocked by rules that read resource.data on a
 * nonexistent doc. The caller includes the token in the initial setDoc
 * — see donor-register.tsx finishRegistration(). For re-registering a
 * push token on an already-onboarded donor (app reopened, token
 * rotated), use setDoc(..., { merge: true }) at the call site, never
 * updateDoc.
 */
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#DC2626",
    });
  }

  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device, not a simulator/emulator.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Notification permission not granted.");
    return null;
  }

  // projectId must be passed explicitly here — outside Expo Go (i.e. in
  // an EAS dev/preview/production build) getExpoPushTokenAsync() cannot
  // auto-infer it and throws without this.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}
