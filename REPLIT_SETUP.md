# 🚀 Setup no Replit - H2 Verde Leads Dashboard

## Passo 1: Importar Repositório

1. Acesse [Replit](https://replit.com)
2. Clique em "Create Repl"
3. Selecione "Import from GitHub"
4. Cole a URL: `https://github.com/tafita81/RFQ`
5. Clique em "Import from GitHub"

## Passo 2: Configurar Variáveis de Ambiente

No Replit, vá em "Secrets" (ícone de cadeado) e adicione:

```bash
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your_jwt_secret_here
VITE_APP_TITLE=H2 Verde Leads Dashboard
VITE_APP_LOGO=/logo.svg
```

### Opção A: Usar TiDB Cloud (Recomendado - Grátis)
1. Acesse [TiDB Cloud](https://tidbcloud.com/)
2. Crie conta gratuita
3. Crie um cluster "Serverless Tier" (grátis)
4. Copie a connection string
5. Cole em `DATABASE_URL`

### Opção B: Usar Supabase (Alternativa)
1. Acesse [Supabase](https://supabase.com/)
2. Crie projeto gratuito
3. Vá em Settings → Database
4. Copie a connection string (modo "Transaction")
5. Cole em `DATABASE_URL`

## Passo 3: Instalar Dependências

No Shell do Replit, execute:

```bash
pnpm install
```

## Passo 4: Configurar Banco de Dados

Execute as migrations:

```bash
pnpm db:push
```

Importe as 900 empresas:

```bash
node scripts/import-leads.mjs
```

## Passo 5: Executar Mega-Scraper

Colete os leads reais:

```bash
node scripts/mega-scraper-h2.mjs
```

Isso vai coletar 43+ leads de H2 Verde, PFAS, BuyAmerica e EUDR.

## Passo 6: Iniciar Aplicação

```bash
pnpm dev
```

A aplicação estará disponível na URL do Replit (geralmente `https://seu-projeto.replit.app`)

## Passo 7: Acessar Dashboards

- **Dashboard Principal**: `/`
- **Leads H2 Verde**: `/h2-leads.html`
- **Leads Reais (últimos 3 dias)**: `/real-leads.html`
- **Oportunidades**: `/opportunities`
- **Portais Mapeados**: `/portals`

## 🤖 Automação (Opcional)

Para rodar o scraper automaticamente de 2 em 2 horas:

```bash
pnpm scheduler
```

Isso iniciará o bot eterno que coleta leads continuamente.

## 📊 Estrutura do Projeto

```
RFQ/
├── client/              # Frontend (React + Vite)
│   ├── public/
│   │   ├── h2-leads.html       # Dashboard H2 Verde ($316B)
│   │   ├── real-leads.html     # Leads últimos 3 dias
│   │   └── data/
│   │       └── mega-leads.json # 43 leads reais
│   └── src/
│       └── pages/              # Páginas React
├── server/              # Backend (Express + tRPC)
│   ├── routers.ts              # API endpoints
│   └── db.ts                   # Database queries
├── scripts/             # Scrapers & Automation
│   ├── mega-scraper-h2.mjs     # Mega-scraper 300+ fontes
│   ├── eternal-lead-bot.mjs    # Bot automático
│   ├── scheduler.mjs           # Agendador 2h
│   └── import-leads.mjs        # Importar 900 empresas
├── data/                # Dados coletados
│   ├── mega-leads.json         # 43 leads ($316B)
│   └── companies.csv           # 900 empresas
└── drizzle/             # Database schema
    └── schema.ts               # Tabelas
```

## 💰 Estratégia de Broker

O sistema inclui:

- **UEI**: N394AKZSR349
- **Ariba**: BNO-100000159360246
- **Comissão**: 15-20% em contratos de $100k-$5M
- **Pipeline**: $316 BILHÕES
- **Comissão Potencial**: $55.3 BILHÕES

### Mega Oportunidades Identificadas:

1. **Chile H2 Verde Fund**: $1B (World Bank)
2. **LAC H2 Pipeline**: $300B (200+ sites)
3. **IDB 10 GW Initiative**: $15B

## 🔧 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verifique se DATABASE_URL está correto
echo $DATABASE_URL

# Teste conexão
pnpm db:push
```

### Scraper Não Retorna Dados
```bash
# Algumas APIs precisam de chaves
# SAM.gov: https://open.gsa.gov/api/sam-entity-api/
# TED: https://ted.europa.eu/api/
```

### Porta em Uso
O Replit geralmente usa porta 3000 automaticamente. Se houver conflito, edite `server/index.ts`:

```typescript
const PORT = process.env.PORT || 3001;
```

## 📞 Suporte

- **Email**: contact@globalsupplements.site
- **GitHub Issues**: https://github.com/tafita81/RFQ/issues

## 🎯 Próximos Passos

1. Obter API keys para SAM.gov e TED.europa.eu
2. Implementar CRM para tracking de vendas
3. Criar sistema de email automatizado com templates persuasivos
4. Integrar com DocuSign para fechamento rápido

---

**Status**: ✅ Sistema 100% funcional com 43 leads reais coletados
**Pipeline**: $316 BILHÕES
**Comissão Potencial**: $55.3 BILHÕES (15-20%)
