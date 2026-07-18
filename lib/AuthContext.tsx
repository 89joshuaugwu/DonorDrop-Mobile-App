import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "./firebase";
import type { Donor } from "@/types/donor";

export interface RequesterProfile {
  uid: string;
  name: string;
  phone: string;
  organization?: string;
}

interface AuthContextValue {
  user: User | null;
  donorProfile: Donor | null;
  requesterProfile: RequesterProfile | null;
  activeRole: "donor" | "requester" | null;
  loading: boolean;
  setActiveRole: (role: "donor" | "requester") => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  donorProfile: null,
  requesterProfile: null,
  activeRole: null,
  loading: true,
  setActiveRole: async () => {},
  refreshProfiles: async () => {},
});

const ACTIVE_ROLE_KEY = "donordrop_active_role";

/**
 * Reads both profile docs for a uid directly from Firestore and returns
 * them, WITHOUT touching React state. Use this right after signUp/login/
 * Google sign-in — at that point `useAuth()`'s `user` hasn't updated yet
 * (onAuthStateChanged fires asynchronously), so routing decisions need
 * the freshly-signed-in uid passed in explicitly, not read from context.
 */
export async function fetchUserProfiles(uid: string): Promise<{
  donor: Donor | null;
  requester: RequesterProfile | null;
}> {
  const [donorSnap, requesterSnap] = await Promise.all([
    getDoc(doc(db, "donors", uid)),
    getDoc(doc(db, "requesters", uid)),
  ]);
  return {
    donor: donorSnap.exists() ? (donorSnap.data() as Donor) : null,
    requester: requesterSnap.exists() ? (requesterSnap.data() as RequesterProfile) : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [donorProfile, setDonorProfile] = useState<Donor | null>(null);
  const [requesterProfile, setRequesterProfile] = useState<RequesterProfile | null>(null);
  const [activeRole, setActiveRoleState] = useState<"donor" | "requester" | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfiles(uid: string) {
    const { donor, requester } = await fetchUserProfiles(uid);
    setDonorProfile(donor);
    setRequesterProfile(requester);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfiles(firebaseUser.uid);
        const storedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
        if (storedRole === "donor" || storedRole === "requester") {
          setActiveRoleState(storedRole);
        }
      } else {
        setDonorProfile(null);
        setRequesterProfile(null);
        setActiveRoleState(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function setActiveRole(role: "donor" | "requester") {
    await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRoleState(role);
  }

  async function refreshProfiles() {
    if (user) await loadProfiles(user.uid);
  }

  return (
    <AuthContext.Provider
      value={{ user, donorProfile, requesterProfile, activeRole, loading, setActiveRole, refreshProfiles }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
