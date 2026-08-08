import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { geohashForLocation, geohashQueryBounds, distanceBetween } from "geofire-common";
import { db, ADMIN_API_URL } from "./firebase";
import { getCompatibleDonorTypes } from "./compatibility";
import type { BloodRequest, RequestResponse, RequestUrgency } from "@/types/request";
import type { BloodType } from "@/types/donor";

export interface CreateRequestInput {
  requesterUid: string;
  requesterName: string;
  requesterPhone: string;
  bloodTypeNeeded: BloodType;
  units: number;
  urgency: RequestUrgency;
  hospitalName: string;
  lat: number;
  lng: number;
  notes?: string;
}

/**
 * Creates a /requests/{id} doc, then calls bloodpadi-admin's
 * /api/requests/notify-matches endpoint so the server (which has
 * firebase-admin + the Expo push secret) can run the matching + push
 * fan-out. This is a cross-project API call — EXPO_PUBLIC_ADMIN_API_URL
 * must point at your DEPLOYED donordrop-admin Vercel URL, not localhost,
 * once you're testing on a physical device.
 */
export async function createRequest(input: CreateRequestInput): Promise<string> {
  const requestRef = doc(collection(db, "requests"));
  const geohash = geohashForLocation([input.lat, input.lng]);

  const requestDoc: Omit<BloodRequest, "id"> = {
    requesterUid: input.requesterUid,
    requesterName: input.requesterName,
    requesterPhone: input.requesterPhone,
    bloodTypeNeeded: input.bloodTypeNeeded,
    units: input.units,
    urgency: input.urgency,
    hospitalName: input.hospitalName,
    lat: input.lat,
    lng: input.lng,
    geohash,
    notes: input.notes ?? "",
    status: "open",
    createdAt: new Date().toISOString(),
  };

  await setDoc(requestRef, requestDoc);

  try {
    await setDoc(doc(db, "metadata", "requests"), {
      lastUpdatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("Could not update global metadata/requests pulse", err);
  }

  if (ADMIN_API_URL) {
    try {
      await fetch(`${ADMIN_API_URL}/api/requests/notify-matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestRef.id }),
      });
    } catch (err) {
      // Request is already saved even if the notify call fails — donors
      // just won't get pushed. Log it; don't block the requester's flow.
      console.error("notify-matches call failed", err);
    }
  } else {
    console.warn("EXPO_PUBLIC_ADMIN_API_URL is not set — skipping notify-matches call.");
  }

  return requestRef.id;
}

/** Donor responds "Available" or "Can't help right now" to a request. */
export async function respondToRequest(
  requestId: string,
  donorUid: string,
  donorName: string,
  donorPhone: string,
  donorBloodType: BloodType,
  available: boolean
): Promise<void> {
  const responseRef = doc(db, "requests", requestId, "responses", donorUid);
  const response: RequestResponse = {
    donorUid,
    donorName,
    donorPhone,
    bloodType: donorBloodType,
    available,
    respondedAt: new Date().toISOString(),
  };
  await setDoc(responseRef, response);
}

export async function markRequestFulfilled(requestId: string): Promise<void> {
  await updateDoc(doc(db, "requests", requestId), {
    status: "fulfilled",
    fulfilledAt: new Date().toISOString(),
  });
}

export async function getRequest(requestId: string): Promise<BloodRequest | null> {
  const snap = await getDoc(doc(db, "requests", requestId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BloodRequest;
}

export async function getRequestResponses(requestId: string): Promise<RequestResponse[]> {
  const snap = await getDocs(
    query(collection(db, "requests", requestId, "responses"), orderBy("respondedAt", "desc"))
  );
  return snap.docs.map((d) => d.data() as RequestResponse);
}

/**
 * A donor checking THEIR OWN response to a request. Uses a direct
 * single-doc getDoc — NOT getRequestResponses' collection query — because
 * the Firestore rules only grant a donor read access to their own
 * response doc (isOwner(donorId)), not the whole /responses subcollection.
 * A getDocs() list query is denied unless the rule holds for every doc
 * in the result set, so a random donor calling getRequestResponses()
 * always fails with "Missing or insufficient permissions" even though
 * their own response was written successfully.
 */
export async function getMyResponse(
  requestId: string,
  donorUid: string
): Promise<RequestResponse | null> {
  const snap = await getDoc(doc(db, "requests", requestId, "responses", donorUid));
  return snap.exists() ? (snap.data() as RequestResponse) : null;
}

/**
 * For a set of requests the current user owns, returns how many donors
 * responded "available" on each — used for the "Donor Matches" stat and
 * per-card match counts on the requester's My Requests screen. Only
 * works for requests the caller owns (same rule constraint as
 * getRequestResponses), so only call this with the signed-in
 * requester's own request IDs.
 */
export async function getAvailableMatchCounts(requestIds: string[]): Promise<Record<string, number>> {
  const entries = await Promise.all(
    requestIds.map(async (id) => {
      const responses = await getRequestResponses(id);
      return [id, responses.filter((r) => r.available).length] as const;
    })
  );
  return Object.fromEntries(entries);
}

export async function getMyRequests(requesterUid: string): Promise<BloodRequest[]> {
  const snap = await getDocs(
    query(
      collection(db, "requests"),
      where("requesterUid", "==", requesterUid),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BloodRequest);
}

/**
 * Donor Home screen query: nearby OPEN requests whose bloodTypeNeeded is
 * compatible with this donor's blood type. This is the inverse of
 * findNearbyDonors() on the admin side — here we query /requests instead
 * of /donors, filtering by which requests THIS donor could help with.
 */
export async function getNearbyCompatibleRequests(
  donorBloodType: BloodType,
  lat: number,
  lng: number,
  radiusKm: number = 15
): Promise<(BloodRequest & { distanceKm: number })[]> {
  const center: [number, number] = [lat, lng];
  const bounds = geohashQueryBounds(center, radiusKm * 1000);

  const compatibleForTypes: BloodType[] = (
    ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as BloodType[]
  ).filter((needed) => getCompatibleDonorTypes(needed).includes(donorBloodType));

  const snapshots = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          collection(db, "requests"),
          orderBy("geohash"),
          where("geohash", ">=", start),
          where("geohash", "<=", end)
        )
      )
    )
  );

  const seen = new Set<string>();
  const results: (BloodRequest & { distanceKm: number })[] = [];

  for (const snap of snapshots) {
    for (const docSnap of snap.docs) {
      const request = { id: docSnap.id, ...docSnap.data() } as BloodRequest;
      if (seen.has(request.id)) continue;
      if (request.status !== "open") continue;
      if (!compatibleForTypes.includes(request.bloodTypeNeeded)) continue;
      seen.add(request.id);

      const distanceKm = distanceBetween([request.lat, request.lng], center);
      if (distanceKm <= radiusKm) {
        results.push({ ...request, distanceKm });
      }
    }
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Real-time version of getNearbyCompatibleRequests.
 * Calculates bounding boxes and attaches an onSnapshot listener to each.
 * Merges the results, filters by distance/compatibility, and fires the callback.
 * Returns an unsubscribe function to detach all listeners.
 */
export function subscribeToNearbyCompatibleRequests(
  donorBloodType: BloodType,
  lat: number,
  lng: number,
  radiusKm: number,
  onUpdate: (requests: (BloodRequest & { distanceKm: number })[]) => void
): () => void {
  const center: [number, number] = [lat, lng];
  const bounds = geohashQueryBounds(center, radiusKm * 1000);

  const compatibleForTypes: BloodType[] = (
    ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as BloodType[]
  ).filter((needed) => getCompatibleDonorTypes(needed).includes(donorBloodType));

  // Map to store the latest results from all listeners
  // Keyed by request ID to prevent duplicates across boundary overlaps
  const requestsMap = new Map<string, BloodRequest & { distanceKm: number }>();
  let initialLoadsRemaining = bounds.length;

  const emitUpdate = () => {
    // Only emit after all listeners have fired at least once (initial payload)
    // or if bounds are empty (unlikely but possible).
    if (initialLoadsRemaining > 0) return;

    const results = Array.from(requestsMap.values());
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    onUpdate(results);
  };

  const unsubscribes = bounds.map(([start, end]) => {
    const q = query(
      collection(db, "requests"),
      orderBy("geohash"),
      where("geohash", ">=", start),
      where("geohash", "<=", end)
    );

    return onSnapshot(q, (snapshot) => {
      // Process doc changes
      snapshot.docChanges().forEach((change) => {
        const docSnap = change.doc;
        const request = { id: docSnap.id, ...docSnap.data() } as BloodRequest;

        if (change.type === "removed") {
          requestsMap.delete(request.id);
          return;
        }

        // For added or modified, check compatibility and distance
        if (request.status !== "open" || !compatibleForTypes.includes(request.bloodTypeNeeded)) {
          requestsMap.delete(request.id); // might have been open, now fulfilled
          return;
        }

        const distanceKm = distanceBetween([request.lat, request.lng], center);
        if (distanceKm <= radiusKm) {
          requestsMap.set(request.id, { ...request, distanceKm });
        } else {
          // It's outside the exact radius despite being in the bounding box
          requestsMap.delete(request.id);
        }
      });

      if (initialLoadsRemaining > 0) {
        initialLoadsRemaining--;
      }
      
      emitUpdate();
    });
  });

  // Return a cleanup function that unsubscribes all active listeners
  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

/**
 * Real-time version of getMyRequests.
 */
export function subscribeToMyRequests(
  requesterUid: string,
  onUpdate: (requests: BloodRequest[]) => void
): () => void {
  const q = query(
    collection(db, "requests"),
    where("requesterUid", "==", requesterUid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BloodRequest);
    onUpdate(results);
  });
}

/**
 * Real-time version of getting match counts for a specific request.
 */
export function subscribeToRequestMatchCount(
  requestId: string,
  onUpdate: (count: number) => void
): () => void {
  const q = collection(db, "requests", requestId, "responses");

  return onSnapshot(q, (snapshot) => {
    // A match is when available === true
    const availableCount = snapshot.docs.filter((d) => {
      const data = d.data() as RequestResponse;
      return data.available === true;
    }).length;
    onUpdate(availableCount);
  });
}
