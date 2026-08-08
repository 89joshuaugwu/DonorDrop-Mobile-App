import { View, Text } from "react-native";
import { Info, TriangleAlert, Siren } from "lucide-react-native";
import type { RequestUrgency } from "@/types/request";

const STYLES: Record<RequestUrgency, { bg: string; text: string; icon: string; Icon: typeof Info }> = {
  Normal: { bg: "bg-blue-50", text: "text-blue-700", icon: "#1D4ED8", Icon: Info },
  Urgent: { bg: "bg-orange-50", text: "text-orange-700", icon: "#C2410C", Icon: TriangleAlert },
  Critical: { bg: "bg-red-50", text: "text-red-700", icon: "#B91C1C", Icon: Siren },
};

export default function UrgencyBadge({
  urgency,
  showIcon = true,
}: {
  urgency: RequestUrgency;
  showIcon?: boolean;
}) {
  const style = STYLES[urgency];
  const Icon = style.Icon;
  return (
    <View className={`${style.bg} px-3 py-1 rounded-full flex-row items-center`}>
      {showIcon && <Icon size={11} color={style.icon} style={{ marginRight: 4 }} />}
      <Text className={`${style.text} text-xs font-bold`}>{urgency.toUpperCase()}</Text>
    </View>
  );
}
