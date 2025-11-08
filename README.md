# Leads Dashboard - Web Scraping Platform

Plataforma completa de web scraping para coletar e gerenciar leads de 900+ empresas globais.

## 🎯 Funcionalidades

### ✅ Implementadas
- **Dashboard de Leads**: Visualização completa com tabela interativa
- **Filtros Avançados**: Por país, área de foco, vendor portals, sistemas RFQ
- **Busca em Tempo Real**: Busque empresas por nome ou URL
- **Exportação CSV**: Exporte dados filtrados para planilha
- **Estatísticas**: Cards com métricas principais (total, emails, portais)
- **Web Scraping**: Script automatizado para coletar dados reais
- **Banco de Dados**: MySQL com 900 empresas importadas, 50 já com dados coletados

### 📊 Dados Coletados
- Emails de contato
- Números de telefone
- Páginas de contato
- Portais de vendor/fornecedor
- Sistemas de RFQ/licitação
- Status HTTP dos sites
- Última verificação

## 🚀 Como Usar

### Visualizar Leads
1. Acesse a página inicial
2. Clique em "View Leads Dashboard"
3. Use os filtros e busca para encontrar leads específicos
4. Clique em "Export CSV" para baixar os dados

### Executar Web Scraping

Para coletar dados de mais empresas:

```bash
cd /home/ubuntu/leads-dashboard
node scripts/scrape-leads.mjs
```

O script processa 50 empresas por vez (5 em paralelo). Para processar todas as 900 empresas, execute o script múltiplas vezes.

### Importar Novas Empresas

Se você tiver um novo arquivo CSV com empresas:

```bash
# Coloque o CSV em /home/ubuntu/leads-scraper/companies.csv
node scripts/import-leads.mjs
```

## 📁 Estrutura do Projeto

```
leads-dashboard/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   └── Leads.tsx         # Dashboard principal
│   └── components/ui/        # Componentes UI (shadcn)
├── server/
│   ├── routers.ts            # API tRPC
│   └── db.ts                 # Queries do banco
├── drizzle/
│   └── schema.ts             # Schema do banco
└── scripts/
    ├── import-leads.mjs      # Importar empresas do CSV
    └── scrape-leads.mjs      # Web scraping automatizado
```

## 🗄️ Banco de Dados

### Tabela `leads`
- `companyId` - ID único da empresa
- `companyName` - Nome da empresa
- `url` - Website
- `country` - País
- `focus` - Área de foco (PFAS/EPR, BuyAmerica, EUDR, etc.)
- `emails` - Array de emails (JSON)
- `phones` - Array de telefones (JSON)
- `contactPages` - URLs de páginas de contato
- `vendorPages` - URLs de portais de vendor
- `rfqPages` - URLs de sistemas RFQ
- `hasVendorPortal` - Booleano
- `hasRfqSystem` - Booleano
- `statusCode` - Status HTTP da última verificação
- `lastChecked` - Data da última verificação
- `notes` - Observações

## 🎨 Design

- **Tema**: Light com gradientes suaves (blue/purple)
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Ícones**: Lucide React
- **Responsivo**: Mobile-first design

## 🔧 Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + tRPC 11
- **Banco**: MySQL + Drizzle ORM
- **Scraping**: Node.js Fetch API
- **UI**: shadcn/ui + Tailwind CSS 4

## 📝 Próximos Passos

Para adicionar mais funcionalidades:
1. Agendamento automático de scraping
2. Página de detalhes de cada lead
3. Sistema de notificações para novos leads
4. Integração com CRM
5. API pública para acesso aos dados

## 🚀 Deploy

Para publicar o site:
1. Clique no botão "Publish" no Management UI
2. Seu site estará disponível em `https://seu-dominio.manus.space`

## 📞 Suporte

Para adicionar funcionalidades ou fazer alterações, converse com o Manus AI.
