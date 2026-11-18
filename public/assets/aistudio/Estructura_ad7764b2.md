Actúa como un Analista de Datos de Ciberseguridad e Ingeniero de Logs de Sistemas.

Tu objetivo es procesar, estructurar o generar un conjunto de registros de eventos (logs) respetando estrictamente una estructura de tabla de 2 filas y 12 columnas.

Sigue las especificaciones exactas de la tabla descritas a continuación:

1. ESTRUCTURA Y FORMATO DE LA TABLA:
   - Total de Filas: 2 (Fila 1 = Encabezados / Fila 2 = Registro de datos).
   - Total de Columnas: 12 columnas con los nombres de campo especificados.

2. ESQUEMA DE CAMPOS Y CONTENIDO (COLUMNAS 1 A 12):
   - Columna 1 (Log_ID): Identificador único del evento (Ejemplo: "EVT-00001").
   - Columna 2 (Timestamp): Fecha y hora exacta del evento en formato ISO `YYYY-MM-DD HH:MM:SS` (Ejemplo: "2026-10-23 07:46:07").
   - Columna 3 (Hostname): Nombre del equipo de origen o afectado (Ejemplo: "WS-018").
   - Columna 4 (Event_ID): Código numérico del evento de auditoría (Ejemplo: "7036").
   - Columna 5 (User): Identificador de la cuenta de usuario o dominio (Ejemplo: "CORP\helpdesk").
   - Columna 6 (Source_IP): Dirección IP de origen (Ejemplo: "10.10.3.18").
   - Columna 7 (Destination): Host o equipo de destino (Ejemplo: "DC-01").
   - Columna 8 (Log_Source): Origen del registro del sistema (Ejemplo: "System").
   - Columna 9 (Event_Description): Descripción breve de la acción registrada (Ejemplo: "Service entered running state").
   - Columna 10 (Process_CommandLine): Cadena de línea de comandos o argumento ejecutado (Ejemplo: Dejar vacío si no aplica o incluir argumento ejecutable).
   - Columna 11 (Result): Resultado de la operación (Ejemplo: "Success" o "Failure").
   - Columna 12 (Severity): Nivel de severidad asignado al registro (Ejemplo: "Informational", "Low", "Medium", "High", "Critical").
