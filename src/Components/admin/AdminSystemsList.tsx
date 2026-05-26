'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import {
  getServiceClients,
  createServiceClient,
  revokeServiceClient,
  getAdminSystems,
  ServiceClient,
  ServiceClientCreated,
  AdminSystem,
} from '@/api/admin';

export const AdminSystemsList: React.FC = () => {
  const [clients, setClients] = useState<ServiceClient[]>([]);
  const [systemNames, setSystemNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSystem, setCreateSystem] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createdKey, setCreatedKey] = useState<ServiceClientCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<ServiceClient | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getServiceClients(), getAdminSystems()])
      .then(([svcClients, systems]) => {
        setClients(svcClients);
        setSystemNames(Object.fromEntries(systems.map((s: AdminSystem) => [s.slug, s.name])));
      })
      .catch(() => setError('Erro ao carregar sistemas.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!createName.trim() || !createSystem.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createServiceClient(createName.trim(), createSystem.trim().toLowerCase());
      setCreateOpen(false);
      setCreateName('');
      setCreateSystem('');
      setCreatedKey(result);
      load();
    } catch {
      setCreateError('Erro ao criar sistema. Verifique os dados e tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeServiceClient(revokeTarget.id);
      setRevokeTarget(null);
      load();
    } finally {
      setRevoking(false);
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('pt-BR') : '—';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Sistemas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Novo sistema
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Skeleton variant="rectangular" height={200} />
      ) : clients.length === 0 ? (
        <Alert severity="info">Nenhum sistema cadastrado ainda.</Alert>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Sistema</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Chamadas</TableCell>
              <TableCell>Última chamada</TableCell>
              <TableCell>Cadastrado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id} sx={{ opacity: c.active ? 1 : 0.5 }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={systemNames[c.system] ?? c.system} color="primary" size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                    {c.system}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.active ? 'Ativo' : 'Revogado'}
                    color={c.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>{c.validateCount.toLocaleString('pt-BR')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{formatDate(c.lastValidatedAt)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{formatDate(c.createdAt)}</Typography>
                </TableCell>
                <TableCell align="center">
                  {c.active && (
                    <Tooltip title="Revogar acesso">
                      <IconButton size="small" color="error" onClick={() => setRevokeTarget(c)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog: criar sistema */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Novo sistema</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nome"
            placeholder="Ex: Apollo - Produção"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Sistema"
            placeholder="Ex: apollo"
            value={createSystem}
            onChange={(e) => setCreateSystem(e.target.value)}
            helperText="Identificador em minúsculas, sem espaços. Deve bater com o system dos planos."
            fullWidth
          />
          {createError && <Alert severity="error">{createError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createName.trim() || !createSystem.trim()}
          >
            {creating ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: exibir API key gerada */}
      <Dialog open={!!createdKey} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKeyIcon color="warning" />
          API Key gerada
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Alert severity="warning">
            Copie a chave agora. Ela <strong>não será exibida novamente</strong>.
          </Alert>
          <TextField
            value={createdKey?.apiKey ?? ''}
            fullWidth
            inputProps={{ readOnly: true, style: { fontFamily: 'monospace', fontSize: 13 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied ? 'Copiado!' : 'Copiar'}>
                    <IconButton onClick={handleCopy}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Salve essa chave como variável de ambiente <code>OLIMPO_SERVICE_KEY</code> na aplicação <strong>{createdKey?.system}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { setCreatedKey(null); setCopied(false); }}>
            Entendido, já copiei
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: confirmar revogação */}
      <Dialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revogar acesso</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja revogar o acesso de <strong>{revokeTarget?.name}</strong>?
            O sistema deixará de conseguir validar licenças imediatamente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleRevoke} disabled={revoking}>
            {revoking ? 'Revogando...' : 'Revogar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
