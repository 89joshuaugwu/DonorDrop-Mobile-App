import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential, type User } from "firebase/auth";
import { auth } from "./firebase";

// Required once at app startup so the system browser correctly closes
// and hands control back to the app after the OAuth redirect. Called
// here (module scope) so it only ever runs once, regardless of how
// many screens import this file.
WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

/**
 * Google Sign-In via the system browser (expo-auth-session), not an
 * embedded webview — this is required by Google's current OAuth policy
 * and works identically in Expo Go and EAS dev/preview/production builds,
 * since app.json already declares scheme: "donordrop".
 *
 * SETUP REQUIRED (one-time, manual):
 * 1. Firebase Console -> Authentication -> Sign-in method -> Google -> Enable.
 * 2. On that same screen, Firebase shows a "Web SDK configuration" ->
 *    "Web client ID" — copy it.
 * 3. Add it to your .env as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<that id>.
 * 4. Restart Metro (env vars are read at bundle time): npx expo start --clear
 *
 * No Android/iOS-specific OAuth client or SHA-1 fingerprint is needed for
 * this flow — the Web client ID + system browser handles both platforms.
 */
export function useGoogleAuthRequest() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({ scheme: "donordrop" }),
      extraParams: {
        // Basic replay protection. Not cryptographically hardened — fine
        // for this app's threat model; swap in expo-crypto's
        // digestStringAsync(SHA256, ...) later if you want it stronger.
        nonce: Math.random().toString(36).slice(2, 15),
      },
    },
    discovery
  );

  return { request, response, promptAsync };
}

/** Exchanges a Google id_token for a Firebase user via signInWithCredential. */
export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCred = await signInWithCredential(auth, credential);
  return userCred.user;
}
