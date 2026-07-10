'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  getAdminAccount,
  activateAccount,
  deactivateAccount,
  updateAdminAccount,
  upsertFeatureOverride,
  deleteFeatureOverride,
  type AdminAccountDetail as AdminAccountDetailData,
  type FeatureOverride,
} from '@/api/admin';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { StatusChip } from './StatusChip';

interface Props {
  accountId: string;
}

export const AdminAccountDetail: React.FC<Props> = ({ accountId }) => {
  const router = useRouter();
  const [account, setAccount] = useState<AdminAccountDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState({ featureName: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [deploymentTypeDraft, setDeploymentTypeDraft] = useState<'cloud' | 'on_premise'>('cloud');
  const [savingDt, setSavingDt] = useState(false);

  const load = useCallback(() => {
    getAdminAccount(accountId)
      .then(setAccount)
      .catch(() => setError('Erro ao carregar conta.'));
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (account) setDeploymentTypeDraft(account.deploymentType);
  }, [account]);

  const handleActivate = async () => {
    await activateAccount(accountId);
    load();
  };

  const handleDeactivate = async () => {
    await deactivateAccount(accountId);
    load();
  };

  const handleAddOverride = async () => {
    if (!newFeature.featureName || !newFeature.value) return;
    setSaving(true);
    try {
      await upsertFeatureOverride(accountId, newFeature.featureName, newFeature.value);
      setNewFeature({ featureName: '', value: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (overrideId: string) => {
    await deleteFeatureOverride(accountId, overrideId);
    load();
  };

  const handleSaveDeploymentType = async () => {
    setSavingDt(true);
    try {
      await updateAdminAccount(accountId, { deploymentType: deploymentTypeDraft });
      load();
    } finally {
      setSavingDt(false);
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/accounts')} sx={{ mb: 2 }}>
        Voltar
      </Button>

      {!account ? (
        <Skeleton variant="rectangular" height={300} />
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {account.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {account.email}
                    </Typography>
                  </Box>
                  <StatusChip status={account.status} />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={1}>
                  {[
                    { label: 'Sistema', value: <Chip label={account.plan.system} size="small" /> },
                    { label: 'Plano', value: account.plan.name },
                    { label: 'Ciclo', value: account.billingCycle === 'annual' ? 'Anual' : 'Mensal' },
                    { label: 'Máx. CNPJs', value: account.plan.maxCnpjs },
                    { label: 'Máx. usuários', value: account.plan.maxUsers },
                    { label: 'Usuários ativos', value: account.userCount },
                    {
                      label: 'Expira em',
                      value: account.currentPeriodEnd
                        ? new Date(account.currentPeriodEnd).toLocaleDateString('pt-BR')
                        : '—',
                    },
                  ].map(({ label, value }) => (
                    <Grid size={{ xs: 6 }} key={label}>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {value}
                      </Typography>
                    </Grid>
                  ))}

                  <Grid size={{ xs: 12 }} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Implantação
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <FormControl size="small">
                        <Select
                          value={deploymentTypeDraft}
                          onChange={(e) => setDeploymentTypeDraft(e.target.value as 'cloud' | 'on_premise')}
                          sx={{ minWidth: 150 }}
                        >
                          <MenuItem value="cloud">Nuvem</MenuItem>
                          <MenuItem value="on_premise">On-premise</MenuItem>
                        </Select>
                      </FormControl>
                      {deploymentTypeDraft !== account.deploymentType && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveDeploymentType}
                          disabled={savingDt}
                        >
                          {savingDt ? 'Salvando...' : 'Salvar'}
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Box display="flex" gap={1}>
                  {account.status !== 'active' && (
                    <Button variant="contained" color="success" size="small" onClick={handleActivate}>
                      Ativar
                    </Button>
                  )}
                  {account.status === 'active' && (
                    <Button variant="outlined" color="error" size="small" onClick={handleDeactivate}>
                      Desativar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Feature Overrides
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Sobrescreve o comportamento padrão do plano para esta conta.
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {account.featureOverrides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="caption" color="text.secondary">
                            Nenhum override configurado.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      account.featureOverrides.map((o: FeatureOverride) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.featureName}</TableCell>
                          <TableCell>
                            <Chip label={o.value} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleDeleteOverride(o.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="feature_name"
                          value={newFeature.featureName}
                          onChange={(e) => setNewFeature((f) => ({ ...f, featureName: e.target.value }))}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="valor"
                          value={newFeature.value}
                          onChange={(e) => setNewFeature((f) => ({ ...f, value: e.target.value }))}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={handleAddOverride} disabled={saving}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
