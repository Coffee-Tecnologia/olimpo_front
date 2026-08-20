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
    // Valores conhecidos recebem label amigável; valor customizado (ex: "email+GLPI") é exibido diretamente.
    getOnLabel: (v) =>
      v === 'dedicado'
        ? 'Suporte dedicado'
        : v === 'email+chat'
          ? 'Suporte e-mail + chat'
          : v === 'email'
            ? 'Suporte por e-mail'
            : `Suporte — ${v}`,
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

const CANONICAL_KEYS = new Set(CANONICAL_FEATURES.map((f) => f.key));

// Chaves internas — nunca exibidas como item de feature no card público
const META_KEYS = new Set(['contact_link', 'popular']);

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

const NotesIcon: React.FC = () => (
  <svg className={styles.limitIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 3.5h11M2.5 6.5h11M2.5 9.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 11v1l.8.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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

/* ── PlanCard ───────────────────────────────── */

interface PlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle, isSubscribing, onSubscribe }) => {
  const isCreditPack = plan.planType === 'credit_pack';
  const isEnterprise = plan.planType === 'enterprise';
  const isDegust = plan.name === 'Degust';
  const featuresMapGlobal = Object.fromEntries(plan.planFeatures.map((f) => [f.name, f.value]));
  const isPopular = featuresMapGlobal['popular'] === 'true';

  /* ── Enterprise — card de contato ── */
  if (isEnterprise) {
    const contactLink = featuresMapGlobal['contact_link'] ?? 'https://wa.me/55';

    return (
      <div className={styles.cardWrapper}>
        {isPopular && <span className={styles.badge}>Mais popular</span>}
        <div className={`${styles.card} ${styles.cardEnterprise} ${isPopular ? styles.cardPro : ''}`}>
          <div>
            <p className={styles.planName}>{plan.name}</p>
            <span className={styles.enterpriseBadge}>Sob consulta</span>
          </div>

          <div className={styles.priceRow}>
            <p className={styles.enterpriseTagline}>
              Solução personalizada para o volume e as integrações do seu negócio.
            </p>
          </div>

          <div className={styles.divider} />

          <div className={styles.limits}>
            <div className={`${styles.limitItem} ${styles.limitItemEnterprise}`}>
              <NotesIcon />
              Volume negociado
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.features}>
            {/* "Todas as funcionalidades do plano X" — sempre primeiro */}
            {plan.planFeatures
              .filter((f) => !META_KEYS.has(f.name) && f.value !== 'false' && f.value.toLowerCase().startsWith('todas'))
              .map((f) => (
                <div key={f.name} className={styles.featureItem}>
                  <CheckIcon />
                  <span className={styles.featureLabel}>{f.value}</span>
                </div>
              ))}
            {/* Demais features */}
            {plan.planFeatures
              .filter(
                (f) => !META_KEYS.has(f.name) && f.value !== 'false' && !f.value.toLowerCase().startsWith('todas'),
              )
              .map((f) => (
                <div key={f.name} className={styles.featureItem}>
                  <CheckIcon />
                  <span className={styles.featureLabel}>{f.value}</span>
                </div>
              ))}
          </div>

          <a href={contactLink} target="_blank" rel="noopener noreferrer" className={styles.btn}>
            Falar com especialista
          </a>
        </div>
      </div>
    );
  }

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

  const annualTotal =
    billingCycle === 'annual' && plan.annualPriceCents ? formatPrice(plan.annualPriceCents * 12) : null;

  const cycleDescription = isDegust
    ? '30 dias · sem renovação automática'
    : billingCycle === 'annual' && annualTotal
      ? `Cobrança anual · ${annualTotal}/ano`
      : 'Cancele quando quiser';

  const featuresMap = featuresMapGlobal;

  const buttonLabel = isDegust ? 'Começar agora' : 'Assinar';

  return (
    <div className={styles.cardWrapper}>
      {isPopular && <span className={styles.badge}>Mais popular</span>}

      <div className={`${styles.card} ${isPopular ? styles.cardPro : ''}`}>
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
          {plan.maxNotes !== null && plan.maxNotes !== undefined ? (
            <div className={styles.limitItem}>
              <NotesIcon />
              Até {plan.maxNotes.toLocaleString('pt-BR')} notas/mês
            </div>
          ) : (
            <>
              {plan.maxCnpjs !== null && plan.maxCnpjs !== undefined && (
                <div className={styles.limitItem}>
                  <CnpjIcon />
                  Até {plan.maxCnpjs} CNPJs
                </div>
              )}
              {plan.maxUsers !== null && plan.maxUsers !== undefined && (
                <div className={styles.limitItem}>
                  <UserIcon />
                  Até {plan.maxUsers} usuários
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.features}>
          {/* "Todas as funcionalidades do plano X" — sempre primeiro */}
          {plan.planFeatures
            .filter(
              (f) => !CANONICAL_KEYS.has(f.name) && !META_KEYS.has(f.name) && f.value.toLowerCase().startsWith('todas'),
            )
            .map((f) => (
              <div key={f.name} className={styles.featureItem}>
                <CheckIcon />
                <span className={styles.featureLabel}>{f.value}</span>
              </div>
            ))}

          {/* Features canônicas habilitadas — desabilitadas não são exibidas */}
          {CANONICAL_FEATURES.filter(({ key }) => {
            const value = featuresMap[key];
            return value !== undefined && value !== 'false';
          }).map(({ key, getOnLabel }) => (
            <div key={key} className={styles.featureItem}>
              <CheckIcon />
              <span className={styles.featureLabel}>{getOnLabel(featuresMap[key])}</span>
            </div>
          ))}

          {/* Features extras restantes — sem "Todas as funcionalidades" e sem chaves internas */}
          {plan.planFeatures
            .filter(
              (f) =>
                !CANONICAL_KEYS.has(f.name) &&
                !META_KEYS.has(f.name) &&
                f.value !== 'false' &&
                !f.value.toLowerCase().startsWith('todas'),
            )
            .map((f) => (
              <div key={f.name} className={styles.featureItem}>
                <CheckIcon />
                <span className={styles.featureLabel}>{f.value}</span>
              </div>
            ))}
        </div>

        <button
          className={`${styles.btn} ${isPopular ? styles.btnPro : ''}`}
          disabled={isSubscribing}
          onClick={() => onSubscribe(plan.id)}
        >
          {isSubscribing ? (
            <CircularProgress size={16} thickness={5} sx={{ color: isPopular ? '#fff' : '#f97316' }} />
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </div>
  );
};
