import { Pressable, Text, ActivityIndicator } from "react-native";

type Variant = "primary" | "secondary" | "outline" | "danger";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const styles: Record<Variant, { bg: string; text: string }> = {
    primary: { bg: "bg-brand-red active:bg-brand-reddark", text: "text-white" },
    secondary: { bg: "bg-slate-100 active:bg-slate-200", text: "text-brand-text" },
    outline: { bg: "bg-white border border-brand-border active:bg-slate-50", text: "text-brand-text" },
    danger: { bg: "bg-red-50 border border-red-200 active:bg-red-100", text: "text-red-700" },
  };
  const style = styles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${style.bg} rounded-xl py-3.5 items-center justify-center ${
        disabled || loading ? "opacity-60" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#DC2626"} />
      ) : (
        <Text className={`${style.text} font-bold text-base`}>{title}</Text>
      )}
    </Pressable>
  );
}
