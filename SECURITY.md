# Política de seguridad — CortexDFIR

## Versiones soportadas

| Versión              | Soportada |
| -------------------- | --------- |
| main (última)        | ✅ Sí     |
| Versiones anteriores | ❌ No     |

## Reportar una vulnerabilidad

Si descubres un problema de seguridad en CortexDFIR, por favor no abras un issue público. Envía un reporte privado a:

**Correo:** eliasgot507@gmail.com

Incluye la siguiente información:

- Descripción clara de la vulnerabilidad
- Pasos para reproducirla
- Impacto potencial
- Versión del repositorio afectada

Nos comprometemos a:

- Confirmar recepción en un plazo de 5 días hábiles
- Mantenerte informado del progreso hasta la resolución
- Publicar un agradecimiento si lo deseas (coordinado previamente)

## Alcance

Este repositorio incluye:

- Servidor Express (`server.ts`)
- Frontend React/Vite (`src/`)
- Contenedor Docker (`Dockerfile`)

Fuera de alcance:

- Infraestructura de despliegue propia (Cloud Run, AWS, Azure, etc.)
- Claves API de Google Gemini gestionadas por el usuario

## Buenas prácticas para el despliegue

1. **Nunca subas `.env` a Git.** El archivo `.env` está en `.gitignore` y contiene tu `GEMINI_API_KEY`.
2. **Usa variables de entorno o Secret Manager** en producción para la clave de Gemini.
3. **No despliegues sin autenticación.** Las rutas `/api/gemini/*` deben protegerse (IAP, OAuth, IAM, etc.).
4. **No uses `--allow-unauthenticated`** en Cloud Run salvo que el servicio sea explícitamente público.
5. **Mantén las dependencias actualizadas.** Ejecuta `npm ci` y `npm audit` con regularidad.
6. **Protege la rama principal** (`main`) con revisiones y CI verde antes de hacer merge.

## Dependencias

Esta aplicación utiliza, entre otras:

- `express` — servidor web
- `helmet` — cabeceras de seguridad
- `@google/genai` — cliente de Google Gemini (opcional)
- `xlsx` — procesamiento de archivos Excel

## Créditos

Gracias por ayudar a mantener CortexDFIR seguro.
