import { View, Text } from "react-native";
import BloodTypeBadge from "@/components/ui/BloodTypeBadge";
import type { RequestResponse } from "@/types/request";

export default function DonorResponseRow({ response }: { response: RequestResponse }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-brand-border">
      <View className="flex-row items-center">
        <BloodTypeBadge bloodType={response.bloodType} size="sm" />
        <View className="ml-3">
          <Text className="font-semibold text-brand-text">
            {response.available ? response.donorName : "Anonymous Donor"}
          </Text>
          <Text className="text-brand-textsecondary text-sm">
            {response.available ? response.donorPhone : "Hasn't confirmed yet"}
          </Text>
        </View>
      </View>
      <Text
        className={`text-xs font-bold ${
          response.available ? "text-brand-success" : "text-brand-textsecondary"
        }`}
      >
        {response.available ? "AVAILABLE" : "UNAVAILABLE"}
      </Text>
    </View>
  );
}
