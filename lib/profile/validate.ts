import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from '@/lib/constants';

const GOAL_VALUES = new Set(INVESTMENT_GOALS.map((o) => o.value));
const RISK_VALUES = new Set(RISK_TOLERANCE_OPTIONS.map((o) => o.value));
const INDUSTRY_VALUES = new Set(PREFERRED_INDUSTRIES.map((o) => o.value));

export function validateProfilePersonalization(fields: {
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
}): string | null {
  if (fields.country !== undefined) {
    const country = fields.country.trim();
    if (!country) return 'Country is required';
  }
  if (
    fields.investmentGoals !== undefined &&
    !GOAL_VALUES.has(fields.investmentGoals)
  ) {
    return 'Invalid investment goal';
  }
  if (
    fields.riskTolerance !== undefined &&
    !RISK_VALUES.has(fields.riskTolerance)
  ) {
    return 'Invalid risk tolerance';
  }
  if (
    fields.preferredIndustry !== undefined &&
    !INDUSTRY_VALUES.has(fields.preferredIndustry)
  ) {
    return 'Invalid preferred industry';
  }
  return null;
}
