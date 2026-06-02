'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { getAdminAccounts, activateAccount, deactivateAccount, AdminAccount, AccountFilters } from '@/api/admin';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
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

const SYSTEMS = ['', 'compass', 'apollo', 'cerimonial'];
const STATUSES = ['', 'active', 'trial', 'inactive', 'cancelled'];

export const AdminAccountsList: React.FC = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccountFilters>({ page: 1 });
  const [page, setPage] = useState(0);

  const load = useCallback((f: AccountFilters) => {
    setLoading(true);
    getAdminAccounts(f)
      .then(({ accounts: data, meta: m }) => {
        setAccounts(data);
        setMeta(m);
        setError(null);
      })
      .catch(() => setError('Erro ao carregar contas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const handleFilter = (key: keyof AccountFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
    setPage(0);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
    setFilters((f) => ({ ...f, page: newPage + 1 }));
  };

  const handleActivate = async (id: string) => {
    await activateAccount(id);
    load(filters);
  };

  const handleDeactivate = async (id: string) => {
    await deactivateAccount(id);
    load(filters);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Contas
      </Typography>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Buscar"
          size="small"
          placeholder="Nome ou e-mail"
          onChange={(e) => handleFilter('q', e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Sistema"
          size="small"
          defaultValue=""
          onChange={(e) => handleFilter('system', e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {SYSTEMS.map((s) => (
            <MenuItem key={s} value={s}>
              {s || 'Todos'}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          size="small"
          defaultValue=""
          onChange={(e) => handleFilter('status', e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s || 'Todos'}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : accounts.map((account) => (
                <TableRow key={account.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {account.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={account.plan.system} size="small" />
                  </TableCell>
                  <TableCell>{account.plan.name}</TableCell>
                  <TableCell>
                    <StatusChip status={account.status} />
                  </TableCell>
                  <TableCell align="right">{account.userCount}</TableCell>
                  <TableCell>
                    {account.currentPeriodEnd ? new Date(account.currentPeriodEnd).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalhes">
                      <IconButton size="small" onClick={() => router.push(`/admin/accounts/${account.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {account.status !== 'active' && (
                      <Tooltip title="Ativar">
                        <IconButton size="small" color="success" onClick={() => handleActivate(account.id)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {account.status === 'active' && (
                      <Tooltip title="Desativar">
                        <IconButton size="small" color="error" onClick={() => handleDeactivate(account.id)}>
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
    </Box>
  );
};
