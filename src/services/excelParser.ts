import * as XLSX from 'xlsx';
import { ColumnMapping, RawLogEntry } from '../types/siem';
import { SAMPLE_FORENSIC_LOGS } from './sampleDataset';

export interface ParseResult {
  headers: string[];
  suggestedMapping: ColumnMapping;
  sampleRows: Record<string, any>[];
  totalRows: number;
}

/**
 * Detecta heurísticamente las mejores columnas a partir de los encabezados del Excel
 */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const findMatch = (regex: RegExp) => headers.find((h) => regex.test(h.trim()));

  return {
    logId:
      findMatch(/^(log_?id|id_?log|evt_?id|logid|id_?fila)$/i) ||
      findMatch(/^(id)$/i),
    timestamp:
      findMatch(/^(timestamp|fecha|date|time|hora|datetime|fecha_hora|datetime_utc)$/i) ||
      findMatch(/(timestamp|fecha|date)/i) ||
      headers[0] ||
      'Timestamp',
    hostname:
      findMatch(/^(hostname|host|equipo|computer|computer_?name|servidor|server|device)$/i) ||
      findMatch(/(hostname|host|equipo|servidor)/i),
    eventId:
      findMatch(/^(event_?id|id_?evento|codigo_?evento|eventid)$/i) ||
      findMatch(/(event|evento)/i),
    user:
      findMatch(/^(user|usuario|cuenta|account|username|usr|target_?user)$/i) ||
      findMatch(/(user|usuario|cuenta)/i),
    sourceIp:
      findMatch(/^(source_?ip|ip_?origen|src_?ip|ip_?fuente|ip_?src|origen_?ip)$/i) ||
      findMatch(/(source|origen|src)/i),
    destination:
      findMatch(/^(destination|destino|destination_?ip|ip_?destino|dst_?ip|ip_?dest|destino_?ip|target)$/i) ||
      findMatch(/(destination|destino|dst)/i),
    logSource:
      findMatch(/^(log_?source|origen_?registro|origen|source|logsource|canal|channel|sistema)$/i) ||
      findMatch(/(log_?source|origen)/i),
    eventDescription:
      findMatch(/^(event_?description|description|descripcion|descripción|message|mensaje|details|detalle|detalles|action|accion|acción)$/i) ||
      findMatch(/(description|descripcion|detalle|mensaje)/i),
    processCommandLine:
      findMatch(/^(process_?command_?line|command_?line|commandline|process|proceso|command|comando|cmd|image)$/i) ||
      findMatch(/(command|process|comando|proceso)/i),
    result:
      findMatch(/^(result|resultado|status|estado|success_?failure)$/i) ||
      findMatch(/(result|status|resultado|estado)/i),
    severity:
      findMatch(/^(severity|severidad|nivel|risk|prioridad|priority|level)$/i) ||
      findMatch(/(severity|severidad|riesgo|risk)/i),

    // Aliases
    host:
      findMatch(/^(hostname|host|equipo|computer|computer_?name|servidor|server|device)$/i) ||
      findMatch(/(host|equipo)/i),
    destinationIp:
      findMatch(/^(destination|destino|destination_?ip|ip_?destino|dst_?ip)$/i),
    processOrCommand:
      findMatch(/^(process_?command_?line|command_?line|process|proceso|command|comando)$/i),
    action:
      findMatch(/^(event_?description|action|accion|acción)$/i),
    status:
      findMatch(/^(result|resultado|status|estado)$/i),
    details:
      findMatch(/^(event_?description|details|detalle|description|descripcion)$/i),
  };
}

/**
 * Lee un archivo .xlsx, .xls o .csv y extrae la metadata y muestra
 */
export async function inspectExcelFile(file: File): Promise<{
  workbook: XLSX.WorkBook;
  sheetName: string;
  result: ParseResult;
  rawJsonData: Record<string, any>[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a JSON
  const rawJsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
  });

  if (!rawJsonData || rawJsonData.length === 0) {
    throw new Error('La hoja de cálculo está vacía o no contiene filas con datos válidos.');
  }

  const headers = Object.keys(rawJsonData[0] || {});
  const suggestedMapping = guessColumnMapping(headers);

  return {
    workbook,
    sheetName,
    result: {
      headers,
      suggestedMapping,
      sampleRows: rawJsonData.slice(0, 5),
      totalRows: rawJsonData.length,
    },
    rawJsonData,
  };
}

/**
 * Mapea los registros crudos del archivo a la estructura estándar de 12 columnas RawLogEntry
 */
export function convertRowsToLogEntries(
  rows: Record<string, any>[],
  mapping: ColumnMapping
): RawLogEntry[] {
  return rows.map((row, index) => {
    let rawDate = row[mapping.timestamp];
    let timestampStr = '';

    if (rawDate instanceof Date) {
      timestampStr = rawDate.toISOString().replace('T', ' ').substring(0, 19);
    } else if (typeof rawDate === 'number') {
      // Formato serial de Excel
      try {
        const dateObj = XLSX.SSF.parse_date_code(rawDate);
        if (dateObj) {
          const m = String(dateObj.m).padStart(2, '0');
          const d = String(dateObj.d).padStart(2, '0');
          const H = String(dateObj.H).padStart(2, '0');
          const M = String(dateObj.M).padStart(2, '0');
          const S = String(Math.floor(dateObj.S)).padStart(2, '0');
          timestampStr = `${dateObj.y}-${m}-${d} ${H}:${M}:${S}`;
        }
      } catch {
        timestampStr = String(rawDate);
      }
    } else {
      timestampStr = String(rawDate || '').trim();
    }

    // Si no hay fecha legible, proveer fallback ordenado
    if (!timestampStr) {
      timestampStr = `2026-10-23 07:46:${String(index).padStart(2, '0')}`;
    }

    // 1. Log_ID (Columna 1)
    const rawLogId = mapping.logId ? String(row[mapping.logId] || '').trim() : '';
    const logId = rawLogId || `EVT-${String(index + 1).padStart(5, '0')}`;

    // 3. Hostname (Columna 3)
    const hostnameVal = mapping.hostname
      ? String(row[mapping.hostname] || '').trim()
      : mapping.host
      ? String(row[mapping.host] || '').trim()
      : '';

    // 4. Event_ID (Columna 4)
    const eventIdVal = mapping.eventId ? String(row[mapping.eventId] || '').trim() : undefined;

    // 5. User (Columna 5)
    const userVal = mapping.user ? String(row[mapping.user] || '').trim() : undefined;

    // 6. Source_IP (Columna 6)
    const sourceIpVal = mapping.sourceIp ? String(row[mapping.sourceIp] || '').trim() : undefined;

    // 7. Destination (Columna 7)
    const destinationVal = mapping.destination
      ? String(row[mapping.destination] || '').trim()
      : mapping.destinationIp
      ? String(row[mapping.destinationIp] || '').trim()
      : undefined;

    // 8. Log_Source (Columna 8)
    const logSourceVal = mapping.logSource ? String(row[mapping.logSource] || '').trim() : 'System';

    // 9. Event_Description (Columna 9)
    const eventDescVal = mapping.eventDescription
      ? String(row[mapping.eventDescription] || '').trim()
      : mapping.details
      ? String(row[mapping.details] || '').trim()
      : mapping.action
      ? String(row[mapping.action] || '').trim()
      : undefined;

    // 10. Process_CommandLine (Columna 10)
    const processCmdVal = mapping.processCommandLine
      ? String(row[mapping.processCommandLine] || '').trim()
      : mapping.processOrCommand
      ? String(row[mapping.processOrCommand] || '').trim()
      : undefined;

    // 11. Result (Columna 11)
    const rawResult = mapping.result
      ? String(row[mapping.result] || '').trim()
      : mapping.status
      ? String(row[mapping.status] || '').trim()
      : 'Success';
    const resultNormalized = /fail|fallo|error|denied|incorrect/i.test(rawResult)
      ? 'Failure'
      : /alert|alerta/i.test(rawResult)
      ? 'ALERT'
      : 'Success';

    // 12. Severity (Columna 12)
    const rawSeverity = mapping.severity ? String(row[mapping.severity] || '').trim() : '';
    let parsedSeverity: 'critico' | 'alto' | 'medio' | 'bajo' = 'bajo';
    if (/crit/i.test(rawSeverity)) {
      parsedSeverity = 'critico';
    } else if (/high|alt/i.test(rawSeverity)) {
      parsedSeverity = 'alto';
    } else if (/med/i.test(rawSeverity)) {
      parsedSeverity = 'medio';
    } else {
      parsedSeverity = 'bajo';
    }

    return {
      rowId: index + 1,
      logId,
      timestamp: timestampStr,
      hostname: hostnameVal || undefined,
      eventId: eventIdVal,
      user: userVal,
      sourceIp: sourceIpVal,
      destination: destinationVal,
      logSource: logSourceVal,
      eventDescription: eventDescVal,
      processCommandLine: processCmdVal,
      result: resultNormalized,
      severityRaw: rawSeverity || (parsedSeverity === 'critico' ? 'Critical' : parsedSeverity === 'alto' ? 'High' : parsedSeverity === 'medio' ? 'Medium' : 'Informational'),
      severity: parsedSeverity,

      // Aliases para retrocompatibilidad total en UI y gráficos
      host: hostnameVal || undefined,
      destinationIp: destinationVal,
      processOrCommand: processCmdVal,
      action: eventDescVal,
      status: resultNormalized.toUpperCase(),
      details: eventDescVal,
      rawData: row,
    };
  });
}

/**
 * Genera y descarga una plantilla Excel real respetando estrictamente la estructura de 12 columnas:
 * Log_ID, Timestamp, Hostname, Event_ID, User, Source_IP, Destination, Log_Source, Event_Description, Process_CommandLine, Result, Severity
 */
export function downloadSampleExcelFile() {
  const worksheetData = SAMPLE_FORENSIC_LOGS.map((log) => ({
    Log_ID: log.logId || `EVT-${String(log.rowId).padStart(5, '0')}`,
    Timestamp: log.timestamp,
    Hostname: log.hostname || log.host || 'WS-018',
    Event_ID: log.eventId || 7036,
    User: log.user || 'CORP\\helpdesk',
    Source_IP: log.sourceIp || '10.10.3.18',
    Destination: log.destination || log.destinationIp || 'DC-01',
    Log_Source: log.logSource || 'System',
    Event_Description: log.eventDescription || log.details || log.action || 'Audit event registered',
    Process_CommandLine: log.processCommandLine || log.processOrCommand || '',
    Result: log.result || log.status || 'Success',
    Severity: log.severityRaw || (log.severity === 'critico' ? 'Critical' : log.severity === 'alto' ? 'High' : log.severity === 'medio' ? 'Medium' : 'Informational'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs_SIEM_12_Columnas');

  // Ajustar anchos de columna para visualización profesional
  worksheet['!cols'] = [
    { wch: 12 }, // Log_ID
    { wch: 21 }, // Timestamp
    { wch: 16 }, // Hostname
    { wch: 10 }, // Event_ID
    { wch: 20 }, // User
    { wch: 16 }, // Source_IP
    { wch: 16 }, // Destination
    { wch: 14 }, // Log_Source
    { wch: 42 }, // Event_Description
    { wch: 48 }, // Process_CommandLine
    { wch: 12 }, // Result
    { wch: 14 }, // Severity
  ];

  XLSX.writeFile(workbook, 'Plantilla_Logs_SIEM_12_Columnas.xlsx');
}
