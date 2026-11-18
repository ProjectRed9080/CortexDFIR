# Etapa 1: Construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar frontend (Vite) y servidor (esbuild)
RUN npm run build

# Etapa 2: Imagen de producción ligera
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiesto e instalar únicamente dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copiar los artefactos compilados desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Exponer el puerto
EXPOSE 3000

# Usuario sin privilegios por seguridad
USER node

# Comando de inicio
CMD ["node", "dist/server.js"]

