'use client';

import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';

import { Plan, BillingCycle, getPlans, createSubscription } from '@/api/plans';
import { BillingToggle } from './BillingToggle';
import { PlanCard } from './PlanCard';
import { PlansSkeleton } from './PlansSkeleton';
import styles from './plans.module.scss';

const PLAN_ORDER = ['Degust', 'Starter', 'Pro', 'Enterprise'] as const;

const sortPlans = (plans: Plan[]) =>
  [...plans].sort((a, b) => PLAN_ORDER.indexOf(a.name as typeof PLAN_ORDER[number]) - PLAN_ORDER.indexOf(b.name as typeof PLAN_ORDER[number]));

export const PlansContent: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then((data) => setPlans(sortPlans(data)))
      .catch(() => setFetchError('Não foi possível carregar os planos. Tente novamente.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribingPlanId(planId);
    setSubscribeError(null);

    const plan = plans.find((p) => p.id === planId);
    const cycle = plan?.name === 'Degust' ? 'monthly' : billingCycle;

    try {
      const { checkoutUrl } = await createSubscription(planId, cycle);
      window.location.href = checkoutUrl;
    } catch {
      setSubscribeError('Erro ao iniciar assinatura. Tente novamente.');
      setSubscribingPlanId(null);
    }
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
    </main>
  );
};
