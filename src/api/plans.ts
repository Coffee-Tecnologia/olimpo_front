import { ApiService } from './config/axios';

export interface PlanFeature {
  name: string;
  value: string;
}

export type PlanType = 'subscription' | 'credit_pack' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  planType: PlanType;
  maxCnpjs: number | null;
  maxUsers: number | null;
  maxNotes: number | null;
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

export interface CurrentAccount {
  plan: CurrentAccountPlan;
  status: string;
  cancelAtPeriodEnd: boolean;
  accessEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface SubscriptionResponse {
  checkoutUrl: string;
}

export interface CancelResponse {
  accessEndsAt: string;
}

export type BillingCycle = 'monthly' | 'annual';

const plansApi = ApiService('/plans');
const checkoutApi = ApiService('/checkout');
const accountApi = ApiService('/account');
const subscriptionApi = ApiService('/subscriptions');

export const getPlans = (system: string) => plansApi.get<Plan[]>('', { params: { system } });

export const getCurrentAccount = (token: string) =>
  accountApi.get<CurrentAccount>('', { params: { token } });

export const createCheckout = (token: string, planId: string, billingCycle: BillingCycle) =>
  checkoutApi.post<SubscriptionResponse>('', { token, planId, billingCycle });

export const cancelSubscription = (token: string, reason?: string) =>
  subscriptionApi.post<CancelResponse>('/cancel', { token, reason: reason ?? null });

export const resumeSubscription = (token: string) =>
  subscriptionApi.post<{ resumed: boolean }>('/resume', { token });
