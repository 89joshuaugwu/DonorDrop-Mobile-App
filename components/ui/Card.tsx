import { View, ViewProps } from "react-native";

export default function Card({ children, className = "", ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 border border-brand-border ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
