'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { getAdminPlans, togglePlanActive, getAdminSystems, AdminPlanFull, AdminPlansBySystem, AdminSystem } from '@/api/admin';
import { PlanFormDialog } from './PlanFormDialog';

export const AdminPlansList: React.FC = () => {
  const [plansBySystem, setPlansBySystem] = useState<AdminPlansBySystem>({});
  const [systemNames, setSystemNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlanFull | null>(null);
  const [defaultSystem, setDefaultSystem] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getAdminPlans(), getAdminSystems()])
      .then(([plans, systems]) => {
        setPlansBySystem(plans);
        setSystemNames(Object.fromEntries(systems.map((s: AdminSystem) => [s.slug, s.name])));
      })
      .catch(() => setError('Erro ao carregar planos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (plan: AdminPlanFull) => {
    await togglePlanActive(plan.id, !plan.active);
    load();
  };

  const openNew = (system = '') => {
    setEditing(null);
    setDefaultSystem(system);
    setDialogOpen(true);
  };

  const openEdit = (plan: AdminPlanFull) => {
    setEditing(plan);
    setDefaultSystem(plan.system);
    setDialogOpen(true);
  };

  const systems = Object.keys(plansBySystem);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Planos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openNew()}>
          Novo plano
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Skeleton variant="rectangular" height={200} />
      ) : systems.length === 0 ? (
        <Alert severity="info">Nenhum plano cadastrado. Crie o primeiro!</Alert>
      ) : (
        systems.map((system) => (
          <Accordion key={system} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Chip label={systemNames[system] ?? system} color="primary" />
                <Typography variant="body2" color="text.secondary">
                  {plansBySystem[system].length} plano(s)
                </Typography>
                <Box ml="auto" mr={2}>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={(e) => { e.stopPropagation(); openNew(system); }}
                  >
                    Adicionar plano
                  </Button>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell align="right">CNPJs</TableCell>
                    <TableCell align="right">Usuários</TableCell>
                    <TableCell align="right">Mensal (R$)</TableCell>
                    <TableCell align="right">Anual (R$)</TableCell>
                    <TableCell>Features</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plansBySystem[system].map((plan) => (
                    <TableRow key={plan.id} sx={{ opacity: plan.active ? 1 : 0.5 }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{plan.name}</Typography>
                      </TableCell>
                      <TableCell align="right">{plan.maxCnpjs}</TableCell>
                      <TableCell align="right">{plan.maxUsers}</TableCell>
                      <TableCell align="right">
                        {(plan.monthlyPriceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        {plan.annualPriceCents
                          ? (plan.annualPriceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {plan.planFeatures.map((f) => (
                            <Chip key={f.name} label={`${f.name}: ${f.value}`} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={plan.active ? 'Ativo' : 'Inativo'}
                          color={plan.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(plan)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={plan.active ? 'Desativar' : 'Ativar'}>
                          <IconButton size="small" color={plan.active ? 'error' : 'success'} onClick={() => handleToggle(plan)}>
                            {plan.active ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      <PlanFormDialog
        open={dialogOpen}
        plan={editing}
        defaultSystem={defaultSystem}
        systems={
          Object.values(systemNames).length > 0
            ? Object.entries(systemNames).map(([slug, name]) => ({ id: '', slug, name, active: true }))
            : []
        }
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </Box>
  );
};
