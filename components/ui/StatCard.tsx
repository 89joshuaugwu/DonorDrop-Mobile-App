import { View, Text } from "react-native";

/** Small stat tile — used in stat rows like "Total Gifts / Lives Saved". */
export default function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <View className={`flex-1 bg-white border border-brand-border rounded-2xl p-4 ${className}`}>
      <Text className="text-xs font-semibold text-brand-textsecondary" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-2xl font-extrabold text-brand-red mt-1">{value}</Text>
    </View>
  );
}
