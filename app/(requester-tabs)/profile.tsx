import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Info, Bell } from "lucide-react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { registerForPushNotifications, getNotificationPermissionStatus } from "@/lib/push";
import { logout } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import RoleTag from "@/components/ui/RoleTag";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PermissionRow, { type PermissionStatus } from "@/components/molecules/PermissionRow";

export default function RequesterProfileScreen() {
  const { user, requesterProfile, refreshProfiles } = useAuth();
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>("checking");
  const [notifLoading, setNotifLoading] = useState(false);

  // Same self-healing push-token pattern as the donor profile screen —
  // see the comment there for why this depends only on `user` and reads
  // the current token through a ref rather than depending on
  // requesterProfile directly (avoids re-triggering itself in a loop
  // every time it calls refreshProfiles()).
  const requesterProfileRef = useRef(requesterProfile);
  useEffect(() => {
    requesterProfileRef.current = requesterProfile;
  }, [requesterProfile]);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications(user.uid).then(async (token) => {
      if (token && token !== requesterProfileRef.current?.pushToken) {
        await setDoc(doc(db, "requesters", user.uid), { pushToken: token }, { merge: true });
        await refreshProfiles();
      }
    });
  }, [user]);

  // Read-only status check for the PermissionRow button — mirrors the
  // donor profile screen's identical check.
  useEffect(() => {
    getNotificationPermissionStatus().then(setNotifStatus);
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
        await setDoc(doc(db, "requesters", user.uid), { pushToken: token }, { merge: true });
        await refreshProfiles();
      }
      setNotifStatus(await getNotificationPermissionStatus());
    } finally {
      setNotifLoading(false);
    }
  }

  if (!requesterProfile) return null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <View className="items-center mb-6">
          <Avatar name={requesterProfile.name} size="lg" />
          <Text className="text-xl font-extrabold text-brand-text mt-3">
            {requesterProfile.name}
          </Text>
          <Text className="text-brand-textsecondary">{requesterProfile.phone}</Text>
          <RoleTag label="Requester" />
        </View>

        <Card className="mb-4">
          <Text className="font-semibold text-brand-text mb-1">Account</Text>
          {!!requesterProfile.organization && (
            <Text className="text-brand-textsecondary text-sm mb-1">
              {requesterProfile.organization}
            </Text>
          )}
          <Text className="text-brand-textsecondary text-sm">
            Manage your requester account for DonorDrop.
          </Text>
        </Card>

        <Card className="mb-4 px-4">
          <PermissionRow
            icon={Bell}
            label="Notifications"
            description="Get alerted the moment a donor responds to your request"
            status={notifStatus}
            onPress={handleNotificationsPress}
            actionLabel="Enable"
            loading={notifLoading}
          />
        </Card>

        <View className="flex-row bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
          <Info size={16} color="#2563EB" style={{ marginRight: 8, marginTop: 1 }} />
          <Text className="text-blue-800 text-xs flex-1 leading-4">
            You can switch roles or act as both at any time — just log in with the other role from
            the welcome screen.
          </Text>
        </View>

        <View className="mt-auto pt-8">
          <Button title="Log Out" onPress={() => logout()} variant="danger" pill />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
