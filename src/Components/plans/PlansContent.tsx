'use client';

import { useEffect, useState } from 'react';

import {
  Plan,
  BillingCycle,
  CurrentAccount,
  getPlans,
  getCurrentAccount,
  createCheckout,
  cancelSubscription,
  resumeSubscription,
} from '@/api/plans';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { BillingToggle } from './BillingToggle';
import { PlanCard } from './PlanCard';
import styles from './plans.module.scss';
import { PlansSkeleton } from './PlansSkeleton';

const PLAN_ORDER = ['Degust', 'Starter', 'Pro', 'Enterprise'] as const;

const sortPlans = (plans: Plan[]) =>
  [...plans].sort(
    (a, b) =>
      PLAN_ORDER.indexOf(a.name as (typeof PLAN_ORDER)[number]) -
      PLAN_ORDER.indexOf(b.name as (typeof PLAN_ORDER)[number]),
  );

const sortCreditPacks = (plans: Plan[]) => [...plans].sort((a, b) => (a.creditsAmount ?? 0) - (b.creditsAmount ?? 0));

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

interface PlansContentProps {
  system: string;
  token: string;
}

export const PlansContent: React.FC<PlansContentProps> = ({ system, token }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentAccount, setCurrentAccount] = useState<CurrentAccount | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<Plan | null>(null);

  // cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // resume
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    const plansPromise = getPlans(system).then((data) => setPlans(data));
    const accountPromise = token
      ? getCurrentAccount(token)
          .then((data) => setCurrentAccount(data))
          .catch(() => null)
      : Promise.resolve();

    Promise.all([plansPromise, accountPromise])
      .catch(() => setFetchError('Não foi possível carregar os planos. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [system, token]);

  const subscriptions = sortPlans(plans.filter((p) => p.planType !== 'credit_pack'));
  const creditPacks = sortCreditPacks(plans.filter((p) => p.planType === 'credit_pack'));

  const currentPlan = currentAccount?.plan ?? null;

  const doSubscribe = async (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    setSubscribeError(null);

    const cycle = plan.planType === 'credit_pack' || plan.name === 'Degust' ? 'monthly' : billingCycle;

    try {
      const { checkoutUrl } = await createCheckout(token, plan.id, cycle);
      window.location.href = checkoutUrl;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Erro ao iniciar a compra. Tente novamente.';
      setSubscribeError(msg);
      setSubscribingPlanId(null);
    }
  };

  const handleSubscribe = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const isDowngrade =
      plan.planType !== 'credit_pack' && currentPlan !== null && plan.monthlyPriceCents < currentPlan.monthlyPriceCents;

    if (isDowngrade) {
      setDowngradeTarget(plan);
    } else {
      doSubscribe(plan);
    }
  };

  const handleConfirmDowngrade = () => {
    if (!downgradeTarget) return;
    const plan = downgradeTarget;
    setDowngradeTarget(null);
    doSubscribe(plan);
  };

  const handleOpenCancel = () => {
    setCancelReason('');
    setCancelError(null);
    setCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelSubscription(token, cancelReason.trim() || undefined);
      setCancelOpen(false);
      setCurrentAccount((prev) =>
        prev
          ? {
              ...prev,
              cancelAtPeriodEnd: true,
              accessEndsAt: result.accessEndsAt,
            }
          : prev,
      );
    } catch {
      setCancelError('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    setResumeError(null);
    try {
      await resumeSubscription(token);
      setCurrentAccount((prev) =>
        prev
          ? {
              ...prev,
              cancelAtPeriodEnd: false,
              accessEndsAt: null,
            }
          : prev,
      );
    } catch {
      setResumeError('Erro ao reativar assinatura. Tente novamente.');
    } finally {
      setResuming(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Escolha seu plano</h1>
        <p className={styles.subtitle}>Gerencie suas empresas com segurança e escale quando precisar.</p>
      </div>

      {/* ── Painel Gerenciar assinatura ──────────────────────────────────────── */}
      {currentPlan && (
        <>
          <div className={styles.subscriptionCard}>
            <div className={styles.subscriptionInfo}>
              <span className={styles.subscriptionLabel}>Assinatura atual</span>
              <span className={styles.subscriptionPlanName}>{currentPlan.name}</span>{' '}
              {currentAccount?.cancelAtPeriodEnd ? (
                <span className={styles.subscriptionCancelled}>
                  Cancelado — acesso até {formatDate(currentAccount.accessEndsAt ?? currentAccount.currentPeriodEnd)}
                </span>
              ) : currentAccount?.currentPeriodEnd ? (
                <span className={styles.subscriptionRenewal}>
                  Renova em {formatDate(currentAccount.currentPeriodEnd)}
                </span>
              ) : null}
            </div>

            {currentAccount?.cancelAtPeriodEnd ? (
              <button className={styles.resumeBtn} onClick={handleResume} disabled={resuming}>
                {resuming ? 'Reativando...' : 'Reativar assinatura'}
              </button>
            ) : (
              <button className={styles.cancelLink} onClick={handleOpenCancel}>
                Cancelar assinatura
              </button>
            )}
          </div>

          {resumeError && (
            <Alert severity="error" onClose={() => setResumeError(null)} sx={{ maxWidth: 680, mx: 'auto', mb: 2 }}>
              {resumeError}
            </Alert>
          )}
        </>
      )}

      {/* ── Divisor decorativo ──────────────────────────────────────────────── */}
      <div className={styles.sectionDivider}>
        <span className={styles.sectionDividerLine} />
        <span className={styles.sectionDividerIcon}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L17 9L9 17L1 9L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={styles.sectionDividerLine} />
      </div>

      {!loading && <BillingToggle value={billingCycle} onChange={setBillingCycle} />}

      {fetchError && (
        <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      {subscribeError && (
        <Alert severity="error" sx={{ maxWidth: 560, mx: 'auto', mb: 3 }} onClose={() => setSubscribeError(null)}>
          {subscribeError}
        </Alert>
      )}

      {loading ? (
        <PlansSkeleton />
      ) : (
        <>
          {subscriptions.length > 0 && (
            <div className={styles.grid}>
              {subscriptions.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isSubscribing={subscribingPlanId === plan.id}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          )}

          {creditPacks.length > 0 && (
            <section className={styles.creditSection}>
              <h2 className={styles.sectionTitle}>Pacotes de créditos</h2>
              <p className={styles.sectionSubtitle}>
                Compra avulsa, sem assinatura. Os créditos são somados ao seu saldo.
              </p>
              <div className={styles.grid}>
                {creditPacks.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                    isSubscribing={subscribingPlanId === plan.id}
                    onSubscribe={handleSubscribe}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Dialog: downgrade ───────────────────────────────────────────────── */}
      <Dialog
        open={downgradeTarget !== null}
        onClose={() => setDowngradeTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: '16px', boxShadow: '0 24px 48px rgba(27, 33, 69, 0.25)' } },
          backdrop: { sx: { backgroundColor: 'rgba(27, 33, 69, 0.45)' } },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#FDECE3',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 2L24 21H2L13 2Z" fill="var(--orange, #F2793A)" />
              <rect x="12" y="9.5" width="2" height="6" rx="1" fill="white" />
              <rect x="12" y="17" width="2" height="2" rx="1" fill="white" />
            </svg>
          </Box>

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 1.5, fontFamily: 'var(--font-poppins, Nunito, sans-serif)', color: 'var(--navy, #1B2145)' }}
          >
            Atenção: downgrade de plano
          </Typography>

          <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-secondary, #6B7280)' }}>
            Seu plano atual (<strong style={{ color: 'var(--text-primary, #1B2145)' }}>{currentPlan?.name}</strong>)
            oferece mais recursos do que o plano{' '}
            <strong style={{ color: 'var(--text-primary, #1B2145)' }}>{downgradeTarget?.name}</strong> que você está
            selecionando.
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary, #6B7280)' }}>
            Tem certeza que deseja fazer o downgrade?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDowngradeTarget(null)}
            sx={{ borderColor: 'var(--border, #E5E7EF)', color: 'var(--text-secondary, #6B7280)' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDowngrade}
            sx={{
              bgcolor: 'var(--orange, #F2793A)',
              '&:hover': { bgcolor: 'var(--orange-dark, #D9612A)' },
            }}
          >
            Sim, fazer downgrade
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: cancelar assinatura ────────────────────────────────────── */}
      <Dialog open={cancelOpen} onClose={() => !cancelling && setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar assinatura</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2">
            Seu acesso continua normalmente até o fim do período já pago
            {currentAccount?.currentPeriodEnd ? (
              <>
                {' '}
                (<strong>{formatDate(currentAccount.currentPeriodEnd)}</strong>)
              </>
            ) : null}
            . Você pode reativar a qualquer momento antes dessa data.
          </Typography>

          <TextField
            label="Por que está cancelando? (opcional)"
            multiline
            rows={3}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelling}
          />

          {cancelError && <Alert severity="error">{cancelError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>
            Manter assinatura
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
          >
            {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
