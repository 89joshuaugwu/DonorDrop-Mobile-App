import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { BadgeCheck } from "lucide-react-native";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { logDonation } from "@/lib/donations";
import { registerForPushNotifications } from "@/lib/push";
import { logout } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import StatCard from "@/components/ui/StatCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import DonationHistoryItem from "@/components/molecules/DonationHistoryItem";
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

  // Register push token on mount if not already registered — per
  // CONTEXT.md Section 7's registerForPushNotifications().
  useEffect(() => {
    if (user && donorProfile && !donorProfile.pushToken) {
      registerForPushNotifications(user.uid).then(() => refreshProfiles());
    }
  }, [user, donorProfile]);

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
