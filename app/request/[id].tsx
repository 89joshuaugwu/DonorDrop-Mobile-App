import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, User, Clock, MapPin } from "lucide-react-native";
import { distanceBetween } from "geofire-common";
import UrgencyBadge from "@/components/ui/UrgencyBadge";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DonorResponseRow from "@/components/molecules/DonorResponseRow";
import RequestMap from "@/components/molecules/RequestMap";
import { useAuth } from "@/lib/AuthContext";
import {
  getRequest,
  getRequestResponses,
  getMyResponse,
  respondToRequest,
  markRequestFulfilled,
} from "@/lib/requests";
import type { BloodRequest, RequestResponse } from "@/types/request";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Posted just now";
  if (hours < 24) return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
}

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

  const availableCount = responses.filter((r) => r.available).length;

  const distanceKm =
    donorProfile && (request.lat !== 0 || request.lng !== 0) && (donorProfile.lat !== 0 || donorProfile.lng !== 0)
      ? distanceBetween([request.lat, request.lng], [donorProfile.lat, donorProfile.lng])
      : null;

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card elevated className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <UrgencyBadge urgency={request.urgency} />
            <Text className="text-brand-textsecondary text-xs">{timeAgo(request.createdAt)}</Text>
          </View>

          <View className="flex-row items-center">
            <BloodTypeBadge bloodType={request.bloodTypeNeeded} size="lg" />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-extrabold text-brand-text">{request.hospitalName}</Text>
              <Text className="text-brand-textsecondary">
                {request.units} unit{request.units === 1 ? "" : "s"} needed
              </Text>
              <Text className="text-brand-textsecondary text-xs mt-1 capitalize">
                Status: <Text className="font-bold text-brand-text">{request.status}</Text>
              </Text>
            </View>
          </View>
        </Card>

        <RequestMap
          hospitalName={request.hospitalName}
          requestLat={request.lat}
          requestLng={request.lng}
          viewerLat={donorProfile?.lat}
          viewerLng={donorProfile?.lng}
        />
        {distanceKm !== null && (
          <View className="flex-row items-center mb-4 -mt-2">
            <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text className="text-brand-textsecondary text-xs font-medium">
              {distanceKm.toFixed(1)} km away from you
            </Text>
          </View>
        )}

        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1 items-center py-4">
            <Building2 size={18} color="#DC2626" style={{ marginBottom: 6 }} />
            <Text className="text-brand-textsecondary text-xs">Hospital</Text>
            <Text className="font-bold text-brand-text text-sm text-center mt-0.5" numberOfLines={1}>
              {request.hospitalName}
            </Text>
          </Card>
          <Card className="flex-1 items-center py-4">
            <User size={18} color="#DC2626" style={{ marginBottom: 6 }} />
            <Text className="text-brand-textsecondary text-xs">Requester</Text>
            <Text className="font-bold text-brand-text text-sm text-center mt-0.5" numberOfLines={1}>
              {request.requesterName}
            </Text>
          </Card>
        </View>

        {!!request.notes && (
          <Card className="mb-4">
            <Text className="text-xs font-semibold text-brand-textsecondary mb-1.5">Additional Notes</Text>
            <Text className="text-brand-text text-sm leading-5">{request.notes}</Text>
          </Card>
        )}

        {canRespondAsDonor && request.status === "open" && (
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Button
                title={myResponse?.available ? "You're Available ✓" : "I'm Available"}
                onPress={() => handleRespond(true)}
                loading={busy}
                variant={myResponse?.available ? "secondary" : "primary"}
                pill
              />
            </View>
            <View className="flex-1">
              <Button
                title="Can't Help"
                onPress={() => handleRespond(false)}
                loading={busy}
                variant="outline"
                pill
              />
            </View>
          </View>
        )}

        {isOwnerRequester && (
          <>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-bold text-brand-text">Responses ({responses.length})</Text>
              {availableCount > 0 && (
                <Text className="text-brand-success text-xs font-bold">{availableCount} available</Text>
              )}
            </View>
            {responses.length === 0 ? (
              <Card className="mb-6 items-center py-8">
                <Clock size={22} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text className="text-brand-textsecondary">No donors have responded yet.</Text>
              </Card>
            ) : (
              <Card className="px-4 mb-6">
                {responses.map((r) => (
                  <DonorResponseRow key={r.donorUid} response={r} />
                ))}
              </Card>
            )}
            {request.status === "open" && (
              <Button title="Mark as Fulfilled" onPress={handleMarkFulfilled} variant="secondary" pill />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
