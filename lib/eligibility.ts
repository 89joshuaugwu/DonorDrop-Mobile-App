export interface EligibilityResult {
  eligible: boolean;
  daysRemaining: number;
  nextEligibleDate: Date | null;
  progressPercent: number; // 0-100, how far through the 90-day window
}

const ELIGIBILITY_WINDOW_DAYS = 90;

/**
 * Given a donor's lastDonationDate (ISO string or null if they've never
 * donated), returns whether they're currently eligible to donate again,
 * and if not, how many days remain and how far through the 90-day
 * cooldown they are (for the EligibilityCard's progress bar).
 */
export function getEligibility(lastDonationDate: string | null): EligibilityResult {
  if (!lastDonationDate) {
    return { eligible: true, daysRemaining: 0, nextEligibleDate: null, progressPercent: 100 };
  }

  const lastDonation = new Date(lastDonationDate);
  const nextEligibleDate = new Date(lastDonation);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + ELIGIBILITY_WINDOW_DAYS);

  const now = new Date();
  const msRemaining = nextEligibleDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  const eligible = daysRemaining <= 0;

  const daysElapsed = ELIGIBILITY_WINDOW_DAYS - daysRemaining;
  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / ELIGIBILITY_WINDOW_DAYS) * 100));

  return { eligible, daysRemaining, nextEligibleDate, progressPercent };
}
