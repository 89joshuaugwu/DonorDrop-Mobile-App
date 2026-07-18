import type { BloodType } from "@/types/donor";

/**
 * Key = donor's blood type, value = recipient blood types that donor's
 * blood is compatible with. Mirrors donordrop-admin/lib/geohash.ts —
 * kept in sync manually since these are two separate codebases/repos.
 */
const DONOR_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/** Can this donor's blood type help a recipient who needs `bloodTypeNeeded`? */
export function isCompatibleDonor(donorType: BloodType, bloodTypeNeeded: BloodType): boolean {
  return DONOR_COMPATIBILITY[donorType].includes(bloodTypeNeeded);
}

/** Every donor blood type that could help a recipient needing `bloodTypeNeeded`. */
export function getCompatibleDonorTypes(bloodTypeNeeded: BloodType): BloodType[] {
  return (Object.keys(DONOR_COMPATIBILITY) as BloodType[]).filter((donorType) =>
    DONOR_COMPATIBILITY[donorType].includes(bloodTypeNeeded)
  );
}
