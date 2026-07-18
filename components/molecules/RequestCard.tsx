import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import UrgencyBadge from "@/components/ui/UrgencyBadge";
import type { BloodRequest } from "@/types/request";

export default function RequestCard({
  request,
  distanceKm,
}: {
  request: BloodRequest;
  distanceKm?: number;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/request/${request.id}`)}
      className="flex-row items-center bg-white border border-brand-border rounded-2xl p-4 mb-3 active:bg-slate-50"
    >
      <BloodTypeBadge bloodType={request.bloodTypeNeeded} size="md" />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-bold text-brand-text flex-shrink mr-2" numberOfLines={1}>
            {request.hospitalName}
          </Text>
          <View className="flex-shrink-0">
            <UrgencyBadge urgency={request.urgency} />
          </View>
        </View>
        <Text className="text-brand-textsecondary text-sm">
          {request.units} unit{request.units === 1 ? "" : "s"} needed
          {typeof distanceKm === "number" ? ` · ${distanceKm.toFixed(1)}km away` : ""}
        </Text>
      </View>
    </Pressable>
  );
}
