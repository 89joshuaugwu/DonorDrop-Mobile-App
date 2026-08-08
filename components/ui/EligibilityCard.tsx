import { View, Text } from "react-native";
import { CircleCheck, Droplet } from "lucide-react-native";
import { getEligibility } from "@/lib/eligibility";
import Card from "./Card";

export default function EligibilityCard({ lastDonationDate }: { lastDonationDate: string | null }) {
  const { eligible, daysRemaining, progressPercent } = getEligibility(lastDonationDate);

  return (
    <Card elevated className={eligible ? "border-green-200 bg-brand-successtint" : "bg-brand-redtint border-brand-redtint2"}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs font-semibold text-brand-textsecondary uppercase tracking-wide">
          Donation Eligibility
        </Text>
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${
            eligible ? "bg-green-100" : "bg-white"
          }`}
        >
          {eligible ? (
            <CircleCheck size={18} color="#16A34A" />
          ) : (
            <Droplet size={16} color="#DC2626" fill="#DC2626" />
          )}
        </View>
      </View>

      {eligible ? (
        <Text className="text-xl font-extrabold text-brand-success">You're eligible to donate</Text>
      ) : (
        <>
          <View className="flex-row items-baseline justify-between mt-0.5">
            <Text className="text-xl font-extrabold text-brand-text">
              {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
            </Text>
            <Text className="text-xs font-medium text-brand-textsecondary">90-day cooldown</Text>
          </View>
          <View className="h-2 bg-white rounded-full mt-3 overflow-hidden">
            <View className="h-2 bg-brand-red rounded-full" style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className="text-brand-textsecondary text-xs mt-2.5 leading-4">
            You can donate again in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}. This keeps your
            iron levels safe between donations.
          </Text>
        </>
      )}
    </Card>
  );
}
