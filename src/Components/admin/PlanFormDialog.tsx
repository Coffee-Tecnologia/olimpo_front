'use client';

import { useEffect, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { createAdminPlan, updateAdminPlan, AdminPlanFull, PlanPayload } from '@/api/admin';

const PLAN_NAMES = ['Degust', 'Starter', 'Pro', 'Enterprise'];

interface Props {
  open: boolean;
  plan: AdminPlanFull | null;
  defaultSystem: string;
  onClose: () => void;
  onSaved: () => void;
}

type FeatureEntry = { name: string; value: string };

const emptyForm = (): Omit<PlanPayload, 'features'> => ({
  name: 'Starter',
  system: '',
  maxCnpjs: 2,
  maxUsers: 5,
  monthlyPriceCents: 0,
  annualPriceCents: null,
  active: true,
});

export const PlanFormDialog: React.FC<Props> = ({ open, plan, defaultSystem, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyForm());
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [newFeature, setNewFeature] = useState<FeatureEntry>({ name: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (plan) {
      setForm({
        name: plan.name,
        system: plan.system,
        maxCnpjs: plan.maxCnpjs,
        maxUsers: plan.maxUsers,
        monthlyPriceCents: plan.monthlyPriceCents,
        annualPriceCents: plan.annualPriceCents,
        active: plan.active,
      });
      setFeatures(plan.planFeatures.map((f) => ({ name: f.name, value: f.value })));
    } else {
      setForm({ ...emptyForm(), system: defaultSystem });
      setFeatures([]);
    }
    setError(null);
  }, [open, plan, defaultSystem]);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addFeature = () => {
    if (!newFeature.name || !newFeature.value) return;
    setFeatures((fs) => [...fs.filter((f) => f.name !== newFeature.name), newFeature]);
    setNewFeature({ name: '', value: '' });
  };

  const removeFeature = (name: string) =>
    setFeatures((fs) => fs.filter((f) => f.name !== name));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const featureMap = Object.fromEntries(features.map((f) => [f.name, f.value]));
    const payload: PlanPayload = { ...form, features: featureMap };

    try {
      if (plan) {
        await updateAdminPlan(plan.id, payload);
      } else {
        await createAdminPlan(payload);
      }
      onSaved();
    } catch (e: unknown) {
      const msgs = (e as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors;
      setError(msgs ? msgs.join(', ') : 'Erro ao salvar plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{plan ? `Editar ${plan.name} (${plan.system})` : 'Novo plano'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Nome do plano"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              fullWidth
              SelectProps={{ native: true }}
            >
              {PLAN_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Sistema"
              value={form.system}
              onChange={(e) => set('system', e.target.value)}
              fullWidth
              placeholder="ex: compass, apollo"
              helperText="Sistema novo = só digitar o nome"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Máx. CNPJs"
              type="number"
              value={form.maxCnpjs}
              onChange={(e) => set('maxCnpjs', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Máx. usuários"
              type="number"
              value={form.maxUsers}
              onChange={(e) => set('maxUsers', Number(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Preço mensal (centavos)"
              type="number"
              value={form.monthlyPriceCents}
              onChange={(e) => set('monthlyPriceCents', Number(e.target.value))}
              fullWidth
              helperText={`R$ ${((form.monthlyPriceCents || 0) / 100).toFixed(2)}`}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Preço anual (centavos)"
              type="number"
              value={form.annualPriceCents ?? ''}
              onChange={(e) => set('annualPriceCents', e.target.value ? Number(e.target.value) : null)}
              fullWidth
              helperText={form.annualPriceCents ? `R$ ${(form.annualPriceCents / 100).toFixed(2)}/mês` : 'Deixe vazio para sem anual'}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" fontWeight={600} mb={1}>Features</Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {features.map((f) => (
            <Chip
              key={f.name}
              label={`${f.name}: ${f.value}`}
              onDelete={() => removeFeature(f.name)}
              deleteIcon={<DeleteIcon />}
              size="small"
            />
          ))}
        </Box>

        <Box display="flex" gap={1} alignItems="flex-start">
          <TextField
            size="small"
            placeholder="nome (ex: api_access)"
            value={newFeature.name}
            onChange={(e) => setNewFeature((f) => ({ ...f, name: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            placeholder="valor (ex: true)"
            value={newFeature.value}
            onChange={(e) => setNewFeature((f) => ({ ...f, value: e.target.value }))}
            sx={{ flex: 1 }}
          />
          <IconButton color="primary" onClick={addFeature}>
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
