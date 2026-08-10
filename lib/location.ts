import * as Location from "expo-location";
import { doc, setDoc } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { db } from "./firebase";

/**
 * Current foreground location permission status — mirrors
 * getNotificationPermissionStatus() in push.ts: a read-only check for
 * UI, separate from anything that would trigger the OS prompt.
 */
export async function getLocationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "undetermined";
}

/**
 * Requests (if needed) foreground location permission, fetches the
 * current position, and writes lat/lng/geohash onto the donor doc.
 *
 * This is what a donor's profile-screen "Location" button calls — it's
 * the ONLY way to fix a donor stuck with lat/lng at 0,0 (donor-register
 * lets someone skip the location step entirely via its PermissionPrompt
 * "Not now" option), and the only way to update a donor's location
 * after they've actually moved, since donor-register only ever runs
 * once. Every nearby-request match (subscribeToNearbyCompatibleRequests
 * on their own Home screen, AND findNearbyDonors server-side for
 * notify-matches) depends on this being current — a donor whose
 * coordinates are stale or zeroed silently stops showing up as a match
 * for anyone, with no error anywhere to point at why.
 *
 * Returns the new permission status so the caller can update its own
 * UI state without a second round-trip.
 */
export async function refreshDonorLocation(
  uid: string
): Promise<"granted" | "denied" | "undetermined"> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    return status === Location.PermissionStatus.DENIED ? "denied" : "undetermined";
  }

  const position = await Location.getCurrentPositionAsync({});
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  await setDoc(
    doc(db, "donors", uid),
    { lat, lng, geohash: geohashForLocation([lat, lng]) },
    { merge: true }
  );

  return "granted";
}
