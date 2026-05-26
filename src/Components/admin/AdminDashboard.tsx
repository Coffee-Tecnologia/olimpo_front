'use client';

import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

import { getAdminDashboard, DashboardResponse } from '@/api/admin';
import { StatusChip } from './StatusChip';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => setError('Erro ao carregar dashboard.'));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Dashboard</Typography>

      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Total de contas', value: data?.totals.total, color: '#5e60ce' },
          { label: 'Ativas', value: data?.totals.active, color: '#2e7d32' },
          { label: 'Trial', value: data?.totals.trial, color: '#f57c00' },
          { label: 'Inativas', value: data?.totals.inactive, color: '#c62828' },
        ].map(({ label, value, color }) => (
          <Grid size={{ xs: 6, sm: 3 }} key={label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                {data ? (
                  <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
                ) : (
                  <Skeleton variant="text" width={60} height={56} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Por sistema</Typography>
              {data ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sistema</TableCell>
                      <TableCell align="right">Contas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.bySystem.map(({ system, count }) => (
                      <TableRow key={system}>
                        <TableCell><Chip label={system} size="small" /></TableCell>
                        <TableCell align="right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <Skeleton variant="rectangular" height={120} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Por plano</Typography>
              {data ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Plano</TableCell>
                      <TableCell>Sistema</TableCell>
                      <TableCell align="right">Contas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.byPlan.map(({ plan, system, count }) => (
                      <TableRow key={`${plan}-${system}`}>
                        <TableCell>{plan}</TableCell>
                        <TableCell><Chip label={system} size="small" /></TableCell>
                        <TableCell align="right">{count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <Skeleton variant="rectangular" height={120} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Expirando em 7 dias
              </Typography>
              {data ? (
                data.expiringSoon.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nenhuma conta expirando em breve.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Conta</TableCell>
                        <TableCell>Sistema</TableCell>
                        <TableCell>Plano</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Expira em</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.expiringSoon.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{a.email}</Typography>
                          </TableCell>
                          <TableCell><Chip label={a.system} size="small" /></TableCell>
                          <TableCell>{a.plan}</TableCell>
                          <TableCell><StatusChip status={a.status} /></TableCell>
                          <TableCell>{a.currentPeriodEnd ? new Date(a.currentPeriodEnd).toLocaleDateString('pt-BR') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : <Skeleton variant="rectangular" height={100} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
