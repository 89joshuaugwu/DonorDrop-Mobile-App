import { collection, doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";
import type { Donation } from "@/types/donation";

/**
 * Logs a completed donation AND resets the donor's lastDonationDate to
 * now, which resets the 90-day eligibility countdown. The EligibilityCard
 * reads lastDonationDate fresh on every Home screen focus, so this should
 * reflect immediately without needing a manual refresh.
 */
export async function logDonation(donorUid: string, location: string): Promise<void> {
  const donationRef = doc(collection(db, "donations"));
  const now = new Date().toISOString();

  const donation: Omit<Donation, "id"> = {
    donorUid,
    location,
    loggedAt: now,
  };

  await setDoc(donationRef, donation);

  await updateDoc(doc(db, "donors", donorUid), {
    lastDonationDate: now,
    totalDonations: increment(1),
  });
}
