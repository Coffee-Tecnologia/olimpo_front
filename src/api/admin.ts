import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import cookies from 'js-cookie';

export const ADMIN_TOKEN_KEY = 'olimpo_admin_token';

const BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin`;

const adminApi = applyCaseMiddleware(
  axios.create({ baseURL: BASE, timeout: 10_000 })
);

adminApi.interceptors.request.use((config) => {
  const token = cookies.get(ADMIN_TOKEN_KEY);
  if (config.headers && token) config.headers.Authorization = token;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export const adminLogin = (email: string, password: string) =>
  adminApi.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardTotals {
  total: number;
  active: number;
  trial: number;
  inactive: number;
  cancelled: number;
}

export interface DashboardByPlan {
  plan: string;
  system: string;
  count: number;
}

export interface DashboardAccount {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
  system: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface DashboardResponse {
  totals: DashboardTotals;
  byPlan: DashboardByPlan[];
  bySystem: { system: string; count: number }[];
  expiringSoon: DashboardAccount[];
  recentAccounts: DashboardAccount[];
}

export const getAdminDashboard = () =>
  adminApi.get<DashboardResponse>('/dashboard').then((r) => r.data);

// ── Accounts ──────────────────────────────────────────────────────────────────

export interface AdminPlan {
  id: string;
  name: string;
  system: string;
  maxCnpjs: number;
  maxUsers: number;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  status: 'trial' | 'active' | 'inactive' | 'cancelled';
  billingCycle: string;
  plan: AdminPlan;
  userCount: number;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface AdminAccountDetail extends AdminAccount {
  featureOverrides: { id: string; featureName: string; value: string }[];
}

export interface AccountsMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface AccountsResponse {
  accounts: AdminAccount[];
  meta: AccountsMeta;
}

export interface AccountFilters {
  system?: string;
  status?: string;
  q?: string;
  page?: number;
}

export const getAdminAccounts = (filters: AccountFilters = {}) =>
  adminApi.get<AccountsResponse>('/accounts', { params: filters }).then((r) => r.data);

export const getAdminAccount = (id: string) =>
  adminApi.get<AdminAccountDetail>(`/accounts/${id}`).then((r) => r.data);

export const activateAccount = (id: string) =>
  adminApi.patch<AdminAccount>(`/accounts/${id}/activate`).then((r) => r.data);

export const deactivateAccount = (id: string) =>
  adminApi.patch<AdminAccount>(`/accounts/${id}/deactivate`).then((r) => r.data);

// ── Feature Overrides ─────────────────────────────────────────────────────────

export interface FeatureOverride {
  id: string;
  featureName: string;
  value: string;
}

export const upsertFeatureOverride = (accountId: string, featureName: string, value: string) =>
  adminApi.post<FeatureOverride>(`/accounts/${accountId}/feature_overrides`, { featureName, value }).then((r) => r.data);

export const deleteFeatureOverride = (accountId: string, overrideId: string) =>
  adminApi.delete(`/accounts/${accountId}/feature_overrides/${overrideId}`);

// ── Plans ─────────────────────────────────────────────────────────────────────

export interface AdminPlanFeature {
  name: string;
  value: string;
}

export interface AdminPlanFull {
  id: string;
  name: string;
  system: string;
  maxCnpjs: number;
  maxUsers: number;
  monthlyPriceCents: number;
  annualPriceCents: number | null;
  active: boolean;
  planFeatures: AdminPlanFeature[];
}

export type AdminPlansBySystem = Record<string, AdminPlanFull[]>;

export interface PlanPayload {
  name: string;
  system: string;
  maxCnpjs: number;
  maxUsers: number;
  monthlyPriceCents: number;
  annualPriceCents?: number | null;
  active?: boolean;
  features?: Record<string, string>;
}

export const getAdminPlans = (system?: string) =>
  adminApi.get<AdminPlansBySystem>('/plans', { params: system ? { system } : {} }).then((r) => r.data);

export const createAdminPlan = (payload: PlanPayload) =>
  adminApi.post<AdminPlanFull>('/plans', { plan: payload, features: payload.features }).then((r) => r.data);

export const updateAdminPlan = (id: string, payload: Partial<PlanPayload>) =>
  adminApi.put<AdminPlanFull>(`/plans/${id}`, { plan: payload, features: payload.features }).then((r) => r.data);

export const togglePlanActive = (id: string, active: boolean) =>
  active
    ? adminApi.patch<AdminPlanFull>(`/plans/${id}/activate`).then((r) => r.data)
    : adminApi.patch<AdminPlanFull>(`/plans/${id}/deactivate`).then((r) => r.data);

// ── Systems ───────────────────────────────────────────────────────────────────

export interface AdminSystem {
  id: string;
  slug: string;
  name: string;
  active: boolean;
}

export const getAdminSystems = () =>
  adminApi.get<AdminSystem[]>('/systems').then((r) => r.data);

// ── Service Clients ───────────────────────────────────────────────────────────

export interface ServiceClient {
  id: string;
  name: string;
  system: string;
  active: boolean;
  validateCount: number;
  lastValidatedAt: string | null;
  createdAt: string;
}

export interface ServiceClientCreated extends ServiceClient {
  apiKey: string;
}

export const getServiceClients = (system?: string) =>
  adminApi.get<ServiceClient[]>('/service_clients', { params: system ? { system } : {} }).then((r) => r.data);

export const createServiceClient = (name: string, system: string) =>
  adminApi.post<ServiceClientCreated>('/service_clients', { name, system }).then((r) => r.data);

export const revokeServiceClient = (id: string) =>
  adminApi.patch<ServiceClient>(`/service_clients/${id}/revoke`).then((r) => r.data);
