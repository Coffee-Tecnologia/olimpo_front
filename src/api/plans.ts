import { ApiService } from './config/axios';

export interface PlanFeature {
  name: string;
  value: string;
}

export interface Plan {
  id: string;
  name: 'Degust' | 'Starter' | 'Pro' | 'Enterprise';
  maxCnpjs: number;
  maxUsers: number;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  active: boolean;
  planFeatures: PlanFeature[];
}

export interface SubscriptionResponse {
  checkoutUrl: string;
}

export type BillingCycle = 'monthly' | 'annual';

const plansApi = ApiService('/plans');
const checkoutApi = ApiService('/checkout');

export const getPlans = (system: string) => plansApi.get<Plan[]>('', { params: { system } });

export const createCheckout = (token: string, planId: string, billingCycle: BillingCycle) =>
  checkoutApi.post<SubscriptionResponse>('', { token, planId, billingCycle });
