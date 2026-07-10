'use client';

import { useEffect, useState } from 'react';

import {
  getAdminKeys,
  rotateKek,
  type KeyAccountStatus,
  type KeysResponse,
} from '@/api/admin';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ── constants ──────────────────────────────────────────────────────────────────

const DEK_ROTATION_OVERDUE_DAYS = 9;

// ── helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} h`;
  return `há ${days} dia${days !== 1 ? 's' : ''}`;
}

function dekStatus(lastRotatedAt: string | null): {
  label: string;
  dot: string;
} {
  if (!lastRotatedAt) return { label: '—', dot: '#9e9e9e' };
  const days = (Date.now() - new Date(lastRotatedAt).getTime()) / 86_400_000;
  if (days > DEK_ROTATION_OVERDUE_DAYS) return { label: 'Atrasada', dot: '#f57c00' };
  return { label: 'Em dia', dot: '#2e7d32' };
}

const LEASE_STATUS: Record<
  KeyAccountStatus['status'],
  { label: string; dot: string }
> = {
  healthy:           { label: 'Saudável',        dot: '#2e7d32' },
  degraded:          { label: 'Degradado',        dot: '#f57c00' },
  blocked:           { label: 'Bloqueado',        dot: '#c62828' },
  never_provisioned: { label: 'Não provisionado', dot: '#9e9e9e' },
};

// ── sub-components ─────────────────────────────────────────────────────────────

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: color,
      mr: 0.75,
      flexShrink: 0,
      verticalAlign: 'middle',
    }}
  />
);

const StatusCell: React.FC<{ dot: string; label: string; sub: string }> = ({
  dot,
  label,
  sub,
}) => (
  <Box>
    <Box display="flex" alignItems="center">
      <Dot color={dot} />
      <Typography variant="body2" fontWeight={500} component="span">
        {label}
      </Typography>
    </Box>
    {sub !== '—' && (
      <Typography variant="caption" color="text.secondary" sx={{ ml: '1.5rem', display: 'block' }}>
        {sub}
      </Typography>
    )}
  </Box>
);

// ── main component ─────────────────────────────────────────────────────────────

export const AdminKeysList: React.FC = () => {
  const [data, setData] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rotateOpen, setRotateOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [rotating, setRotating] = useState(false);
  const [rotateResult, setRotateResult] = useState<string | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminKeys()
      .then(setData)
      .catch(() => setError('Erro ao carregar status das chaves.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRotate = async () => {
    if (!reason.trim()) return;
    setRotating(true);
    setRotateError(null);
    try {
      const result = await rotateKek(reason.trim());
      setRotateResult(`KEK rotacionada com sucesso. Nova versão: ${result.newKekVersion}`);
      setRotateOpen(false);
      setReason('');
      load();
    } catch {
      setRotateError('Erro ao rotacionar KEK. Verifique os logs do servidor.');
    } finally {
      setRotating(false);
    }
  };

  const handleCloseRotate = () => {
    if (rotating) return;
    setRotateOpen(false);
    setReason('');
    setRotateError(null);
  };

  const { summary, kek } = data ?? {};

  const summaryCards = [
    { label: 'Contas',           value: summary?.total,           color: '#5e60ce' },
    { label: 'Renovando',        value: summary?.healthy,         color: '#2e7d32' },
    { label: 'Rotação atrasada', value: summary?.rotationOverdue, color: '#f57c00' },
    { label: 'Bloqueadas',       value: summary?.blocked,         color: '#c62828' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Chaves
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rotação de DEK por conta e saúde de renovação de lease
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {rotateResult && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRotateResult(null)}>
          {rotateResult}
        </Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={2} mb={4}>
        {summaryCards.map(({ label, value, color }) => (
          <Grid size={{ xs: 6, sm: 3 }} key={label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                {data ? (
                  <Typography variant="h4" fontWeight={700} color={color}>
                    {value ?? 0}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={60} height={56} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Accounts table */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box px={2} pt={2} pb={1}>
            <Typography variant="overline" color="text.secondary" letterSpacing={1.5}>
              Contas — Apollo
            </Typography>
          </Box>

          {loading ? (
            <Box p={2}><Skeleton variant="rectangular" height={200} /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 1 }}>
                    CONTA
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 1 }}>
                    VERSÃO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 1 }}>
                    ROTAÇÃO DE DEK
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem', letterSpacing: 1 }}>
                    RENOVAÇÃO DE LEASE
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(data?.accounts ?? []).map((account) => {
                  const dek  = dekStatus(account.lastRotatedAt);
                  const lease = LEASE_STATUS[account.status] ?? LEASE_STATUS.never_provisioned;
                  const provisioned = account.status !== 'never_provisioned';

                  return (
                    <TableRow key={account.accountId} hover>
                      {/* CONTA */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {account.accountName}
                        </Typography>
                        <Chip
                          label={account.deploymentType === 'on_premise' ? 'On-premise' : 'Nuvem'}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                        />
                      </TableCell>

                      {/* VERSÃO */}
                      <TableCell>
                        <Typography variant="body2" color={provisioned ? 'text.primary' : 'text.disabled'}>
                          {account.keyVersion != null ? `v${account.keyVersion}` : '—'}
                        </Typography>
                      </TableCell>

                      {/* ROTAÇÃO DE DEK */}
                      <TableCell>
                        {provisioned ? (
                          <StatusCell
                            dot={dek.dot}
                            label={dek.label}
                            sub={timeAgo(account.lastRotatedAt)}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>

                      {/* RENOVAÇÃO DE LEASE */}
                      <TableCell>
                        <StatusCell
                          dot={lease.dot}
                          label={lease.label}
                          sub={provisioned ? `renovou ${timeAgo(account.lastIssuedAt)}` : ''}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && (data?.accounts ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>
                        Nenhuma conta encontrada.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* KEK card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
            <Box display="flex" gap={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LockOutlinedIcon sx={{ color: 'primary.contrastText', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
                  Chave mestra (KEK)
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Envelopa as DEKs de cada tenant. Rotacionar aqui reembrulha todas as DEKs ativas.
                </Typography>
                {kek ? (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Última rotação
                    {' · '}
                    {new Date(kek.activatedAt).toLocaleDateString('pt-BR')}
                    {' · '}
                    {kek.rotationReason ?? 'Rotação inicial'}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="warning.main" display="block" mt={1}>
                    Nenhuma KEK ativa encontrada — configure antes de emitir chaves.
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              color="warning"
              startIcon={<AutorenewIcon />}
              onClick={() => setRotateOpen(true)}
              sx={{ flexShrink: 0 }}
            >
              Rotacionar KEK
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={rotateOpen} onClose={handleCloseRotate} maxWidth="sm" fullWidth>
        <DialogTitle>Rotacionar KEK</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Alert severity="warning">
            Isso <strong>reembrulha a DEK de todas as contas ativas</strong> com uma nova chave
            mestra (KEK). A operação não re-criptografa arquivos.
          </Alert>
          <TextField
            label="Justificativa (obrigatória)"
            placeholder="Ex: Rotação trimestral de segurança, suspeita de comprometimento..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          {rotateError && <Alert severity="error">{rotateError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRotate} disabled={rotating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRotate}
            disabled={rotating || !reason.trim()}
            startIcon={<AutorenewIcon />}
          >
            {rotating ? 'Rotacionando...' : 'Confirmar rotação'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
