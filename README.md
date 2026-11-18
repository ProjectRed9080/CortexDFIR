# 🛡️ CortexDFIR Agent - Plataforma de Inteligencia Forense para Informáticos

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **CortexDFIR Agent** es una plataforma integral de ciberseguridad y respuesta a incidentes digitales (DFIR/SOC) diseñada para analizar archivos de logs SIEM en formato **Excel (.xlsx/.xls) o CSV**, detectar técnicas de ataque según el framework **MITRE ATT&CK** y generar **dictámenes periciales técnicos y ejecutivos**, con soporte para IA generativa (Google Gemini) o motor de reglas local totalmente autónomo.

---

## 📋 Tabla de Contenidos

- [🚀 Características principales](#-características-principales)
- [🏗️ Arquitectura del sistema](#️-arquitectura-del-sistema)
- [📊 Esquema de datos (12 columnas)](#-esquema-de-datos-12-columnas)
- [🛠️ Tecnologías utilizadas](#-tecnologías-utilizadas)
- [📦 Requisitos previos](#-requisitos-previos)
- [⚡ Instalación y ejecución local](#-instalación-y-ejecución-local)
- [⚙️ Variables de entorno](#-variables-de-entorno)
- [💡 Uso de la plataforma](#-uso-de-la-plataforma)
- [🌐 API REST](#-api-rest)
- [☁️ Despliegue](#-despliegue)
- [📁 Estructura del proyecto](#-estructura-del-proyecto)
- [🔐 Seguridad](#-seguridad)
- [🤝 Contribuciones](#-contribuciones)
- [📄 Licencia](#-licencia)
- [📬 Contacto](#-contacto)

---

## 🚀 Características principales

| Característica | Descripción |
|----------------|-------------|
| **Ingestión de logs SIEM** | Carga archivos Excel o CSV con registros de auditoría de Windows (Security, System, Sysmon, PowerShell, etc.). |
| **Mapeo automático de columnas** | Detección heurística de encabezados y asignación al esquema forense estándar de 12 columnas. |
| **Motor de correlación determinista** | Reglas de detección sin dependencia de IA: fuerza bruta, inicios sospechosos, escalamiento de privilegios, comandos LOLBAS, movimiento lateral, borrado de logs y persistencia. |
| **Mapeo MITRE ATT&CK** | Cada alerta se asocia a tácticas y técnicas (ej. T1110 Brute Force, T1078 Valid Accounts, T1021 Lateral Movement, T1070.001 Clear Windows Event Logs). |
| **Dictamen pericial con IA** | Generación de informe técnico y ejecutivo usando Google Gemini (opcional). Si no hay API key, funciona 100% local con motor de reglas. |
| **Asistente forense interactivo** | Chat para consultar los registros y recibir respuestas fundamentadas en las filas de evidencia. |
| **Exportación a PDF** | Descarga del informe pericial listo para presentar en procesos legales o auditorías. |
| **Interfaz SOC / DFIR** | Dashboard con KPIs, puntuación de riesgo (0-100), línea de tiempo, hallazgos y modo oscuro optimizado para monitoreo continuo. |
| **Despliegue flexible** | Docker multi-etapa, listo para Google Cloud Run, Render, Railway, Fly.io o VPS con PM2 + Nginx. |

---

## 🏗️ Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (React + Vite)                   │
│  Dashboard • Hallazgos • Timeline • Registros Crudos        │
│  Informe Técnico • Asistente Forense • Exportar PDF         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVIDOR (Node.js + Express)                │
│  • excelParser.ts    → Lectura y mapeo de archivos Excel    │
│  • correlationEngine.ts → Motor de reglas determinista      │
│  • forensicReasoner.ts → Dictamen pericial local            │
│  • pdfExporter.ts    → Generación de informes PDF           │
│  • Rutas API         → /api/gemini/analyze-incident         │
│                      → /api/gemini/forensic-chat            │
│                      → /api/health                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌───────────────────┐         ┌─────────────────────┐
    │  Google Gemini IA │         │ Motor DFIR Local    │
    │  (opcional, vía   │         │ (determinista,      │
    │   GEMINI_API_KEY) │         │  sin coste externo) │
    └───────────────────┘         └─────────────────────┘
```

---

## 📊 Esquema de datos (12 columnas)

Los archivos de logs deben respetar la siguiente estructura forense:

| # | Columna | Descripción | Ejemplo |
|---|---------|-------------|---------|
| 1 | `Log_ID` | Identificador único del evento | `EVT-00001` |
| 2 | `Timestamp` | Fecha y hora ISO | `2026-10-23 07:46:07` |
| 3 | `Hostname` | Nombre del equipo | `WS-018` |
| 4 | `Event_ID` | Código de evento de auditoría | `4624`, `4625`, `1102` |
| 5 | `User` | Usuario o cuenta de dominio | `CORP\helpdesk` |
| 6 | `Source_IP` | IP de origen | `10.10.3.18` |
| 7 | `Destination` | Host o equipo de destino | `DC-01` |
| 8 | `Log_Source` | Origen del registro | `System`, `Security` |
| 9 | `Event_Description` | Descripción de la acción | `Logon attempt` |
| 10 | `Process_CommandLine` | Línea de comandos ejecutada | `certutil.exe -urlcache...` |
| 11 | `Result` | Resultado de la operación | `Success`, `Failure` |
| 12 | `Severity` | Nivel de severidad | `Informational`, `Low`, `Medium`, `High`, `Critical` |

> El sistema incluye un generador de plantilla Excel (`Descargar plantilla`) y un dataset de muestra (`Incidente_APT_MultiEtapa.xlsx`) para probar sin datos reales.

---

## 🛠️ Tecnologías utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion
- **Backend:** Node.js, Express
- **Procesamiento de archivos:** SheetJS (`xlsx`)
- **Exportación de informes:** jsPDF
- **IA opcional:** Google Gemini (`@google/genai`)
- **Despliegue:** Docker, Google Cloud Run, Render, Railway, PM2 + Nginx

---

## 📦 Requisitos previos

- [Node.js](https://nodejs.org/) v20 o v22+
- [npm](https://www.npmjs.com/) o [bun](https://bun.sh/)
- Git (para clonar el repositorio)
- (Opcional) Clave de API de [Google AI Studio](https://aistudio.google.com/) para activar análisis con Gemini

---

## ⚡ Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU-USUARIO/cortexdfir-agent.git
cd cortexdfir-agent

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y agrega tu GEMINI_API_KEY si deseas usar IA (opcional)

# 4. Iniciar en modo desarrollo
npm run dev
# Acceder a http://localhost:3000
```

### Compilar para producción

```bash
npm run build
npm start
# El servidor escuchará en http://localhost:3000 (o el puerto definido en PORT)
```

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz basado en `.env.example`:

| Variable | Requerido | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `GEMINI_API_KEY` | Opcional | Clave de Google Gemini. Si se omite, el sistema usa el motor local determinista. | `AIzaSy...` |
| `PORT` | Opcional | Puerto HTTP del servidor | `3000` |
| `NODE_ENV` | Recomendado | `production` en despliegues | `production` |
| `APP_URL` | Opcional | URL pública del servicio | `https://tu-dominio.com` |

> ⚠️ **Nunca subas tu `.env` real a GitHub.** El archivo ya está en `.gitignore`. Solo comparte el `.env.example`.

---

## 💡 Uso de la plataforma

1. **Subir archivo:** Arrastra o selecciona un archivo Excel/CSV con tus logs SIEM.
2. **Revisar Dashboard:** Visualiza KPIs, puntuación de riesgo y alertas detectadas por categoría.
3. **Explorar Hallazgos:** Filtra por tipo de amenaza (fuerza bruta, movimiento lateral, borrado de logs, etc.) e inspecciona cada registro.
4. **Línea de Tiempo:** Observa la cronología del incidente detectada por el motor de correlación.
5. **Generar Informe:** Haz clic en "Generar Informe Técnico" para obtener el dictamen pericial (con IA si está configurada, o con motor local).
6. **Asistente Forense:** Plantea preguntas sobre los registros en el chat y recibe respuestas con citas de filas de evidencia.
7. **Exportar PDF:** Descarga el informe listo para entregar.

---

## 🌐 API REST

### `GET /api/health`
Estado del servicio y modo de ejecución (IA en la nube o motor local).

```json
{
  "status": "ok",
  "hasAiKey": true,
  "mode": "gemini_cloud"
}
```

### `POST /api/gemini/analyze-incident`
Genera el informe pericial completo a partir de los logs analizados.

**Cuerpo:**
```json
{
  "incidentsSummary": { ... },
  "criticalEventsSample": [ ... ],
  "metadata": { "fileName": "...", "totalRows": 120, "timeRange": "..." }
}
```

### `POST /api/gemini/forensic-chat`
Asistente interactivo para consultar los registros.

**Cuerpo:**
```json
{
  "query": "¿Qué direcciones IP intentaron acceder al sistema?",
  "contextSummary": { ... },
  "recentLogs": [ ... ]
}
```

---

## ☁️ Despliegue

### Con Docker (recomendado)

```bash
docker build -t cortexdfir-agent .
docker run -d -p 3000:3000 -e GEMINI_API_KEY="tu_clave" --name cortexdfir cortexdfir-agent
```

### Google Cloud Run

```bash
gcloud run deploy cortexdfir-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="tu_clave"
```

### Render / Railway / Fly.io

- **Build:** `npm install && npm run build`
- **Start:** `npm start`
- Variables: `NODE_ENV=production`, `GEMINI_API_KEY`, `PORT` (automático)

---

## 📁 Estructura del proyecto

```
cortexdfir-agent/
├── src/
│   ├── components/          # Componentes React (Dashboard, Tabs, Modales, etc.)
│   ├── services/            # Lógica de negocio (parser, correlación, IA, PDF)
│   ├── types/siem.ts        # Tipos TypeScript del esquema SIEM
│   ├── utils/               # Utilidades de formateo
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada React
├── server.ts                # Servidor Express y rutas API
├── index.html               # Punto de entrada HTML
├── vite.config.ts           # Configuración de Vite
├── tsconfig.json            # Configuración de TypeScript
├── Dockerfile               # Imagen Docker multi-etapa
├── .env.example             # Plantilla de variables de entorno
├── .gitignore               # Archivos ignorados por Git
├── package.json             # Dependencias y scripts
└── README.md                # Documentación (este archivo)
```

---

## 🔐 Seguridad

- El archivo `.env` con claves de API está ignorado por Git (`.gitignore`).
- El sistema funciona de forma autónoma sin clave de Gemini usando el motor pericial local.
- No se envían datos sensibles a terceros a menos que configurés `GEMINI_API_KEY`.
- Se recomienda usar HTTPS y autenticación en entornos de producción.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Haz un **fork** del repositorio.
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus cambios y commit: `git commit -m "feat: descripción"`
4. Sube la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📬 Contacto

**Autor:** Elias  
📧 elias.gordillo@utp.ac.pa  
🔗 [Tu perfil de GitHub](https://github.com/TU-USUARIO)  
💼 https://www.linkedin.com/in/elias-gordillo/

---

*Hecho con ❤️ para la comunidad de ciberseguridad y respuesta a incidentes (DFIR).*
