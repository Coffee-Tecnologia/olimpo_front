'use client';

import { useEffect, useState } from 'react';

import { createAdminPlan, updateAdminPlan, AdminPlanFull, AdminSystem, PlanPayload } from '@/api/admin';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface Props {
  open: boolean;
  plan: AdminPlanFull | null;
  defaultSystem: string;
  systems: AdminSystem[];
  onClose: () => void;
  onSaved: () => void;
}

type FeatureEntry = { name: string; value: string };

/* ── Sugestões de features conhecidas pelo front público (PlanCard.tsx).
   O admin pode usar qualquer chave/valor — as sugestões abaixo aparecem
   no autocomplete mas não restringem o input (freeSolo). ── */
const KEY_SUGGESTIONS = ['suporte', 'relatorios', 'api_access', 'sla'];

const VALUE_SUGGESTIONS: Record<string, string[]> = {
  suporte: ['email', 'email+chat', 'dedicado'],
  relatorios: ['basico', 'avancado'],
  // eslint-disable-next-line camelcase
  api_access: ['true', 'false'],
};

const emptyForm = (): Omit<PlanPayload, 'features'> => ({
  name: '',
  system: '',
  maxCnpjs: 2,
  maxUsers: 5,
  monthlyPriceCents: 0,
  annualPriceCents: null,
  active: true,
});

export const PlanFormDialog: React.FC<Props> = ({ open, plan, defaultSystem, systems, onClose, onSaved }) => {
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

  const set = (key: keyof typeof form, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const addFeature = () => {
    if (!newFeature.name || !newFeature.value) return;
    setFeatures((fs) => [...fs.filter((f) => f.name !== newFeature.name), newFeature]);
    setNewFeature({ name: '', value: '' });
  };

  const removeFeature = (name: string) => setFeatures((fs) => fs.filter((f) => f.name !== name));

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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nome do plano"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Sistema"
              value={form.system}
              onChange={(e) => set('system', e.target.value)}
              fullWidth
              disabled={!!plan}
            >
              {systems
                .filter((s) => s.active)
                .map((s) => (
                  <MenuItem key={s.slug} value={s.slug}>
                    {s.name}
                  </MenuItem>
                ))}
            </TextField>
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
              helperText={
                form.annualPriceCents
                  ? `R$ ${(form.annualPriceCents / 100).toFixed(2)}/mês`
                  : 'Deixe vazio para sem anual'
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          Features
        </Typography>

        {/* Features cadastradas */}
        {features.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Nenhuma feature cadastrada.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={0.5} mb={2}>
            {features.map((f) => (
              <Box
                key={f.name}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography variant="body2">
                  <strong>{f.name}</strong>: {f.value}
                </Typography>
                <IconButton size="small" onClick={() => removeFeature(f.name)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* Adicionar feature — autocomplete com sugestões, mas aceita qualquer valor */}
        <Box display="flex" gap={1} alignItems="flex-start">
          <Autocomplete
            freeSolo
            size="small"
            options={KEY_SUGGESTIONS.filter((k) => !features.find((f) => f.name === k))}
            value={newFeature.name}
            onInputChange={(_, v) => setNewFeature({ name: v, value: '' })}
            renderInput={(params) => <TextField {...params} label="Chave" placeholder="ex: suporte" />}
            sx={{ flex: 1 }}
          />

          <Autocomplete
            freeSolo
            size="small"
            options={VALUE_SUGGESTIONS[newFeature.name] ?? []}
            value={newFeature.value}
            onInputChange={(_, v) => setNewFeature((f) => ({ ...f, value: v }))}
            disabled={!newFeature.name}
            renderInput={(params) => (
              <TextField {...params} label="Valor" placeholder={newFeature.name === 'sla' ? 'ex: 99.9%' : 'ex: true'} />
            )}
            sx={{ flex: 1 }}
          />

          <IconButton
            color="primary"
            onClick={addFeature}
            disabled={!newFeature.name || !newFeature.value}
            sx={{ mt: 0.5 }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
