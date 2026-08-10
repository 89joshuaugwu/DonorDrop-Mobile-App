import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, Switch, Linking } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, orderBy, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { BadgeCheck, Bell, MapPin } from "lucide-react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { logDonation } from "@/lib/donations";
import { registerForPushNotifications, getNotificationPermissionStatus } from "@/lib/push";
import { getLocationPermissionStatus, refreshDonorLocation } from "@/lib/location";
import { logout } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import StatCard from "@/components/ui/StatCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import DonationHistoryItem from "@/components/molecules/DonationHistoryItem";
import PermissionRow, { type PermissionStatus } from "@/components/molecules/PermissionRow";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Donation } from "@/types/donation";

const LIVES_PER_DONATION = 3;
const HISTORY_PREVIEW_COUNT = 3;

export default function DonorProfileScreen() {
  const { user, donorProfile, refreshProfiles } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>("checking");
  const [locStatus, setLocStatus] = useState<PermissionStatus>("checking");
  const [notifLoading, setNotifLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const loadDonations = useCallback(async () => {
    if (!user) return;
    const snap = await getDocs(
      query(collection(db, "donations"), where("donorUid", "==", user.uid), orderBy("loggedAt", "desc"))
    );
    setDonations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Donation));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDonations();
    }, [loadDonations])
  );

  // Keeps a live ref to the current donor profile WITHOUT it being a
  // dependency of the push-registration effect below — reading through
  // a ref instead of depending on the object directly is what stops
  // that effect from re-triggering itself every time it calls
  // refreshProfiles() (a new donorProfile object is a new dependency
  // value; depending on it directly would re-fire this effect forever,
  // the same infinite-loop class documented in docs/REALTIME.md).
  const donorProfileRef = useRef(donorProfile);
  useEffect(() => {
    donorProfileRef.current = donorProfile;
  }, [donorProfile]);

  // Re-checks the push token once per login session (effect only
  // depends on `user`, not `donorProfile`) and WRITES it if it's
  // missing or has changed. The old version fetched a fresh token and
  // discarded it — registerForPushNotifications() was called but its
  // return value was never persisted anywhere, so a stale token could
  // never self-heal. This matters most right after an EAS project
  // migration: Expo push tokens are tied to the projectId they were
  // issued under, so every donor registered before a migration is left
  // holding a token that looks present (so nothing ever re-fetches) but
  // no longer routes anywhere.
  //
  // The old `if (!donorProfile.pushToken)` guard was also a latent
  // infinite loop: if a donor never got a token in the first place
  // (permission denied, etc.), the discarded fetch meant the field
  // stayed unset forever, so the condition stayed true and
  // refreshProfiles() kept producing a new donorProfile object that
  // re-triggered this same effect — the exact loop class documented in
  // docs/REALTIME.md. Depending only on `user` here, and reading the
  // current token through a ref instead of the effect's own dependency
  // array, closes both problems at once.
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.uid).then(async (token) => {
      if (token && token !== donorProfileRef.current?.pushToken) {
        await setDoc(doc(db, "donors", user.uid), { pushToken: token }, { merge: true });
        await refreshProfiles();
      }
    });
  }, [user]);

  // Read-only status check for the two PermissionRow buttons below —
  // does NOT trigger an OS prompt on its own, unlike the effect above.
  // Runs once per mount so the buttons reflect reality (granted/denied/
  // undetermined) rather than assuming everything's fine.
  useEffect(() => {
    getNotificationPermissionStatus().then(setNotifStatus);
    getLocationPermissionStatus().then(setLocStatus);
  }, []);

  async function handleNotificationsPress() {
    if (notifStatus === "denied") {
      Linking.openSettings();
      return;
    }
    if (!user) return;
    setNotifLoading(true);
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        await setDoc(doc(db, "donors", user.uid), { pushToken: token }, { merge: true });
        await refreshProfiles();
      }
      setNotifStatus(await getNotificationPermissionStatus());
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleLocationPress() {
    if (locStatus === "denied") {
      Linking.openSettings();
      return;
    }
    if (!user) return;
    setLocLoading(true);
    try {
      const result = await refreshDonorLocation(user.uid);
      setLocStatus(result);
      if (result === "granted") {
        await refreshProfiles();
      }
    } finally {
      setLocLoading(false);
    }
  }

  async function handleLogDonation() {
    if (!user || !location.trim()) return;
    setSaving(true);
    try {
      await logDonation(user.uid, location.trim());
      setLocation("");
      setShowLogForm(false);
      await Promise.all([loadDonations(), refreshProfiles()]);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisibility(value: boolean) {
    if (!user) return;
    await updateDoc(doc(db, "donors", user.uid), { isVisible: value });
    await refreshProfiles();
  }

  const visibleDonations = useMemo(
    () => (showAllHistory ? donations : donations.slice(0, HISTORY_PREVIEW_COUNT)),
    [donations, showAllHistory]
  );

  if (!donorProfile) return null;

  const totalDonations = donorProfile.totalDonations ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center mb-6">
          <Avatar name={donorProfile.name} size="lg" />
          <View className="flex-row items-center mt-3">
            <Text className="text-xl font-extrabold text-brand-text">{donorProfile.name}</Text>
            {donorProfile.verified && (
              <BadgeCheck size={18} color="#2563EB" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text className="text-brand-textsecondary">{donorProfile.phone}</Text>
          <RoleTag label={`${donorProfile.bloodType} Donor`} />
        </View>

        <View className="flex-row gap-3 mb-4">
          <StatCard label="Total Donations" value={totalDonations} />
          <StatCard label="Lives Saved" value={totalDonations * LIVES_PER_DONATION} />
        </View>

        <Card className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-semibold text-brand-text">Show me in nearby donor searches</Text>
            <Text className="text-brand-textsecondary text-sm mt-0.5">
              Turn off if you're temporarily unable to donate
            </Text>
          </View>
          <Switch
            value={donorProfile.isVisible}
            onValueChange={handleToggleVisibility}
            trackColor={{ false: "#E2E8F0", true: "#DC2626" }}
          />
        </Card>

        <Card className="mb-4 px-4">
          <PermissionRow
            icon={Bell}
            label="Notifications"
            description="Get alerted the moment a nearby request matches your blood type"
            status={notifStatus}
            onPress={handleNotificationsPress}
            actionLabel="Enable"
            loading={notifLoading}
          />
          <PermissionRow
            icon={MapPin}
            label="Location"
            description="Keeps your distance-to-request accurate — update this if you've moved"
            status={locStatus}
            onPress={handleLocationPress}
            actionLabel="Enable"
            grantedActionLabel="Refresh"
            loading={locLoading}
          />
        </Card>

        {!showLogForm ? (
          <Button title="Log a Donation" onPress={() => setShowLogForm(true)} variant="primary" pill />
        ) : (
          <Card className="mb-2">
            <Input
              label="Where did you donate?"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. UNTH Blood Bank"
            />
            <Button title="Save Donation" onPress={handleLogDonation} loading={saving} pill />
          </Card>
        )}

        <View className="mt-6">
          <SectionHeader
            title="Donation History"
            actionLabel={
              donations.length > HISTORY_PREVIEW_COUNT ? (showAllHistory ? "Show Less" : "View All") : undefined
            }
            onAction={() => setShowAllHistory((v) => !v)}
          />
          {donations.length === 0 ? (
            <Text className="text-brand-textsecondary">You haven't logged a donation yet.</Text>
          ) : (
            <Card>
              {visibleDonations.map((d) => (
                <DonationHistoryItem key={d.id} donation={d} />
              ))}
            </Card>
          )}
        </View>

        <View className="mt-8">
          <Button title="Log Out" onPress={() => logout()} variant="danger" pill />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
