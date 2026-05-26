import Chip from '@mui/material/Chip';

const STATUS_MAP: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: 'Ativa', color: 'success' },
  trial: { label: 'Trial', color: 'warning' },
  inactive: { label: 'Inativa', color: 'error' },
  cancelled: { label: 'Cancelada', color: 'default' },
};

export const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const { label, color } = STATUS_MAP[status] ?? { label: status, color: 'default' };
  return <Chip label={label} color={color} size="small" />;
};
