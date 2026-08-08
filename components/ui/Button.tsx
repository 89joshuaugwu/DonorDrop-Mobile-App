import { Pressable, Text, ActivityIndicator, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "md" | "lg";

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon: Icon,
  pill = false,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  pill?: boolean;
}) {
  const styles: Record<Variant, { bg: string; text: string; iconColor: string }> = {
    primary: { bg: "bg-brand-red active:bg-brand-reddark", text: "text-white", iconColor: "#FFFFFF" },
    secondary: { bg: "bg-slate-100 active:bg-slate-200", text: "text-brand-text", iconColor: "#0F172A" },
    outline: { bg: "bg-white border border-brand-border active:bg-slate-50", text: "text-brand-text", iconColor: "#0F172A" },
    danger: { bg: "bg-red-50 border border-red-200 active:bg-red-100", text: "text-red-700", iconColor: "#B91C1C" },
    ghost: { bg: "active:bg-slate-100", text: "text-brand-red", iconColor: "#DC2626" },
  };
  const style = styles[variant];
  const paddingY = size === "lg" ? "py-3.5" : "py-2.5";
  const radius = pill ? "rounded-full" : "rounded-xl";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${style.bg} ${radius} ${paddingY} items-center justify-center flex-row ${
        disabled || loading ? "opacity-60" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#DC2626"} />
      ) : (
        <View className="flex-row items-center">
          {Icon && <Icon size={18} color={style.iconColor} style={{ marginRight: 8 }} />}
          <Text className={`${style.text} font-bold text-base`}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}
