# Olimpo — Front-end

Interface do servidor de licenciamento da Coffee Tecnologia. Exibe os planos disponíveis por sistema, processa o checkout via Stripe e gerencia o fluxo de handoff para sistemas externos (Apollo, Compass, Cerimonial).

## Stack

- **Next.js** 15 (App Router)
- **React** 19
- **TypeScript**
- **MUI** 7 (Material UI)
- **Axios** + axios-case-converter
- **SASS** (estilos)
- **pnpm** (gerenciador de pacotes)

## Configuração local

### Pré-requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Back-end Olimpo rodando na porta 3000

### Instalação

```bash
git clone git@github.com:Coffee-Tecnologia/olimpo_front.git
cd olimpo_front
pnpm install
cp .env.example .env.local   # preencher variáveis
pnpm dev                      # sobe na porta 3001
```

### Variáveis de ambiente (`.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_SYSTEM=apollo     # sistema padrão (apollo | compass | cerimonial)
```

## Fluxo principal — checkout

O front recebe usuários redirecionados pelos sistemas integrados via handoff token:

```
Sistema externo (ex: Apollo)
  → gera JWT handoff (15 min, assinado com OLIMPO_HANDOFF_SECRET)
  → redireciona para /plans?system=apollo&t=<token>

/plans (Olimpo front)
  → exibe planos do sistema via GET /api/v1/plans?system=apollo
  → usuário escolhe plano
  → POST /api/v1/checkout { token, planId, billingCycle }
  → recebe { checkoutUrl } e redireciona ao Stripe
```

## Scripts

```bash
pnpm dev          # desenvolvimento (porta 3001)
pnpm build        # build de produção
pnpm start        # serve o build
pnpm lint         # ESLint
pnpm format       # Prettier (escreve)
pnpm format:check # Prettier (valida)
```

## Planos disponíveis (sistema Apollo)

| Plano | Valor | Tipo |
|-------|-------|------|
| Degust | R$ 250 | one-time |
| Starter | R$ 199,99/mês | recorrente |
| Pro | R$ 299/mês | recorrente |
| Enterprise | R$ 399/mês | recorrente |

## Deploy

O deploy é **manual** (sem CI/CD por enquanto), executado no servidor via SSH.

### Ambientes

| Processo PM2 | Porta | Branch | Domínio |
|--------------|-------|--------|---------|
| `olimpo_front_production` | 3000 | `main` | `olimpo.coffeetecnologia.com.br` |
| `olimpo_front_homolog` | 3001 | `homolog` | `homolog-olimpo.coffeetecnologia.com.br` |

### Comandos de deploy (no servidor)

```bash
cd ~/apps/olimpo/front
git pull origin main
pnpm install
pnpm build
pm2 restart olimpo_front_production
```

### PM2 — comandos úteis

```bash
pm2 status
pm2 restart olimpo_front_production
pm2 restart olimpo_front_homolog
pm2 logs olimpo_front_production
```

O PM2 é configurado via `~/apps/ecosystem.config.js` e sobe automaticamente no boot do servidor.

## Infraestrutura do servidor

- **VPS:** Ubuntu 22.04, IP `2.25.159.145`, usuário `olimpo`
- **Node.js:** 20 via NVM
- **PM2:** gerencia os dois processos front
- **Nginx:** roteia `/` → Next.js porta 3000 (prod) ou 3001 (homolog)
- **SSL:** Certbot (Let's Encrypt)

**Importante:** usar `pnpm install` (não `npm install`) — o projeto usa pnpm como gerenciador de pacotes.
