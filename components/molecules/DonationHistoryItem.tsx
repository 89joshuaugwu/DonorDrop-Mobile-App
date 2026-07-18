import { View, Text } from "react-native";
import { Droplet } from "lucide-react-native";
import type { Donation } from "@/types/donation";

export default function DonationHistoryItem({ donation }: { donation: Donation }) {
  const date = new Date(donation.loggedAt);

  return (
    <View className="flex-row items-center py-3 border-b border-brand-border">
      <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
        <Droplet size={18} color="#DC2626" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-brand-text">{donation.location}</Text>
        <Text className="text-brand-textsecondary text-sm">
          {date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      </View>
    </View>
  );
}
