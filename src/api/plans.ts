import { ApiService } from './config/axios';

export interface PlanFeature {
  name: string;
  value: string;
}

export interface Plan {
  id: string;
  name: string;
  maxCnpjs: number;
  maxUsers: number;
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
