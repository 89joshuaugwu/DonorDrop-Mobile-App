# Authentication

Two methods, both against the same Firebase Auth project the web app uses:

## Email / password

Straightforward — `lib/auth.ts` wraps
`createUserWithEmailAndPassword`/`signInWithEmailAndPassword`/`signOut`.
Forgot-password uses `sendPasswordResetEmail` directly in `auth.tsx`.

**Persistence** (`lib/firebase.ts`) is platform-conditional:
- Web: `getAuth()` (browser handles persistence itself)
- Native: `initializeAuth()` with `getReactNativePersistence(AsyncStorage)`,
  wrapped in try/catch — Fast Refresh re-runs this module during
  development and `initializeAuth` throws `already-initialized` on the
  second pass, so the catch falls back to `getAuth()` instead of crashing.

There's a `@ts-expect-error` on the `getReactNativePersistence` import —
it exists at runtime in `firebase/auth`'s React Native build, but isn't
in the exported types at that entry point under this project's module
resolution. Harmless; don't "fix" it by removing the import.

## Google Sign-In (native, not browser-based)

**This used to be `expo-auth-session`'s browser-redirect flow and it was
fundamentally broken outside Expo Go.** Google's *Web application* OAuth
client type (which is what the Firebase-issued "Web client ID" is) only
accepts `https://` redirect URIs — a custom scheme redirect
(`donordrop://`) is silently rejected by Google, no matter how it's
configured. It could only ever work through Expo Go's own auth proxy.
`lib/googleAuth.ts` now uses `@react-native-google-signin/google-signin`
instead — the native Play Services / Sign in with Apple-style account
picker, no browser redirect involved.

### Setup this depends on (all external, not fixable from code)

1. **`google-services.json`** (Android) / **`GoogleService-Info.plist`**
   (iOS) at the project root, referenced in `app.json`'s
   `android.googleServicesFile` / `ios.googleServicesFile`. These are
   committed to git (see BUILD_AND_DEPLOY.md for why that's fine here).
2. **Firebase Android app package name must exactly match
   `com.joshuazaza.donordrop`** — a real bug hit during setup: an
   Android app was registered in Firebase under a *different* package
   name by mistake, which silently broke both Sign-In and push
   notifications until caught. If either breaks again with no clear
   error, check this first.
3. **SHA-1 certificate fingerprint(s) registered in Firebase** — one per
   EAS build profile whose keystore differs (development/preview/
   production each get their own keystore unless configured otherwise).
   Get them via `eas credentials` → Android → pick the profile → view
   keystore. Missing SHA-1 for a given build's keystore is the #1 cause
   of Google Sign-In failing *silently* (account picker opens, nothing
   happens, no error) — it's specific to whichever build/keystore you're
   testing, so "it works on my dev build but not the APK" usually means
   this.
4. **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** (`.env`) — still the Firebase
   **Web** client ID (Authentication → Sign-in method → Google provider),
   even though the flow is now native. `GoogleSignin.configure()` uses
   this to know which backend project to issue the ID token for; Firebase
   then verifies that token server-side via `signInWithCredential`.

### Why this is a native module, not a JS-only change

`@react-native-google-signin/google-signin` compiles native code into the
app binary. It does **not** work in Expo Go, and it doesn't work in an
existing dev-client build that was compiled before the package was added
— any change here needs a fresh `eas build` (see BUILD_AND_DEPLOY.md).

## Routing after sign-in

`auth.tsx`'s `routeAfterAuth(uid)` is the single place that decides where
a freshly-authenticated user lands — it checks whether a profile already
exists for the chosen role (`fetchUserProfiles`) and routes to that
role's home tab if so, or the registration form if not. This exists
specifically to stop a *returning* donor's stats (`totalDonations`,
`verified`, `pushToken`) from being silently wiped — the old flow always
sent people through `donor-register.tsx`, whose `setDoc` would overwrite
an existing profile with a blank one on every login.
