export type BloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

export interface Donor {
  uid: string;
  name: string;
  phone: string;
  bloodType: BloodType;
  lat: number;
  lng: number;
  geohash: string;
  isVisible: boolean;
  verified: boolean;
  lastDonationDate: string | null;
  totalDonations: number;
  pushToken?: string;
  createdAt: string;
}
