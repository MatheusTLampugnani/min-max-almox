# ==============================================================================
# VIDEPLAST - SISTEMA DE ESTOQUE MÍNIMO E MÁXIMO (ALMOXARIFADO)
# DOCKERFILE UNIFICADO PARA PRODUÇÃO (MULTI-STAGE BUILD)
# ==============================================================================

# ETAPA 1: Build do Frontend (Vite + React)
FROM node:22-alpine AS frontend-builder
WORKDIR /build/frontend

# Copia arquivos de dependência do frontend
COPY frontend/package*.json ./
RUN npm install

# Copia código-fonte e compila para produção
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# ETAPA 2: Imagem Final de Produção (Node.js Express + Frontend Estático)
# ==============================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Instala apenas as dependências de produção do backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copia o código do backend e dados da planilha MRP
COPY backend/ ./backend/

# Copia o build estático gerado na Etapa 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Define diretório de trabalho no backend
WORKDIR /app/backend

# Expõe a porta interna da aplicação
EXPOSE 3001

# Inicia o servidor unificado
CMD ["node", "server.js"]
