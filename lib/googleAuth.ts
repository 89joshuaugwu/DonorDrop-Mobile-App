import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential, type User } from "firebase/auth";
import { auth } from "./firebase";

/**
 * Native Google Sign-In (not the browser-based expo-auth-session flow).
 *
 * WHY THE SWITCH: expo-auth-session's browser flow needs a redirect URI
 * Google will actually honor. A "Web application" OAuth client (which is
 * what EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID points to) only accepts https://
 * redirect URIs — it silently rejects custom schemes like "donordrop://".
 * That flow can only ever work through Expo Go's auth proxy; it cannot
 * work in a standalone/dev-client/production build, no matter how the
 * scheme or redirect URI is configured. Native Google Sign-In sidesteps
 * this entirely by using the Google Play Services account picker
 * directly instead of a browser redirect.
 *
 * ONE-TIME SETUP REQUIRED (can't be done from code — needs your Firebase
 * project):
 * 1. Firebase Console -> Project settings -> Add app -> Android, using
 *    package name com.joshuazaza.donordrop. Download the
 *    google-services.json it gives you and put it at the project ROOT
 *    (same folder as app.json / package.json).
 * 2. Firebase Console -> Authentication -> Sign-in method -> Google ->
 *    make sure it's enabled (it already is, since this used to work via
 *    the browser flow) — note the "Web client ID" shown there, that's
 *    still what goes in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env.
 * 3. Register your app's SHA-1 certificate fingerprint(s) with Firebase
 *    (Project settings -> your Android app -> Add fingerprint):
 *      - For an EAS dev/preview build:  eas credentials  -> Android ->
 *        select your build profile -> "Keystore: Manage everything
 *        needed to build your project" -> view the SHA-1.
 *      - Do this for every build profile (development/preview/
 *        production) whose SHA-1 differs — Google Sign-In fails
 *        silently (no error, just an account picker that leads
 *        nowhere) for any keystore whose fingerprint isn't registered.
 * 4. npx expo install @react-native-google-signin/google-signin
 * 5. Rebuild (this is a native module — it will NOT work in Expo Go or
 *    an old dev-client build; rebuild with `eas build --profile
 *    development` after adding the config plugin in app.json).
 */
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

/**
 * Opens the native Google account picker and signs the result into
 * Firebase. Returns null if the user simply cancelled (not an error —
 * callers should just stop the loading spinner in that case); throws
 * for anything else so the caller can show a real error message.
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error(
        "Google didn't return an ID token. Double-check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is the Web client ID from Firebase (not the Android one)."
      );
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    return userCred.user;
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services isn't available or is out of date on this device.");
      }
    }
    throw err;
  }
}
