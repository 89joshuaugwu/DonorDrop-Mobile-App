import type { BloodType } from "./donor";

export type RequestUrgency = "Critical" | "Urgent" | "Normal";
export type RequestStatus = "open" | "fulfilled" | "spam" | "cancelled";

export interface BloodRequest {
  id: string;
  requesterUid: string;
  requesterName: string;
  requesterPhone: string;
  bloodTypeNeeded: BloodType;
  units: number;
  urgency: RequestUrgency;
  hospitalName: string;
  lat: number;
  lng: number;
  geohash: string;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  fulfilledAt?: string;
}

export interface RequestResponse {
  donorUid: string;
  donorName: string;
  donorPhone: string;
  bloodType: BloodType;
  available: boolean;
  respondedAt: string;
}
