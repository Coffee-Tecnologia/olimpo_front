'use client';

import { useEffect, useState } from 'react';

import { Plan, BillingCycle, CurrentAccountPlan, getPlans, getCurrentAccount, createCheckout } from '@/api/plans';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

interface PlansContentProps {
  system: string;
  token: string;
}

export const PlansContent: React.FC<PlansContentProps> = ({ system, token }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentAccountPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<Plan | null>(null);

  useEffect(() => {
    const plansPromise = getPlans(system).then((data) => setPlans(sortPlans(data)));
    const accountPromise = token
      ? getCurrentAccount(token)
          .then((data) => setCurrentPlan(data.plan))
          .catch(() => null)
      : Promise.resolve();

    Promise.all([plansPromise, accountPromise])
      .catch(() => setFetchError('Não foi possível carregar os planos. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [system, token]);

  const doSubscribe = async (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    setSubscribeError(null);

    const cycle = plan.name === 'Degust' ? 'monthly' : billingCycle;

    try {
      const { checkoutUrl } = await createCheckout(token, plan.id, cycle);
      window.location.href = checkoutUrl;
    } catch {
      setSubscribeError('Erro ao iniciar assinatura. Tente novamente.');
      setSubscribingPlanId(null);
    }
  };

  const handleSubscribe = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const isDowngrade = currentPlan !== null && plan.monthlyPriceCents < currentPlan.monthlyPriceCents;

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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Escolha seu plano</h1>
        <p className={styles.subtitle}>Gerencie suas empresas com segurança e escale quando precisar.</p>
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
        <div className={styles.grid}>
          {plans.map((plan) => (
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

      <Dialog open={downgradeTarget !== null} onClose={() => setDowngradeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Atenção: downgrade de plano</DialogTitle>
        <DialogContent>
          <Typography>
            Seu plano atual (<strong>{currentPlan?.name}</strong>) oferece mais recursos do que o plano{' '}
            <strong>{downgradeTarget?.name}</strong> que você está selecionando.
          </Typography>
          <Typography sx={{ mt: 1 }}>Tem certeza que deseja fazer o downgrade?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDowngradeTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleConfirmDowngrade}>
            Sim, fazer downgrade
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};
