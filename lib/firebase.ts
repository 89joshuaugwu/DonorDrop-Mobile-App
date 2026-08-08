import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-expect-error — getReactNativePersistence exists at runtime in firebase/auth's
// React Native build, but its type isn't exported from this entry point under the
// project's module resolution setting. Safe to ignore; if this starts type-checking
// cleanly on a future firebase upgrade, remove the expect-error.
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === "web") {
  auth = getAuth(firebaseApp);
} else {
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Fast Refresh re-runs this module and initializeAuth throws
    // "already-initialized" on the second pass — fall back to the
    // existing instance instead of crashing.
    auth = getAuth(firebaseApp);
  }
}

export { auth };
export const db = getFirestore(firebaseApp);
export const ADMIN_API_URL = process.env.EXPO_PUBLIC_ADMIN_API_URL || "";
