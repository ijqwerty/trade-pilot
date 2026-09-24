export const DEFAULT_PROFILE_PERSONALIZATION = {
  country: 'US',
  investmentGoals: 'Growth',
  riskTolerance: 'Medium',
  preferredIndustry: 'Technology',
} as const;

export const DEFAULT_PROFILE_NOTIFICATIONS = {
  dailyNewsEmail: true,
  alertEmail: true,
  alertInApp: true,
} as const;

export function buildDefaultProfileFields(
  overrides?: Partial<{
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
    dailyNewsEmail: boolean;
    alertEmail: boolean;
    alertInApp: boolean;
  }>
) {
  return {
    ...DEFAULT_PROFILE_PERSONALIZATION,
    ...DEFAULT_PROFILE_NOTIFICATIONS,
    ...overrides,
  };
}
