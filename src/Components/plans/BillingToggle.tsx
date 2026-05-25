'use client';

import { BillingCycle } from '@/api/plans';
import styles from './plans.module.scss';

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({ value, onChange }) => (
  <div className={styles.toggleWrapper}>
    <div className={styles.toggle}>
      <button
        className={`${styles.toggleBtn} ${value === 'monthly' ? styles.active : ''}`}
        onClick={() => onChange('monthly')}
      >
        Mensal
      </button>
      <button
        className={`${styles.toggleBtn} ${value === 'annual' ? styles.active : ''}`}
        onClick={() => onChange('annual')}
      >
        Anual
      </button>
    </div>
  </div>
);
