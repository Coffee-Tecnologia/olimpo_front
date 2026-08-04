'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  getAdminAccounts,
  getAdminPlans,
  updateAdminAccount,
  type AdminAccount,
  type AccountFilters,
  type AdminPlanFull,
} from '@/api/admin';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { StatusChip } from './StatusChip';

// ── types ──────────────────────────────────────────────────────────────────────

type DialogMode = 'activate' | 'deactivate' | 'edit';

interface DialogState {
  mode: DialogMode;
  account: AdminAccount;
}

interface FormState {
  expiresAt: string;
  planId: string;
  billingCycle: string;
  deploymentType: 'cloud' | 'on_premise';
}

// ── constants ──────────────────────────────────────────────────────────────────

const SYSTEMS  = ['', 'compass', 'apollo', 'cerimonial'];
const STATUSES = ['', 'active', 'trial', 'inactive', 'cancelled'];

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  annual:  'Anual',
};

const DEPLOYMENT_TYPE_LABELS: Record<string, string> = {
  cloud:      'Nuvem',
  on_premise: 'On-premise',
};

// ── helpers ────────────────────────────────────────────────────────────────────

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.split('T')[0] : '';
}

function dialogTitle(mode: DialogMode, name: string): string {
  if (mode === 'activate')   return `Ativar — ${name}`;
  if (mode === 'deactivate') return `Desativar — ${name}`;
  return `Editar conta — ${name}`;
}

// ── component ──────────────────────────────────────────────────────────────────

export const AdminAccountsList: React.FC = () => {
  const router = useRouter();

  // list state
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [meta, setMeta]         = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filters, setFilters]   = useState<AccountFilters>({ page: 1 });
  const [page, setPage]         = useState(0);

  // dialog state
  const [dialog, setDialog]           = useState<DialogState | null>(null);
  const [form, setForm]               = useState<FormState>({ expiresAt: '', planId: '', billingCycle: 'monthly', deploymentType: 'cloud' });
  const [systemPlans, setSystemPlans] = useState<AdminPlanFull[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // ── list logic ──────────────────────────────────────────────────────────────

  const load = useCallback((f: AccountFilters) => {
    setLoading(true);
    getAdminAccounts(f)
      .then(({ accounts: data, meta: m }) => { setAccounts(data); setMeta(m); setError(null); })
      .catch(() => setError('Erro ao carregar contas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  const handleFilter = (key: keyof AccountFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
    setPage(0);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
    setFilters((f) => ({ ...f, page: newPage + 1 }));
  };

  // ── dialog logic ────────────────────────────────────────────────────────────

  const openDialog = (mode: DialogMode, account: AdminAccount) => {
    setDialog({ mode, account });
    setForm({
      expiresAt:      toDateInput(account.currentPeriodEnd),
      planId:         account.plan.id,
      billingCycle:   account.billingCycle,
      deploymentType: account.deploymentType,
    });
    setDialogError(null);

    if (mode === 'edit') {
      setPlansLoading(true);
      getAdminPlans(account.plan.system)
        .then((bySystem) => setSystemPlans(Object.values(bySystem).flat()))
        .catch(() => setSystemPlans([]))
        .finally(() => setPlansLoading(false));
    }
  };

  const closeDialog = () => {
    if (saving) return;
    setDialog(null);
    setSystemPlans([]);
    setDialogError(null);
  };

  const handleConfirm = async () => {
    if (!dialog) return;

    if (dialog.mode === 'activate' && !form.expiresAt) {
      setDialogError('Informe a data de expiração para ativar a conta.');
      return;
    }

    setSaving(true);
    setDialogError(null);

    try {
      if (dialog.mode === 'edit') {
        await updateAdminAccount(dialog.account.id, {
          planId:          form.planId,
          billingCycle:    form.billingCycle,
          currentPeriodEnd: form.expiresAt || null,
          deploymentType:  form.deploymentType,
        });
      } else {
        await updateAdminAccount(dialog.account.id, {
          status:          dialog.mode === 'activate' ? 'active' : 'inactive',
          currentPeriodEnd: form.expiresAt || null,
        });
      }
      closeDialog();
      load(filters);
    } catch (e: unknown) {
      const errs = (e as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors;
      setDialogError(errs?.join(', ') ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Contas
      </Typography>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Buscar"
          size="small"
          placeholder="Nome ou e-mail"
          onChange={(e) => handleFilter('q', e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField select label="Sistema" size="small" defaultValue=""
          onChange={(e) => handleFilter('system', e.target.value)} sx={{ minWidth: 140 }}>
          {SYSTEMS.map((s) => <MenuItem key={s} value={s}>{s || 'Todos'}</MenuItem>)}
        </TextField>
        <TextField select label="Status" size="small" defaultValue=""
          onChange={(e) => handleFilter('status', e.target.value)} sx={{ minWidth: 140 }}>
          {STATUSES.map((s) => <MenuItem key={s} value={s}>{s || 'Todos'}</MenuItem>)}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Conta</TableCell>
            <TableCell>Sistema</TableCell>
            <TableCell>Plano</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Usuários</TableCell>
            <TableCell>Expira em</TableCell>
            <TableCell align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                </TableRow>
              ))
            : accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{account.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{account.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={account.plan.system} size="small" />
                  </TableCell>
                  <TableCell>{account.plan.name}</TableCell>
                  <TableCell><StatusChip status={account.status} /></TableCell>
                  <TableCell align="right">{account.userCount}</TableCell>
                  <TableCell>
                    {account.currentPeriodEnd
                      ? new Date(account.currentPeriodEnd).toLocaleDateString('pt-BR')
                      : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalhes">
                      <IconButton size="small" onClick={() => router.push(`/admin/accounts/${account.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => openDialog('edit', account)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {account.status !== 'active' && (
                      <Tooltip title="Ativar">
                        <IconButton size="small" color="success" onClick={() => openDialog('activate', account)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {account.status === 'active' && (
                      <Tooltip title="Desativar">
                        <IconButton size="small" color="error" onClick={() => openDialog('deactivate', account)}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={meta.totalCount}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={25}
        rowsPerPageOptions={[25]}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />

      {/* Dialog: ativar / desativar / editar */}
      <Dialog open={!!dialog} onClose={closeDialog} maxWidth="xs" fullWidth>
        {dialog && (
          <>
            <DialogTitle>{dialogTitle(dialog.mode, dialog.account.name)}</DialogTitle>

            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
              {dialog.mode === 'activate' && (
                <Typography variant="body2" color="text.secondary">
                  A conta será <strong>ativada</strong>. Defina até quando a licença é válida.
                </Typography>
              )}
              {dialog.mode === 'deactivate' && (
                <Typography variant="body2" color="text.secondary">
                  A conta será <strong>desativada</strong> imediatamente. Você pode atualizar a data de expiração ou deixar como está.
                </Typography>
              )}

              {/* Data de expiração — presente em todos os modos */}
              <TextField
                label={dialog.mode === 'activate' ? 'Expira em (obrigatório)' : 'Expira em'}
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                required={dialog.mode === 'activate'}
              />

              {/* Campos extras apenas no modo editar */}
              {dialog.mode === 'edit' && (
                <>
                  <FormControl size="small" fullWidth disabled={plansLoading}>
                    <InputLabel>Plano</InputLabel>
                    <Select
                      label="Plano"
                      value={form.planId}
                      onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
                    >
                      {plansLoading && <MenuItem value={form.planId}>{dialog.account.plan.name}</MenuItem>}
                      {systemPlans.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Ciclo de cobrança</InputLabel>
                    <Select
                      label="Ciclo de cobrança"
                      value={form.billingCycle}
                      onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))}
                    >
                      {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Implantação</InputLabel>
                    <Select
                      label="Implantação"
                      value={form.deploymentType}
                      onChange={(e) => setForm((f) => ({ ...f, deploymentType: e.target.value as 'cloud' | 'on_premise' }))}
                    >
                      {Object.entries(DEPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              {dialogError && <Alert severity="error">{dialogError}</Alert>}
            </DialogContent>

            <DialogActions>
              <Button onClick={closeDialog} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color={dialog.mode === 'deactivate' ? 'error' : 'primary'}
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving
                  ? 'Salvando...'
                  : dialog.mode === 'activate'   ? 'Ativar'
                  : dialog.mode === 'deactivate' ? 'Desativar'
                  : 'Salvar'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
