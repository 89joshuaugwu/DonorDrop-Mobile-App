import { View, ViewProps } from "react-native";

/**
 * Base card surface. `elevated` adds a soft shadow (iOS shadow props +
 * Android elevation) for hero/header cards; list-row cards stay flat
 * with just a border to keep dense lists calm.
 */
export default function Card({
  children,
  className = "",
  elevated = false,
  style,
  ...props
}: ViewProps & { className?: string; elevated?: boolean }) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 border border-brand-border ${className}`}
      style={[
        elevated
          ? {
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }
          : null,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
