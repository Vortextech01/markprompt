import { Team } from '@/types/types';

type Price = {
  amount: number;
  priceIds: {
    test: string;
    production: string;
  };
};

export type Tier = 'hobby' | 'pro' | 'enterprise';

export type PricedModel = 'gpt-4' | 'gpt-3.5-turbo' | 'byo';

export const modelLabels: Record<PricedModel, string> = {
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'Chat',
  byo: 'BYO',
};

const env =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 'production' : 'test';

export type TierPriceDetails = {
  name: string;
  quota: number;
  numWebsitePagesPerProject: number;
  price?: {
    monthly?: Price;
    yearly: Price;
  };
};

export type TierDetails = {
  name: string;
  enterprise?: boolean;
  description: string;
  items: string[];
  notes?: string[];
  prices: TierPriceDetails[];
};

export const getTierPriceDetailsFromPriceId = (
  priceId: string,
): TierPriceDetails | undefined => {
  for (const tier of Object.values(TIERS)) {
    for (const price of tier.prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return price;
      }
    }
  }
  return undefined;
};

export const getTierDetailsFromPriceId = (
  priceId: string,
): TierDetails | undefined => {
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return tierDetail;
      }
    }
  }
  return undefined;
};

export const isYearlyPrice = (priceId: string) => {
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      if (price?.price?.yearly?.priceIds[env] === priceId) {
        return true;
      }
    }
  }
  return false;
};

export const getTierFromPriceId = (priceId: string): Tier | undefined => {
  for (const tier of Object.keys(TIERS) as Tier[]) {
    for (const price of TIERS[tier].prices) {
      if (
        price?.price?.monthly?.priceIds[env] === priceId ||
        price?.price?.yearly?.priceIds[env] === priceId
      ) {
        return tier;
      }
    }
  }
  return undefined;
};

export const comparePlans = (
  priceId: string,
  otherPriceId: string,
): -1 | 0 | 1 => {
  if (priceId === otherPriceId) {
    return 0;
  }
  // We assume that the TIERS list is ordered from lower to higher.
  for (const tierDetail of Object.values(TIERS)) {
    for (const price of tierDetail.prices) {
      const monthlyPriceId = price?.price?.monthly?.priceIds[env];
      const yearlyPriceId = price?.price?.yearly?.priceIds[env];
      if (
        (monthlyPriceId === priceId && yearlyPriceId === otherPriceId) ||
        (monthlyPriceId === otherPriceId && yearlyPriceId === priceId)
      ) {
        // Consider equal if one is yearly and other is monthly of
        // the same plan.
        return 0;
      }
      if (monthlyPriceId === priceId || yearlyPriceId === priceId) {
        // priceId came first in list, so it's lower
        return -1;
      }
      if (monthlyPriceId === otherPriceId || yearlyPriceId === otherPriceId) {
        // otherPriceId came first in list, so it's lower
        return 1;
      }
    }
  }
  return 1;
};

export const TIERS: Record<Tier, TierDetails> = {
  hobby: {
    name: 'Hobby',
    description: 'For personal and non-commercial projects',
    items: [
      'Unlimited documents',
      'Unlimited BYO* completions',
      '25 GPT-4 completions',
      '100 website pages per project',
      'Public/private GitHub repos',
    ],
    notes: ['* BYO: Bring-your-own API key'],
    prices: [
      {
        name: 'Free',
        quota: 25,
        numWebsitePagesPerProject: 100,
        // numWebsitePagesPerProject: 3,
      },
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For production',
    items: [
      'Everything in Hobby, plus:',
      'Prompt templates',
      'Model customization',
      '1000 GPT-4 completions',
      '1000 website pages per project',
      'Analytics (soon)',
    ],
    prices: [
      {
        name: 'Pro',
        quota: 1000,
        numWebsitePagesPerProject: 1000,
        price: {
          monthly: {
            amount: 120,
            priceIds: {
              test: 'price_1N0TzLCv3sM26vDeQ7VxLKWP',
              production: 'price_1N0U0ICv3sM26vDes1KHwQ4y',
            },
          },
          yearly: {
            amount: 100,
            priceIds: {
              test: 'price_1N0TzLCv3sM26vDeIwhDValY',
              production: 'price_1N0U0ICv3sM26vDebBlSdU2k',
            },
          },
        },
      },
    ],
  },
  enterprise: {
    name: 'Enterprise',
    enterprise: true,
    description: 'For projects at scale',
    items: [
      'Everything in Pro, plus:',
      'Teams',
      'Integrations',
      'Unbranded prompts',
      'Unlimited completions',
      'Dedicated support',
      'White glove onboarding',
      'Insights (soon)',
    ],
    prices: [
      {
        name: 'Enterprise',
        quota: -1,
        numWebsitePagesPerProject: -1,
      },
    ],
  },
};

const maxAllowanceForEnterprise = 1_000_000;
const quotaForLegacyPriceId = TIERS.pro.prices[0].quota;
const legacyNumWebsitePagesPerProject =
  TIERS.pro.prices[0].numWebsitePagesPerProject;

export const getMonthlyQueryAllowance = (team: Team) => {
  if (team.is_enterprise_plan) {
    return maxAllowanceForEnterprise;
  } else if (team.stripe_price_id) {
    const priceDetails = getTierPriceDetailsFromPriceId(team.stripe_price_id);
    if (priceDetails) {
      return priceDetails.quota;
    }
    return quotaForLegacyPriceId;
  } else {
    return TIERS.hobby.prices[0].quota;
  }
};

export const getNumWebsitePagesPerProjectAllowance = (team: Team) => {
  if (team.is_enterprise_plan) {
    return -1;
  } else if (team.stripe_price_id) {
    const priceDetails = getTierPriceDetailsFromPriceId(team.stripe_price_id);
    if (priceDetails) {
      return priceDetails.numWebsitePagesPerProject;
    }
    return legacyNumWebsitePagesPerProject;
  } else {
    return TIERS.hobby.prices[0].numWebsitePagesPerProject;
  }
};
