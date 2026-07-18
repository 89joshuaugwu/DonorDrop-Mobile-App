import { View, Text } from "react-native";
import { getEligibility } from "@/lib/eligibility";
import Card from "./Card";

export default function EligibilityCard({ lastDonationDate }: { lastDonationDate: string | null }) {
  const { eligible, daysRemaining, progressPercent } = getEligibility(lastDonationDate);

  return (
    <Card className={eligible ? "border-green-200 bg-green-50" : ""}>
      <Text className="text-sm text-brand-textsecondary mb-1">Donation Eligibility</Text>
      {eligible ? (
        <Text className="text-xl font-extrabold text-brand-success">Eligible now ✅</Text>
      ) : (
        <>
          <Text className="text-xl font-extrabold text-brand-text">
            Eligible in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
          </Text>
          <View className="h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
            <View
              className="h-2 bg-brand-slate rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </>
      )}
    </Card>
  );
}
