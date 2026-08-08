import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, ChevronRight } from "lucide-react-native";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import UrgencyBadge from "@/components/ui/UrgencyBadge";
import type { BloodRequest } from "@/types/request";

export default function RequestCard({
  request,
  distanceKm,
  matchCount,
}: {
  request: BloodRequest;
  distanceKm?: number;
  matchCount?: number;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/request/${request.id}`)}
      className="bg-white border border-brand-border rounded-2xl p-4 mb-3 active:bg-slate-50"
    >
      <View className="flex-row items-center">
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
          </Text>
        </View>
      </View>

      {(typeof distanceKm === "number" || typeof matchCount === "number") && (
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-brand-border">
          <View className="flex-row items-center">
            {typeof distanceKm === "number" && (
              <View className="flex-row items-center mr-4">
                <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text className="text-brand-textsecondary text-xs font-medium">
                  {distanceKm.toFixed(1)} km away
                </Text>
              </View>
            )}
            {typeof matchCount === "number" && (
              <Text className="text-brand-textsecondary text-xs font-medium">
                {matchCount} response{matchCount === 1 ? "" : "s"}
              </Text>
            )}
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
      )}
    </Pressable>
  );
}
