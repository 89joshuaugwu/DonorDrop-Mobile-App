import { View, Text } from "react-native";
import { CircleCheck, CircleDashed } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import type { RequestResponse } from "@/types/request";

export default function DonorResponseRow({ response }: { response: RequestResponse }) {
  return (
    <View className="flex-row items-center justify-between py-3.5 border-b border-brand-border last:border-b-0">
      <View className="flex-row items-center flex-1 pr-3">
        <Avatar name={response.donorName} size="sm" />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-brand-text" numberOfLines={1}>
            {response.available ? response.donorName : "Anonymous Donor"}
          </Text>
          <Text className="text-brand-textsecondary text-sm" numberOfLines={1}>
            {response.available ? response.donorPhone : "Hasn't confirmed yet"}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center">
        {response.available ? (
          <CircleCheck size={14} color="#16A34A" style={{ marginRight: 4 }} />
        ) : (
          <CircleDashed size={14} color="#94A3B8" style={{ marginRight: 4 }} />
        )}
        <Text
          className={`text-xs font-bold ${
            response.available ? "text-brand-success" : "text-brand-textsecondary"
          }`}
        >
          {response.available ? "AVAILABLE" : "UNAVAILABLE"}
        </Text>
      </View>
    </View>
  );
}
