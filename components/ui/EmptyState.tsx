import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

/** Reusable empty-state block — icon bubble + title + subtitle. */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: "neutral" | "brand";
}) {
  const bubble = tone === "brand" ? "bg-brand-redtint" : "bg-slate-100";
  const iconColor = tone === "brand" ? "#DC2626" : "#94A3B8";

  return (
    <View className="items-center py-16 px-6">
      <View className={`w-16 h-16 rounded-full ${bubble} items-center justify-center mb-4`}>
        <Icon size={28} color={iconColor} />
      </View>
      <Text className="text-brand-text font-bold text-base text-center">{title}</Text>
      {!!subtitle && (
        <Text className="text-brand-textsecondary text-sm text-center mt-1.5 leading-5">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
