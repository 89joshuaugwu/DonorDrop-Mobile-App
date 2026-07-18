import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import UrgencyBadge from "@/components/ui/UrgencyBadge";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import Button from "@/components/ui/Button";
import DonorResponseRow from "@/components/molecules/DonorResponseRow";
import { useAuth } from "@/lib/AuthContext";
import {
  getRequest,
  getRequestResponses,
  getMyResponse,
  respondToRequest,
  markRequestFulfilled,
} from "@/lib/requests";
import type { BloodRequest, RequestResponse } from "@/types/request";

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, donorProfile, requesterProfile } = useAuth();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [responses, setResponses] = useState<RequestResponse[]>([]);
  const [myResponse, setMyResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await getRequest(id);
      setRequest(r);

      // Only the requester who owns this request can see the full
      // response list (donor phone numbers) — this is also enforced at
      // the Firestore rule level, not just here in the UI.
      if (r && requesterProfile && r.requesterUid === user?.uid) {
        const resp = await getRequestResponses(id);
        setResponses(resp);
      }
      if (donorProfile && user) {
        const mine = await getMyResponse(id, user.uid);
        setMyResponse(mine);
      }
    } finally {
      setLoading(false);
    }
  }, [id, user, donorProfile, requesterProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isOwnerRequester = !!(request && user && request.requesterUid === user.uid);
  const canRespondAsDonor = !!(donorProfile && request && !isOwnerRequester);

  async function handleRespond(available: boolean) {
    if (!user || !donorProfile || !request) return;
    setBusy(true);
    try {
      await respondToRequest(
        request.id,
        user.uid,
        donorProfile.name,
        donorProfile.phone,
        donorProfile.bloodType,
        available
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkFulfilled() {
    if (!request) return;
    Alert.alert("Mark as Fulfilled?", "This closes the request.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setBusy(true);
          try {
            await markRequestFulfilled(request.id);
            await load();
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (loading || !request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-bg">
        <ActivityIndicator size="large" color="#DC2626" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row items-center mb-4">
          <BloodTypeBadge bloodType={request.bloodTypeNeeded} size="lg" />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-extrabold text-brand-text">{request.hospitalName}</Text>
            <Text className="text-brand-textsecondary">
              {request.units} unit{request.units === 1 ? "" : "s"} needed
            </Text>
            <View className="mt-1 self-start">
              <UrgencyBadge urgency={request.urgency} />
            </View>
          </View>
        </View>

        {!!request.notes && (
          <View className="bg-white border border-brand-border rounded-2xl p-4 mb-4">
            <Text className="text-brand-textsecondary text-sm">{request.notes}</Text>
          </View>
        )}

        <Text className="text-brand-textsecondary text-sm mb-4">
          Status: <Text className="font-bold text-brand-text capitalize">{request.status}</Text>
        </Text>

        {canRespondAsDonor && request.status === "open" && (
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Button
                title={myResponse?.available ? "You're Available ✓" : "I'm Available"}
                onPress={() => handleRespond(true)}
                loading={busy}
                variant={myResponse?.available ? "secondary" : "primary"}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Can't Help"
                onPress={() => handleRespond(false)}
                loading={busy}
                variant="outline"
              />
            </View>
          </View>
        )}

        {isOwnerRequester && (
          <>
            <Text className="font-bold text-brand-text mb-2">
              Responses ({responses.length})
            </Text>
            {responses.length === 0 ? (
              <Text className="text-brand-textsecondary mb-6">No donors have responded yet.</Text>
            ) : (
              <View className="bg-white border border-brand-border rounded-2xl px-4 mb-6">
                {responses.map((r) => (
                  <DonorResponseRow key={r.donorUid} response={r} />
                ))}
              </View>
            )}
            {request.status === "open" && (
              <Button title="Mark as Fulfilled" onPress={handleMarkFulfilled} variant="secondary" />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
