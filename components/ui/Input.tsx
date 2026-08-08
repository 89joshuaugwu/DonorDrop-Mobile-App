import { TextInput, View, Text, TextInputProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";

export default function Input({
  label,
  icon: Icon,
  error,
  ...props
}: TextInputProps & { label?: string; icon?: LucideIcon; error?: string }) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-brand-text mb-1.5">{label}</Text>}
      <View
        className={`flex-row items-center bg-slate-50 border rounded-2xl px-4 ${
          error ? "border-red-300" : "border-brand-border"
        }`}
      >
        {Icon && <Icon size={18} color="#94A3B8" style={{ marginRight: 8 }} />}
        <TextInput
          placeholderTextColor="#94A3B8"
          className="flex-1 py-3.5 text-base text-brand-text"
          {...props}
        />
      </View>
      {!!error && <Text className="text-red-600 text-xs mt-1">{error}</Text>}
    </View>
  );
}
