# Auditoría de seguridad — CortexDFIR

**Repositorio:** [ProjectRed9080/CortexDFIR](https://github.com/ProjectRed9080/CortexDFIR)  
**Fecha:** 2026-11-18  
**Alcance:** revisión estática del código y configuración visibles en la rama predeterminada.  
**Evaluación general:** **Medio–Alto**, especialmente si la aplicación se despliega públicamente.

> Esta revisión no incluyó pruebas dinámicas, escaneo ejecutable de dependencias, revisión del entorno de despliegue ni verificación de la configuración real de GitHub. Los hallazgos son observaciones del código/documentación y deben validarse en el entorno concreto antes de tratarlos como incidentes confirmados.

## Resumen ejecutivo

La aplicación incluye algunas medidas útiles: excluye `.env` de Git, conserva la clave de Gemini en el servidor, permite el procesamiento local y ejecuta el contenedor como usuario sin privilegios. Sin embargo, la documentación recomienda un despliegue público sin autenticación, las rutas de análisis aceptan solicitudes sin verificar identidad y no se observan límites de tasa.

También existe un problema de integridad especialmente importante para una herramienta forense: si Gemini no está disponible, el servidor puede responder con un informe predeterminado que contiene incidentes, IPs, cuentas y comandos concretos, en lugar de derivar todos los hechos de la evidencia recibida. Además, cuando Gemini está habilitado, los registros se envían a un proveedor externo.

## Hallazgos

### 1. Alta — Endpoints sin autenticación y ejemplo de despliegue público

Las rutas de análisis y chat no comprueban identidad ni autorización. La guía de despliegue de Cloud Run incluye `--allow-unauthenticated`.

- [Rutas API en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L86-L87)
- [Ruta de chat en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L326-L327)
- [Ejemplo Cloud Run en `README.md`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/README.md#L252-L260)

**Impacto potencial:** uso no autorizado, consumo de cuota de Gemini, procesamiento de datos ajenos y denegación de servicio.

**Recomendación:** exigir autenticación y autorización (por ejemplo, IAP/OAuth o un mecanismo adecuado para el entorno), limitar acceso de red y no usar `--allow-unauthenticated` salvo que el servicio esté diseñado explícitamente para ser público.

### 2. Alta — Informe local predeterminado con hechos no derivados de la evidencia

Cuando no se obtiene un informe de Gemini, el código asigna un objeto predeterminado con datos específicos de un incidente: IPs, usuarios, hosts, comandos y acciones. Esos datos no están necesariamente vinculados a los registros de la solicitud actual.

- [Fallback del informe en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L190-L204)
- [Entidades, comandos y recomendaciones predeterminados en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L242-L314)

**Impacto:** puede producir atribuciones falsas y comprometer la integridad del análisis pericial o de un informe presentado como evidencia.

**Recomendación:** generar resultados únicamente a partir de datos validados de la solicitud y de reglas reproducibles; cuando la evidencia sea insuficiente, indicar “indeterminado” o devolver un error explícito. No rellenar entidades o acciones con ejemplos concretos.

### 3. Alta — Envío de registros forenses a Gemini

Con una clave configurada, se incorporan hasta 80 eventos al prompt de análisis y al contexto del chat. Esos eventos pueden contener nombres de usuario, direcciones IP, nombres de equipos, comandos u otros datos sensibles.

- [Construcción del prompt de análisis en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L161-L172)
- [Contexto del chat en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L344-L355)
- [Solicitud desde el cliente en `App.tsx`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/src/App.tsx#L92-L109)

**Recomendación:** informar claramente al usuario antes de transferir datos, obtener consentimiento, minimizar o anonimizar datos, ofrecer un modo local y documentar las condiciones de tratamiento y retención del proveedor.

### 4. Media–Alta — Inyección de instrucciones en contenido de logs

Los campos libres de los registros se serializan dentro de prompts enviados a Gemini. Un registro manipulado podría incluir instrucciones para intentar influir en la respuesta del modelo. No se observa aquí acceso del modelo a herramientas, pero sí riesgo de alterar o sesgar el informe y de exponer otra información presente en el mismo contexto.

**Recomendación:** tratar los logs como datos no confiables, delimitarlos con claridad, minimizar el contexto, validar campos y salidas con un esquema estricto, y probar el manejo de contenido adversarial. No confiar en instrucciones del prompt como único control.

### 5. Media–Alta — Cuerpo HTTP grande sin controles visibles de tasa o cuota

Express permite cuerpos JSON de hasta 50 MB. No se observan controles de rate limiting, cuota por usuario ni límites explícitos de filas en las rutas revisadas.

- [Configuración de `express.json` en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L10-L12)

**Impacto potencial:** consumo elevado de memoria/CPU, llamadas costosas al proveedor y degradación del servicio.

**Recomendación:** definir límites de tamaño y cantidad de eventos acordes al caso de uso, aplicar límites de tasa y cuotas, y controlar concurrencia y tiempos de procesamiento.

### 6. Media — Dependencias que requieren escaneo y actualización

`package.json` declara `xlsx` en versión `^0.18.5`, una dependencia antigua que merece revisión prioritaria, especialmente porque procesa archivos no confiables. Esta auditoría no ejecutó un escáner de dependencias ni confirma el estado efectivo del árbol resuelto en `package-lock.json`.

- [Dependencias en `package.json`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/package.json#L14-L26)

**Recomendación:** ejecutar `npm ci` y `npm audit`, revisar avisos de Dependabot y fuentes oficiales de avisos de seguridad, actualizar a una versión/distribución mantenida y fijar las resoluciones del lockfile. Añadir escaneo continuo de dependencias y contenedores.

### 7. Media — No se observan cabeceras HTTP de seguridad

En el servidor revisado no se observa configuración de Helmet ni cabeceras de seguridad equivalentes.

**Recomendación:** configurar Helmet y una política CSP compatible con la aplicación, además de políticas adecuadas para HSTS (siempre bajo HTTPS), `X-Content-Type-Options`, `Referrer-Policy` y restricciones de framing.

### 8. Media — Mensajes de error internos enviados al cliente

Las rutas de análisis y chat incluyen el mensaje de excepción en la respuesta HTTP.

- [Respuesta de error del análisis en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L317-L323)
- [Respuesta de error del chat en `server.ts`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/server.ts#L389-L395)

**Impacto potencial:** divulgación de detalles internos de implementación o de respuestas de proveedores.

**Recomendación:** devolver mensajes genéricos e identificadores de correlación; conservar detalles únicamente en registros del servidor, con controles de acceso y sin incluir secretos ni datos forenses innecesarios.

### 9. Baja–Media — Controles automatizados y política de seguridad no verificados

El árbol de archivos examinado no mostraba flujos de GitHub Actions ni una política `SECURITY.md`. La configuración de Dependabot, protección de rama y escaneo de secretos no pudo verificarse con las consultas disponibles, por lo que su ausencia no se afirma como confirmada.

**Recomendación:** añadir una política de reporte de vulnerabilidades, CI para lint/pruebas y análisis de dependencias, CodeQL o análisis equivalente, escaneo de secretos y protección de la rama principal.

## Controles positivos observados

- [`.gitignore` excluye `.env` y permite `.env.example`](https://github.com/ProjectRed9080/CortexDFIR/blob/main/.gitignore#L1-L8).
- La clave de Gemini se lee del entorno del servidor; no se observó su inclusión en el frontend examinado.
- La aplicación puede operar sin Gemini mediante lógica local.
- El contenedor final configura `NODE_ENV=production` y ejecuta con el usuario `node`.
- El contenido del chat se representa como texto en React; en los componentes revisados no se observó `dangerouslySetInnerHTML`.

## Plan recomendado

### Antes de desplegar públicamente

1. Incorporar autenticación y autorización en todas las rutas API y retirar el despliegue anónimo de la guía.
2. Sustituir el informe predeterminado por resultados sustentados exclusivamente por evidencia verificable.
3. Establecer controles de tamaño, filas, concurrencia, rate limiting y cuotas.
4. Revisar y actualizar `xlsx` y el resto de dependencias con un escaneo reproducible.
5. Añadir cabeceras de seguridad y manejo de errores sin filtración de detalles.
6. Documentar la transferencia de datos a Gemini e implementar consentimiento y minimización.

### Para mejorar la garantía de seguridad

- Añadir pruebas que demuestren que ningún hallazgo puede aparecer sin evidencia de origen.
- Añadir pruebas de validación de entradas grandes, malformadas y adversariales.
- Habilitar Dependabot, escaneo de secretos, análisis estático y escaneo de imágenes de contenedor.
- Proteger la rama principal y requerir CI satisfactorio antes de integrar cambios.
- Revisar la configuración real de Cloud Run, HTTPS, logs, retención y permisos de servicio.

## Limitaciones

Esta es una revisión estática de los archivos visibles del repositorio. No equivale a una auditoría de cumplimiento, pentest ni análisis forense del entorno de producción. Las vulnerabilidades de dependencias, configuración de GitHub y controles de despliegue deben confirmarse con escaneos y acceso a sus configuraciones efectivas.
