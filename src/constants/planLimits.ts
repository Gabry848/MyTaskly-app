export type BillingPeriod = 'monthly' | 'annual';

export interface PlanProductIds {
  monthly: string;
  annual: string;
}

export interface PlanLimits {
  chatTextDaily: number;
  chatTextMonthly: number;
  chatVoiceDaily: number;
  chatVoiceMonthly: number;
  aiModel: 'base' | 'advanced';
  maxCategories: number;
}

export interface Plan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  limits: PlanLimits;
  productIds?: PlanProductIds;
  /** Get the product ID for a specific billing period */
  getProductId: (period: BillingPeriod) => string | undefined;
}

export const PLAN_PRODUCT_IDS: Record<'free' | 'pro' | 'premium', PlanProductIds | undefined> = {
  free: undefined,
  pro: {
    monthly: 'mytaskly_pro_monthly:pro-monthly',
    annual: 'mytaskly_pro_monthly:pro-annual',
  },
  premium: {
    monthly: 'premium:monthly',
    annual: 'premium:annual',
  },
};

export const PLANS: Record<'free' | 'pro' | 'premium', Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    limits: {
      chatTextDaily: 20,
      chatTextMonthly: 130,
      chatVoiceDaily: Infinity,
      chatVoiceMonthly: 20,
      aiModel: 'base',
      maxCategories: 5,
    },
    getProductId: () => undefined,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    productIds: PLAN_PRODUCT_IDS.pro,
    limits: {
      chatTextDaily: 50,
      chatTextMonthly: 250,
      chatVoiceDaily: Infinity,
      chatVoiceMonthly: 50,
      aiModel: 'advanced',
      maxCategories: Infinity,
    },
    getProductId: (period: BillingPeriod) => PLAN_PRODUCT_IDS.pro?.[period],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    productIds: PLAN_PRODUCT_IDS.premium,
    limits: {
      chatTextDaily: Infinity,
      chatTextMonthly: 400,
      chatVoiceDaily: Infinity,
      chatVoiceMonthly: 150,
      aiModel: 'advanced',
      maxCategories: Infinity,
    },
    getProductId: (period: BillingPeriod) => PLAN_PRODUCT_IDS.premium?.[period],
  },
};
