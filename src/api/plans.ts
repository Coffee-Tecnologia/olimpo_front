import { ApiService } from './config/axios';

export interface PlanFeature {
  name: string;
  value: string;
}

export type PlanType = 'subscription' | 'credit_pack';

export interface Plan {
  id: string;
  name: string;
  planType: PlanType;
  maxCnpjs: number | null;
  maxUsers: number | null;
  creditsAmount: number | null;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  active: boolean;
  planFeatures: PlanFeature[];
}

export interface CurrentAccountPlan {
  id: string;
  name: string;
  monthlyPriceCents: number;
}

export interface SubscriptionResponse {
  checkoutUrl: string;
}

export type BillingCycle = 'monthly' | 'annual';

const plansApi = ApiService('/plans');
const checkoutApi = ApiService('/checkout');
const accountApi = ApiService('/account');

export const getPlans = (system: string) => plansApi.get<Plan[]>('', { params: { system } });

export const getCurrentAccount = (token: string) =>
  accountApi.get<{ plan: CurrentAccountPlan }>('', { params: { token } });

export const createCheckout = (token: string, planId: string, billingCycle: BillingCycle) =>
  checkoutApi.post<SubscriptionResponse>('', { token, planId, billingCycle });
