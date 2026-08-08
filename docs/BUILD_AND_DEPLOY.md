# Build & Deploy

## EAS build profiles (`eas.json`)

| Profile | Purpose | Output | Distribution |
|---|---|---|---|
| `development` | Dev client — connects to Metro, for active development | native app | internal |
| `preview` | Quick installable build for testers/yourself | `.apk` (`android.buildType: "apk"`) | internal |
| `production` | Play Store submission | `.aab` (Play Store requires this format) | — |

```
eas build --profile development --platform android   # dev client
eas build --profile preview --platform android        # quick-download APK
eas build --profile production --platform android      # Play Store bundle
```

**Rebuild, don't just reload, whenever a native module changes** — that
means `@react-native-google-signin/google-signin`, `react-native-maps`,
or anything added via `npx expo install <native package>`. JS-only
changes hot-reload fine on an existing dev client; native module changes
need a fresh build or they silently don't exist in the running app.

## Required config files (committed to git, on purpose)

`google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are
**committed**, not gitignored. This was a deliberate call, not an
oversight:
- EAS Build determines what to upload for a cloud build by reading
  `.gitignore` — gitignoring these files means EAS can't see them either,
  and the build fails with "google-services.json is missing." (A
  `.easignore` file can un-ignore specific paths for EAS while keeping
  them out of git, but that's extra complexity this project decided
  wasn't worth it.)
- These files aren't true secrets — Firebase's real security boundary is
  Firestore security rules and **API key restrictions**, not keeping
  this file hidden. Google's own docs say committing it is fine.
- **The actual thing to secure**: restrict the API key(s) inside these
  files in Google Cloud Console → Credentials → *Application
  restrictions* → lock to `com.joshuazaza.donordrop` + your SHA-1
  fingerprint(s). Do this for the Firebase-issued Android key AND the
  separate Google Maps API key in `app.json`
  (`android.config.googleMaps.apiKey`) — an unrestricted key embedded in
  a public repo/APK can be used by anyone to run up your billing.

## Google Sign-In / push notification setup (one-time, per environment)

See AUTHENTICATION.md and NOTIFICATIONS.md for the why; checklist form:

1. Firebase Android app registered with package name **exactly**
   `com.joshuazaza.donordrop`
2. SHA-1 fingerprint added to that Firebase app for **every** build
   profile you test (`eas credentials` → Android → pick profile → view
   keystore)
3. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` = Firebase's Web client ID
4. `npx expo install @react-native-google-signin/google-signin react-native-maps`
5. FCM V1 service account key uploaded to EAS credentials (`eas
   dashboard` → Credentials → Android → your app → Service credentials)
   — this is what the original "Default FirebaseApp is not initialized"
   console error was asking for

## Play Store submission

`eas.json`'s `submit.production.android` is set to `track: "internal"`,
`releaseStatus: "draft"` — first upload lands as a draft internal-testing
release, not a public rollout. Promote it manually in Play Console once
you've reviewed it there.

**Before your first submission ever**, the app needs to exist in Play
Console (Create app, matching package name) and you need a Google Play
API service account — **this is a different kind of service account key
than the Firebase Admin SDK one used for FCM**, even though both are
"service account JSON files." It has to come from Play Console's own
**Setup → API access** flow (which links a Cloud project and grants a
specific service account Release Manager access), not just any Firebase
Admin key — using the wrong kind fails with a permissions error at
submit time, not build time.

```
eas submit --platform android --profile production
```

Select **"Select a build from EAS"** and pick your latest production
build when prompted.

## Maps API key

`app.json`'s `android.config.googleMaps.apiKey` is a Google Maps
Platform key (Android Maps SDK enabled), used by `react-native-maps` in
`components/molecules/RequestMap.tsx`. Same restriction advice as above
applies. iOS would need its own separate key if/when this app ships on
iOS with maps — Apple Maps is the default provider without one, Google
Maps needs an iOS-specific key configured separately.
