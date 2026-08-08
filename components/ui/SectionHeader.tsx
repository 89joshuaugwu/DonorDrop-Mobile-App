import { View, Text, Pressable } from "react-native";

/** Section title with an optional right-aligned action ("See History", "View All"). */
export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-end justify-between mb-3">
      <View className="flex-1 pr-3">
        <Text className="text-base font-bold text-brand-text">{title}</Text>
        {!!subtitle && <Text className="text-brand-textsecondary text-xs mt-0.5">{subtitle}</Text>}
      </View>
      {!!actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-brand-red text-sm font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
