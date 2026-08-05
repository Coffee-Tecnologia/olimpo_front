'use client';

import { Plan, BillingCycle } from '@/api/plans';
import CircularProgress from '@mui/material/CircularProgress';

import styles from './plans.module.scss';

/* ── Mapeamento de features ─────────────────── */

const CANONICAL_FEATURES: Array<{
  key: string;
  getOnLabel: (value: string) => string;
  offLabel: string;
}> = [
  {
    key: 'suporte',
    getOnLabel: (v) =>
      v === 'dedicado' ? 'Suporte dedicado' : v === 'email+chat' ? 'Suporte e-mail + chat' : 'Suporte por e-mail',
    offLabel: 'Suporte',
  },
  {
    key: 'relatorios',
    getOnLabel: (v) => (v === 'avancado' ? 'Relatórios avançados' : 'Relatórios básicos'),
    offLabel: 'Relatórios',
  },
  { key: 'api_access', getOnLabel: () => 'API access', offLabel: 'API access' },
  { key: 'sla', getOnLabel: (v) => `SLA ${v}`, offLabel: 'SLA garantido' },
];

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

/* ── Componentes internos ───────────────────── */

const CnpjIcon: React.FC = () => (
  <svg className={styles.limitIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg className={styles.limitIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M2.5 14c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon: React.FC = () => (
  <div className={`${styles.featureIcon} ${styles.featureIconCheck}`}>
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
      <path
        d="M1 4L4 7L10 1"
        stroke="var(--orange, #f2793a)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const XIcon: React.FC = () => (
  <div className={`${styles.featureIcon} ${styles.featureIconX}`}>
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M1 1L8 8M8 1L1 8" stroke="#ccc" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </div>
);

/* ── PlanCard ───────────────────────────────── */

interface PlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle, isSubscribing, onSubscribe }) => {
  const isCreditPack = plan.planType === 'credit_pack';
  const isDegust = plan.name === 'Degust';
  const isPro = plan.name === 'Pro';

  if (isCreditPack) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <p className={styles.planName}>{plan.name}</p>

          <div className={styles.priceRow}>
            <div className={styles.priceBlock}>
              <span className={styles.priceAmount}>{formatPrice(plan.monthlyPriceCents)}</span>
              <span className={styles.priceSuffix}>/único</span>
            </div>
            <p className={styles.description}>Pagamento único · sem renovação</p>
          </div>

          <div className={styles.divider} />

          <div className={styles.creditsHighlight}>
            <span className={styles.creditsAmount}>{plan.creditsAmount?.toLocaleString('pt-BR')}</span>
            <span className={styles.creditsLabel}>créditos</span>
          </div>

          <button className={styles.btn} disabled={isSubscribing} onClick={() => onSubscribe(plan.id)}>
            {isSubscribing ? (
              <CircularProgress size={16} thickness={5} sx={{ color: '#f97316' }} />
            ) : (
              'Comprar créditos'
            )}
          </button>
        </div>
      </div>
    );
  }

  const displayCents =
    !isDegust && billingCycle === 'annual' && plan.annualPriceCents ? plan.annualPriceCents : plan.monthlyPriceCents;

  const priceSuffix = isDegust ? '/único' : '/mês';

  const cycleDescription = isDegust
    ? '30 dias · sem renovação automática'
    : billingCycle === 'annual'
      ? 'Cobrança anual com desconto'
      : 'Cancele quando quiser';

  const featuresMap = Object.fromEntries(plan.planFeatures.map((f) => [f.name, f.value]));

  const buttonLabel = isDegust ? 'Começar agora' : 'Assinar';

  return (
    <div className={styles.cardWrapper}>
      {isPro && <span className={styles.badge}>Mais popular</span>}

      <div className={`${styles.card} ${isPro ? styles.cardPro : ''}`}>
        <p className={styles.planName}>{plan.name}</p>

        <div className={styles.priceRow}>
          <div className={styles.priceBlock}>
            <span className={styles.priceAmount}>{formatPrice(displayCents)}</span>
            <span className={styles.priceSuffix}>{priceSuffix}</span>
          </div>
          <p className={styles.description}>{cycleDescription}</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.limits}>
          <div className={styles.limitItem}>
            <CnpjIcon />
            Até {plan.maxCnpjs} CNPJs
          </div>
          <div className={styles.limitItem}>
            <UserIcon />
            Até {plan.maxUsers} usuários
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.features}>
          {CANONICAL_FEATURES.map(({ key, getOnLabel, offLabel }) => {
            const value = featuresMap[key];
            const isOn = value !== undefined && value !== 'false';
            const label = isOn ? getOnLabel(value) : offLabel;

            return (
              <div key={key} className={styles.featureItem}>
                {isOn ? <CheckIcon /> : <XIcon />}
                <span className={`${styles.featureLabel} ${isOn ? '' : styles.featureLabelOff}`}>{label}</span>
              </div>
            );
          })}
        </div>

        <button
          className={`${styles.btn} ${isPro ? styles.btnPro : ''}`}
          disabled={isSubscribing}
          onClick={() => onSubscribe(plan.id)}
        >
          {isSubscribing ? (
            <CircularProgress size={16} thickness={5} sx={{ color: isPro ? '#fff' : '#f97316' }} />
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </div>
  );
};
