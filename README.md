# Videplast - Sistema de Gestão de Estoque Mínimo e Máximo (MRP)

Sistema corporativo de alto desempenho desenvolvido para o **Almoxarifado Central** e a **Supervisão Fabril** da Videplast, focado na governança de parâmetros de estoque mínimo e máximo, análise de distorções MRP, prevenção de rupturas e excessos de materiais, além de histórico para decisões estratégicas da diretoria.

---

## 📌 Visão Geral

O sistema conecta o catálogo operacional do almoxarifado aos dados extraídos diretamente do SAP (relatórios de MRP e estoque MB52), permitindo:
- **Monitoramento contínuo** de mais de 1.600 itens industriais.
- **Identificação imediata de riscos**: cálculo automático de materiais abaixo do mínimo (risco de parada fabril) e acima do máximo (capital parado em estoque).
- **Alinhamento entre MRP e Parâmetros Reais**: análise comparativa entre as sugestões do cálculo MRP e os parâmetros cadastrados no SAP.
- **Histórico perpétuo de movimentações e alterações**: trilha de auditoria completa para reuniões anuais de diretoria.
- **Fluxo de solicitações e aprovações**: supervisores setoriais solicitam ajustes justificadamente, e a equipe de almoxarifado valida e aplica as alterações.

---

## 🚀 Principais Funcionalidades

### 1. Consulta Rápida de Estoque
- Busca instantânea por **Código SAP**, **Nome do Material** ou **Endereço/Localização Física** (rua, prateleira).
- Indicador visual da situação de estoque: **Abaixo do Mínimo**, **Conforme** ou **Acima do Máximo**.
- Cálculo em tempo real de **dias de cobertura** baseado no giro e saídas dos materiais.
- Visualização por cards industriais em telas móveis e tabela estruturada em desktop.

### 2. Importação e Sincronização de Planilhas do SAP
- Leitura automatizada de planilhas exportadas do SAP (`.xlsx`, `.xls` e `.csv`), incluindo arquivos com múltiplas abas (`MRP`, `MB52`).
- Avaliação de fórmulas do Excel (consumo médio, médias ponderadas, saldos e sugestões MRP).
- Resolução e enriquecimento automático dos **Grupos de Mercadorias / Categorias Industriais** oficiais da fábrica (ex: `04.02.007 - PARAFUSOS/PORCAS/ARRUELAS`).
- Gravação automática em lote com tolerância a duplicações e registro automático no log permanente de importações.

### 3. Análise de Distorção MRP
- Tela analítica dedicada a comparar a **Sugestão do MRP** com o **Estoque Máximo Atual**.
- Filtros rápidos por:
  - **Distorcidos** (materiais acima e abaixo de 0).
  - **Acima de Zero** (sugestão MRP superior ao cadastrado).
  - **Abaixo de Zero** (sugestão MRP inferior ao cadastrado).
  - **Alinhados** (parâmetros já calibrados).
- Ajuste rápido de Mínimo e Máximo com um clique para alinhamento imediato.

### 4. Fluxo de Solicitações de Ajuste (Governança)
- Supervisores podem solicitar alteração de Mín/Máx anexando o setor fabril demandante e a devida justificativa operacional.
- O Almoxarifado Central possui visão consolidada de pendências, podendo **Aprovar**, **Recusar** ou **Ajustar** com atualização instantânea do catálogo.

### 5. Histórico e Trilha de Auditoria (Análise da Diretoria)
- Registro cronológico de todas as alterações manuais e importações em lote do SAP.
- Preserva valores anteriores, novos valores, usuário responsável, data/hora e justificativa.
- Permite que a diretoria e os gestores auditem o comportamento e a evolução do almoxarifado ao longo dos anos.

### 6. Dashboard Executivo & KPIs
- Total de materiais monitorados e percentual em risco de ruptura.
- Indicador de cobertura crítica (< 30 dias).
- Solicitações pendentes aguardando despacho.
- Gráfico dinâmico de **Distribuição por Categorias Industriais**:
  - Modos **Top 10**, **Top 15** e **Todas as Categorias (Lista completa)** com breakdown de situação (críticos, conformes e excesso).
- Ranking dos **Top Materiais de Maior Consumo Médio Mensal** da fábrica.

---

## 👥 Perfis de Acesso

| Perfil | Permissões |
| :--- | :--- |
| **Supervisor** | Consulta de estoque, visualização de detalhes, cálculo de distorção MRP e abertura/acompanhamento de solicitações de alteração de estoque mínimo e máximo. |
| **Almoxarifado** | Acesso completo à plataforma: aprovação/rejeição de solicitações, alteração direta de parâmetros Mín/Máx, importação de planilhas do SAP, Dashboard gerencial e histórico completo de auditoria. |

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + **Vite** (build e hot reload veloz)
- **Tailwind CSS** (design corporativo sob medida com identidade visual Videplast)
- **Lucide React** (ícones consistentes e modernos)
- **Recharts** (gráficos interativos e responsivos)
- **SheetJS (XLSX)** (processamento e parsing client-side de planilhas do SAP)
- **Axios** (cliente HTTP com interceptor automático de perfis)

### Backend
- **Node.js** (ES Modules)
- **Express.js** (arquitetura modular em camadas: Rotas, Serviços, Repositórios e Schemas)
- **Zod** (validação estrita de contratos de entrada)
- **Supabase / PostgreSQL** (banco de dados com Row Level Security e transações seguras)

---

## ⚙️ Configuração e Execução Local

### Pré-requisitos
- **Node.js** v18+ instalado
- **Git** instalado

### 1. Clonar o Repositório
```bash
git clone https://github.com/MatheusTLampugnani/min-max-almox.git
cd min-max-almox
```

### 2. Configurar Variáveis de Ambiente
No diretório `backend/`, crie o arquivo `.env` a partir do modelo `.env.example`:
```bash
cp backend/.env.example backend/.env
```

Preencha as variáveis de ambiente necessárias em `backend/.env`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
DATA_SOURCE=supabase
PORT=3001
```

> **Nota de Segurança**: Arquivos `.env` e planilhas reais da fábrica são ignorados pelo `.gitignore` e nunca devem ser versionados.

### 3. Instalar Dependências
Você pode instalar as dependências de todo o projeto com um único comando na raiz:
```bash
npm run install:all
```

Ou individualmente em cada pasta:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 4. Executar em Modo de Desenvolvimento
Na pasta raiz, execute:
```bash
npm run dev
```
Este comando inicializa simultaneamente:
- **Backend API**: `http://localhost:3001`
- **Frontend App**: `http://localhost:5173`

---

## 🐳 Execução via Docker / Docker Compose

O projeto conta com arquivo `docker-compose.yml` e `Dockerfile` multi-stage para deploy em servidor corporativo:

```bash
docker-compose up -d --build
```
A aplicação estará disponível na porta configurada (`http://localhost:3001` ou IP do servidor).

---

## 📂 Estrutura do Projeto

```text
projeto-max-alm/
├── backend/
│   ├── modules/
│   │   ├── auth/              # Papéis, middleware e matriz de permissões
│   │   ├── dashboard/         # Métricas analíticas e consolidação de KPIs
│   │   ├── historico/         # Auditoria perpétua e logs de importação
│   │   ├── itens/             # Materiais, regras Mín/Máx, reposição e categorias SAP
│   │   ├── setores/           # Setores e centros de custo da fábrica
│   │   └── solicitacoes/      # Fluxo de governança (pendentes, aprovadas, recusadas)
│   ├── routes/                # Definição das rotas REST
│   ├── lib/                   # Clientes de banco (Supabase)
│   ├── app.js                 # Configuração Express e middlewares
│   └── server.js              # Ponto de entrada do servidor
│
├── frontend/
│   ├── public/                # Favicon e logotipo oficial Videplast
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis (UI, Layout, Modais, Tabelas)
│   │   ├── modules/
│   │   │   ├── auth/          # Contexto de autenticação e perfis
│   │   │   ├── dashboard/     # Painel gerencial, gráficos e cards de KPIs
│   │   │   ├── historico/     # Visualizador de trilha de auditoria
│   │   │   ├── itens/         # Consulta, Análise de Distorção e Importador de Planilhas
│   │   │   └── solicitacoes/  # Gestão e aprovação de solicitações
│   │   └── lib/               # Instância do Axios e formatadores monetários/numéricos
│   ├── tailwind.config.js     # Paleta de cores oficial da Videplast
│   └── vite.config.js         # Configuração de build e proxy reverso
│
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🏢 Videplast

*Desenvolvido para otimização da cadeia de suprimentos e almoxarifado industrial.*
