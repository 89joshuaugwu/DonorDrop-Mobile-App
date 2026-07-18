import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { logDonation } from "@/lib/donations";
import { registerForPushNotifications } from "@/lib/push";
import { logout } from "@/lib/auth";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import DonationHistoryItem from "@/components/molecules/DonationHistoryItem";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Donation } from "@/types/donation";

export default function DonorProfileScreen() {
  const { user, donorProfile, refreshProfiles } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
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

  if (!donorProfile) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center mb-6">
          <BloodTypeBadge bloodType={donorProfile.bloodType} size="lg" />
          <Text className="text-xl font-extrabold text-brand-text mt-3">{donorProfile.name}</Text>
          <Text className="text-brand-textsecondary">{donorProfile.phone}</Text>
          <Text className="text-brand-textsecondary mt-1">
            {donorProfile.totalDonations} total donation{donorProfile.totalDonations === 1 ? "" : "s"}
          </Text>
        </View>

        <View className="bg-white border border-brand-border rounded-2xl p-4 mb-4 flex-row items-center justify-between">
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
        </View>

        {!showLogForm ? (
          <Button title="Log a Donation" onPress={() => setShowLogForm(true)} variant="primary" />
        ) : (
          <View className="bg-white border border-brand-border rounded-2xl p-4 mb-2">
            <Input
              label="Where did you donate?"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. UNTH Blood Bank"
            />
            <Button title="Save Donation" onPress={handleLogDonation} loading={saving} />
          </View>
        )}

        <Text className="font-bold text-brand-text mt-6 mb-2">Donation History</Text>
        {donations.length === 0 ? (
          <Text className="text-brand-textsecondary">You haven't logged a donation yet.</Text>
        ) : (
          donations.map((d) => <DonationHistoryItem key={d.id} donation={d} />)
        )}

        <View className="mt-8">
          <Button title="Log Out" onPress={() => logout()} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
