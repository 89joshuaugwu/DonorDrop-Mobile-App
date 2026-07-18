import { View, Text } from "react-native";
import type { RequestUrgency } from "@/types/request";

const STYLES: Record<RequestUrgency, { bg: string; text: string }> = {
  Critical: { bg: "bg-red-100", text: "text-red-700" },
  Urgent: { bg: "bg-orange-100", text: "text-orange-700" },
  Normal: { bg: "bg-blue-100", text: "text-blue-700" },
};

export default function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const style = STYLES[urgency];
  return (
    <View className={`${style.bg} px-3 py-1 rounded-full`}>
      <Text className={`${style.text} text-xs font-bold`}>{urgency.toUpperCase()}</Text>
    </View>
  );
}
