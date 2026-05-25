import Skeleton from '@mui/material/Skeleton';
import styles from './plans.module.scss';

const CardSkeleton: React.FC = () => (
  <div className={styles.cardWrapper}>
    <div className={styles.card}>
      <Skeleton variant="text" width="45%" height={28} />
      <div>
        <Skeleton variant="text" width="60%" height={44} />
        <Skeleton variant="text" width="70%" height={18} />
      </div>
      <Skeleton variant="rectangular" height={1} />
      <div className={styles.limits}>
        <Skeleton variant="text" width="55%" height={20} />
        <Skeleton variant="text" width="50%" height={20} />
      </div>
      <Skeleton variant="rectangular" height={1} />
      <div className={styles.features}>
        <Skeleton variant="text" width="75%" height={20} />
        <Skeleton variant="text" width="65%" height={20} />
        <Skeleton variant="text" width="50%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
      </div>
      <Skeleton variant="rectangular" height={46} sx={{ borderRadius: '10px' }} />
    </div>
  </div>
);

export const PlansSkeleton: React.FC = () => (
  <div className={styles.grid}>
    {[1, 2, 3, 4].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
