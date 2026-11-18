# CortexDFIR Agent - Plataforma de Inteligencia Forense para Informáticos

Plataforma integral de ciberseguridad y análisis forense digital (DFIR). Permite la ingestión y correlación de registros de auditoría (logs de Windows/Security/Sysmon en formato Excel/CSV con esquema de 12 columnas), detección determinista de técnicas MITRE ATT&CK y emisión de dictámenes periciales mediante IA con Google Gemini o motor de reglas local autónomo.

---

## 🚀 Requisitos para Despliegue

### 1. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz (basado en [.env.example](file:///.env.example)):

| Variable | Requerido | Descripción | Ejemplo / Valor por defecto |
|---|---|---|---|
| `GEMINI_API_KEY` | Opcional | Clave de API de Google Gemini (Google AI Studio). Si no se proporciona, la plataforma funciona de forma 100% autónoma con su motor pericial local determinista. | `AIzaSy...` |
| `PORT` | Opcional | Puerto HTTP en el que escuchará el servidor. En plataformas cloud (Cloud Run, Render, Railway) se asigna automáticamente. | `3000` |
| `NODE_ENV` | Recomendado | Modo de ejecución del servidor. Debe ser `production` al desplegar. | `production` |
| `APP_URL` | Opcional | URL pública o dominio donde está publicado el servicio. | `https://tu-dominio.com` |

---

## 🛠️ Ejecución Local y Desarrollo

**Requisitos previos:** Node.js (v20 o v22+ recomendado).

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
   Acceder a `http://localhost:3000`.

---

## 📦 Opciones de Despliegue

### Opción A: Despliegue con Docker (Recomendado para Cloud Run, ECS, Coolify, VPS)

El proyecto incluye un `Dockerfile` optimizado multi-etapa listo para producción.

1. **Construir la imagen:**
   ```bash
   docker build -t cortexdfir-agent .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -d -p 3000:3000 -e GEMINI_API_KEY="tu_api_key_aqui" --name cortexdfir cortexdfir-agent
   ```

3. **Despliegue directo en Google Cloud Run:**
   ```bash
   gcloud run deploy cortexdfir-agent \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY="tu_api_key_aqui"
   ```

---

### Opción B: Plataformas PaaS (Render, Railway, Fly.io)

1. **Build Command:**
   ```bash
   npm install && npm run build
   ```
2. **Start Command:**
   ```bash
   npm start
   ```
3. **Variables de entorno en el panel:**
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Tu clave de Gemini)*
   - `PORT`: Asignado automáticamente por la plataforma.

---

### Opción C: Servidor Linux / VPS con PM2 y Nginx

1. **Compilar el proyecto:**
   ```bash
   npm install
   npm run build
   ```

2. **Iniciar con PM2:**
   ```bash
   pm2 start dist/server.js --name "cortexdfir-agent" --env production
   pm2 save
   pm2 startup
   ```

3. **Configurar Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 80;
       server_name forense.tu-empresa.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
