'use client';

import { useEffect, useState } from 'react';

import {
  createAdminSystem,
  createServiceClient,
  getAdminSystems,
  getServiceClients,
  revokeServiceClient,
  AdminSystem,
  ServiceClient,
  ServiceClientCreated,
} from '@/api/admin';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyIcon from '@mui/icons-material/Key';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export const AdminSystemsList: React.FC = () => {
  const [systems, setSystems] = useState<AdminSystem[]>([]);
  const [clients, setClients] = useState<ServiceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSystemOpen, setNewSystemOpen] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemSlug, setNewSystemSlug] = useState('');
  const [savingSystem, setSavingSystem] = useState(false);
  const [newSystemError, setNewSystemError] = useState<string | null>(null);

  const [keySystemSlug, setKeySystemSlug] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [createdKey, setCreatedKey] = useState<ServiceClientCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<ServiceClient | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminSystems(), getServiceClients()])
      .then(([fetchedSystems, fetchedClients]) => {
        setSystems(fetchedSystems);
        setClients(fetchedClients);
      })
      .catch(() => setError('Erro ao carregar sistemas.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const clientsFor = (slug: string) => clients.filter((c) => c.system === slug);

  const handleCreateSystem = async () => {
    if (!newSystemName.trim() || !newSystemSlug.trim()) return;
    setSavingSystem(true);
    setNewSystemError(null);
    try {
      await createAdminSystem(newSystemSlug.trim().toLowerCase(), newSystemName.trim());
      setNewSystemOpen(false);
      setNewSystemName('');
      setNewSystemSlug('');
      load();
    } catch {
      setNewSystemError('Erro ao criar sistema. O slug pode já estar em uso.');
    } finally {
      setSavingSystem(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keySystemSlug || !keyName.trim()) return;
    setGeneratingKey(true);
    setKeyError(null);
    try {
      const result = await createServiceClient(keyName.trim(), keySystemSlug);
      setKeySystemSlug(null);
      setKeyName('');
      setCreatedKey(result);
      load();
    } catch {
      setKeyError('Erro ao gerar chave.');
    } finally {
      setGeneratingKey(false);
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

  const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Sistemas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewSystemOpen(true)}>
          Novo sistema
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rectangular" height={200} />
      ) : systems.length === 0 ? (
        <Alert severity="info">
          Nenhum sistema cadastrado ainda. Cadastre o primeiro para começar a gerenciar licenças.
        </Alert>
      ) : (
        systems.map((system) => {
          const systemClients = clientsFor(system.slug);
          return (
            <Accordion key={system.slug} defaultExpanded sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Typography fontWeight={700}>{system.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {system.slug}
                  </Typography>
                  <Chip
                    label={`${systemClients.length} chave${systemClients.length !== 1 ? 's' : ''}`}
                    size="small"
                    icon={<KeyIcon />}
                    variant="outlined"
                  />
                  <Box ml="auto" mr={2}>
                    <Button
                      size="small"
                      startIcon={<VpnKeyIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeySystemSlug(system.slug);
                      }}
                    >
                      Gerar chave
                    </Button>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {systemClients.length === 0 ? (
                  <Box px={2} py={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma chave gerada para este sistema.
                    </Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome da chave</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Chamadas</TableCell>
                        <TableCell>Última chamada</TableCell>
                        <TableCell>Gerada em</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {systemClients.map((c) => (
                        <TableRow key={c.id} sx={{ opacity: c.active ? 1 : 0.5 }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {c.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={c.active ? 'Ativa' : 'Revogada'}
                              color={c.active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{c.validateCount.toLocaleString('pt-BR')}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(c.lastValidatedAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(c.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {c.active && (
                              <Tooltip title="Revogar chave">
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
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* Dialog: novo sistema */}
      <Dialog open={newSystemOpen} onClose={() => setNewSystemOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Novo sistema</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nome"
            placeholder="Ex: Apollo"
            value={newSystemName}
            onChange={(e) => setNewSystemName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Slug"
            placeholder="Ex: apollo"
            value={newSystemSlug}
            onChange={(e) => setNewSystemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            helperText="Identificador único em minúsculas. Usado nos planos e nas chaves."
            fullWidth
          />
          {newSystemError && <Alert severity="error">{newSystemError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSystemOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateSystem}
            disabled={savingSystem || !newSystemName.trim() || !newSystemSlug.trim()}
          >
            {savingSystem ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: gerar chave */}
      <Dialog open={!!keySystemSlug} onClose={() => setKeySystemSlug(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Gerar chave — {systems.find((s) => s.slug === keySystemSlug)?.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nome da chave"
            placeholder="Ex: Produção, Desenvolvimento"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            fullWidth
          />
          {keyError && <Alert severity="error">{keyError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeySystemSlug(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGenerateKey} disabled={generatingKey || !keyName.trim()}>
            {generatingKey ? 'Gerando...' : 'Gerar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: exibir chave gerada (uma única vez) */}
      <Dialog open={!!createdKey} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKeyIcon color="warning" />
          Chave gerada
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Alert severity="warning">
            Copie a chave agora. Ela <strong>não será exibida novamente</strong>.
          </Alert>
          <TextField
            value={createdKey?.apiKey ?? ''}
            fullWidth
            slotProps={{
              htmlInput: { readOnly: true, style: { fontFamily: 'monospace', fontSize: 13 } },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? 'Copiado!' : 'Copiar'}>
                      <IconButton onClick={handleCopy}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Salve como <code>OLIMPO_SERVICE_KEY</code> na aplicação <strong>{createdKey?.system}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setCreatedKey(null);
              setCopied(false);
            }}
          >
            Entendido, já copiei
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: confirmar revogação */}
      <Dialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revogar chave</DialogTitle>
        <DialogContent>
          <Typography>
            Revogar <strong>{revokeTarget?.name}</strong>? A aplicação perderá acesso imediatamente.
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
