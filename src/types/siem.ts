/**
 * Tipos para la plataforma SIEM y análisis forense de incidentes
 */

export type AlertSeverity = 'critico' | 'alto' | 'medio' | 'bajo';

export type AlertCategory =
  | 'fuerza_bruta'
  | 'inicios_sospechosos'
  | 'escalamiento'
  | 'comandos_procesos'
  | 'movimiento_lateral'
  | 'otras_anomalias';

export interface RawLogEntry {
  rowId: number;
  logId?: string; // Columna 1: Log_ID (Ej: "EVT-00001")
  timestamp: string; // Columna 2: Timestamp ISO YYYY-MM-DD HH:MM:SS (Ej: "2026-10-23 07:46:07")
  hostname?: string; // Columna 3: Hostname (Ej: "WS-018")
  eventId?: string | number; // Columna 4: Event_ID (Ej: "7036")
  user?: string; // Columna 5: User (Ej: "CORP\helpdesk")
  sourceIp?: string; // Columna 6: Source_IP (Ej: "10.10.3.18")
  destination?: string; // Columna 7: Destination (Ej: "DC-01")
  logSource?: string; // Columna 8: Log_Source (Ej: "System", "Security")
  eventDescription?: string; // Columna 9: Event_Description (Ej: "Service entered running state")
  processCommandLine?: string; // Columna 10: Process_CommandLine (Ej: "certutil.exe ...")
  result?: string; // Columna 11: Result ("Success" o "Failure")
  severityRaw?: string; // Columna 12: Severity ("Informational", "Low", "Medium", "High", "Critical")

  // Aliases y campos calculados para compatibilidad total
  host?: string; // Alias de hostname
  destinationIp?: string; // Alias de destination
  processOrCommand?: string; // Alias de processCommandLine
  action?: string; // Alias de eventDescription
  status?: string; // Alias de result
  details?: string; // Alias de eventDescription
  timestampParsed?: Date | null;
  rawData?: Record<string, any>;
  detectedAlerts?: AlertCategory[];
  severity?: AlertSeverity;
}

export interface SecurityAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  description: string;
  technicalJustification: string;
  rowIds: number[];
  firstSeen: string;
  lastSeen: string;
  entities: {
    users?: string[];
    sourceIps?: string[];
    destinationIps?: string[];
    hosts?: string[];
    commands?: string[];
  };
  mitreTactic?: string;
  mitreTechniqueId?: string;
  mitreTechniqueName?: string;
}

export interface ColumnMapping {
  logId?: string; // Columna 1: Log_ID
  timestamp: string; // Columna 2: Timestamp
  hostname?: string; // Columna 3: Hostname
  eventId?: string; // Columna 4: Event_ID
  user?: string; // Columna 5: User
  sourceIp?: string; // Columna 6: Source_IP
  destination?: string; // Columna 7: Destination
  logSource?: string; // Columna 8: Log_Source
  eventDescription?: string; // Columna 9: Event_Description
  processCommandLine?: string; // Columna 10: Process_CommandLine
  result?: string; // Columna 11: Result
  severity?: string; // Columna 12: Severity

  // Aliases para retrocompatibilidad
  host?: string;
  destinationIp?: string;
  processOrCommand?: string;
  action?: string;
  status?: string;
  details?: string;
}

export interface ChronologyItem {
  phase: string;
  timestamp: string;
  evidenceRows: string;
  description: string;
  impact: string;
}

export interface MaliciousCommand {
  command: string;
  host: string;
  user: string;
  sourceRow: string;
  riskAssessment: string;
}

export interface MitreTacticItem {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  evidence: string;
}

export interface IncidentReport {
  executiveSummary: string;
  riskLevel: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
  riskJustification: string;
  rootCause: string;
  chronology: ChronologyItem[];
  compromisedEntities: {
    users: string[];
    sourceIps: string[];
    targetedHosts: string[];
  };
  maliciousCommandsObserved: MaliciousCommand[];
  mitreTactics: MitreTacticItem[];
  containmentAndRemediation: {
    immediateActions: string[];
    eradicationSteps: string[];
    recoveryAndHardening: string[];
  };
  verdict: string;
  analyzedAt: string;
  modelUsed?: string;
}

export interface SIEMAnalysisState {
  fileName: string;
  totalLogs: number;
  rawLogs: RawLogEntry[];
  alerts: SecurityAlert[];
  overallRisk: AlertSeverity;
  riskScore: number; // 0 - 100
  startTime?: string;
  endTime?: string;
  compromisedUsers: string[];
  attackerIps: string[];
  affectedHosts: string[];
  categoriesCount: Record<AlertCategory, number>;
  severityCount: Record<AlertSeverity, number>;
  report?: IncidentReport;
  isAiAnalyzing: boolean;
}
