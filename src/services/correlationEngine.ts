import {
  AlertCategory,
  AlertSeverity,
  RawLogEntry,
  SecurityAlert,
  SIEMAnalysisState,
} from '../types/siem';

// Lista de IPs privadas estándar RFC1918
function isPrivateIp(ip?: string): boolean {
  if (!ip) return true;
  const clean = ip.trim();
  if (clean === '127.0.0.1' || clean === 'localhost' || clean === '::1') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  return false;
}

// Analizador determinista de correlación forense
export function analyzeLogsDeterministically(
  logs: RawLogEntry[],
  fileName = 'dataset.xlsx'
): SIEMAnalysisState {
  const alerts: SecurityAlert[] = [];
  const categorizedLogMap = new Map<number, { alerts: AlertCategory[]; severity: AlertSeverity }>();

  function registerLogAlert(rowId: number, category: AlertCategory, severity: AlertSeverity) {
    const existing = categorizedLogMap.get(rowId) || { alerts: [], severity: 'bajo' };
    if (!existing.alerts.includes(category)) {
      existing.alerts.push(category);
    }
    // Prioridad de severidad
    const order: Record<AlertSeverity, number> = { critico: 4, alto: 3, medio: 2, bajo: 1 };
    if (order[severity] > order[existing.severity]) {
      existing.severity = severity;
    }
    categorizedLogMap.set(rowId, existing);
  }

  // Pre-registrar severidad explícita si el archivo ya contenía la Columna 12 (Severity)
  logs.forEach((log) => {
    if (log.severity && log.severity !== 'bajo') {
      const existing = categorizedLogMap.get(log.rowId) || { alerts: [], severity: log.severity };
      existing.severity = log.severity;
      categorizedLogMap.set(log.rowId, existing);
    }
  });

  // 1. REGLA: DETECCIÓN DE FUERZA BRUTA
  // Agrupar fallos de login (4625 o texto de fallo) por IP de origen y/o usuario
  const failureEntries: RawLogEntry[] = [];
  const successEntries: RawLogEntry[] = [];

  logs.forEach((log) => {
    const isFailure =
      String(log.eventId) === '4625' ||
      /fail|fallo|denied|invalid|incorrect/i.test(log.status || '') ||
      /fail|fallo|incorrecta|errónea/i.test(log.action || '') ||
      /fallo de autenticación/i.test(log.details || '');

    const isSuccess =
      String(log.eventId) === '4624' ||
      /success|éxito|ok/i.test(log.status || '') ||
      /success|logon success|sesión establecida/i.test(log.action || '');

    if (isFailure) failureEntries.push(log);
    if (isSuccess) successEntries.push(log);
  });

  // Agrupar fallos por IP origen
  const failuresByIp = new Map<string, RawLogEntry[]>();
  failureEntries.forEach((entry) => {
    const ip = entry.sourceIp || 'Desconocida';
    if (!failuresByIp.has(ip)) failuresByIp.set(ip, []);
    failuresByIp.get(ip)!.push(entry);
  });

  failuresByIp.forEach((entries, ip) => {
    if (entries.length >= 3) {
      // Verificar si la misma IP tuvo éxito luego
      const subsequentSuccess = successEntries.filter(
        (s) => s.sourceIp === ip && s.rowId > entries[0].rowId
      );
      const isCompromised = subsequentSuccess.length > 0;
      const severity: AlertSeverity = isCompromised ? 'critico' : 'medio';
      const targetedUsers = Array.from(new Set(entries.map((e) => e.user).filter(Boolean)));

      const rowIds = [
        ...entries.map((e) => e.rowId),
        ...subsequentSuccess.map((s) => s.rowId),
      ];
      rowIds.forEach((rid) => registerLogAlert(rid, 'fuerza_bruta', severity));

      alerts.push({
        id: `BRUTE-${ip.replace(/\./g, '-')}`,
        title: isCompromised
          ? `Fuerza Bruta Exitosa (Compromiso de Cuenta Confirmado)`
          : `Ataque de Fuerza Bruta / Password Spraying`,
        category: 'fuerza_bruta',
        severity,
        description: isCompromised
          ? `Se registraron ${entries.length} intentos fallidos de autenticación desde la IP ${ip} contra los usuarios [${targetedUsers.join(', ')}], seguidos de un inicio de sesión EXITOSO (Fila #${subsequentSuccess.map((s) => s.rowId).join(', #')}). La cuenta ha sido vulnerada.`
          : `Se detectaron ${entries.length} intentos fallidos consecutivos de autenticación desde la IP ${ip} dirigidos a las cuentas [${targetedUsers.join(', ')}].`,
        technicalJustification: `Regla SIEM T1110 (Brute Force): Múltiples eventos ID 4625 en ventana temporal estrecha (${entries[0].timestamp} a ${entries[entries.length - 1].timestamp}). ${
          isCompromised
            ? 'Correlación crítica: El evento 4624 posterior confirma brecha en credenciales.'
            : 'Frecuencia anómala de rechazos PAM/Windows Logon.'
        }`,
        rowIds,
        firstSeen: entries[0].timestamp,
        lastSeen: (subsequentSuccess[subsequentSuccess.length - 1] || entries[entries.length - 1]).timestamp,
        entities: {
          sourceIps: [ip],
          users: targetedUsers as string[],
          hosts: Array.from(new Set(entries.map((e) => e.host).filter(Boolean))) as string[],
        },
        mitreTactic: 'Credential Access',
        mitreTechniqueId: 'T1110',
        mitreTechniqueName: 'Brute Force',
      });
    }
  });

  // 2. REGLA: INICIOS SOSPECHOSOS
  logs.forEach((log) => {
    const isLogon =
      String(log.eventId) === '4624' ||
      /logon|login|sesión/i.test(log.action || '') ||
      /session established/i.test(log.action || '');

    if (isLogon && log.status !== 'FAILURE') {
      const isPublic = log.sourceIp && !isPrivateIp(log.sourceIp);
      const hour = log.timestamp ? new Date(log.timestamp).getHours() : -1;
      const isOffHours = !isNaN(hour) && (hour >= 0 && hour <= 5);

      if (isPublic || isOffHours) {
        const severity: AlertSeverity = isPublic && isOffHours ? 'alto' : 'medio';
        registerLogAlert(log.rowId, 'inicios_sospechosos', severity);

        alerts.push({
          id: `SUSP-LOGON-${log.rowId}`,
          title: `Inicio de Sesión Sospechoso (${isPublic ? 'IP Pública/Externa' : 'Horario No Hábil'})`,
          category: 'inicios_sospechosos',
          severity,
          description: `Acceso detectado para el usuario "${log.user || 'Desconocido'}" en ${log.host || 'Host no especificado'} desde ${log.sourceIp || 'IP desconocida'} a las ${log.timestamp}.`,
          technicalJustification: `Autenticación anómala: ${isPublic ? `Origen externo no corporativo (${log.sourceIp}). ` : ''}${
            isOffHours ? `Registrado a las ${hour}:00 horas (fuera del huso operativo habitual).` : ''
          }`,
          rowIds: [log.rowId],
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
          entities: {
            users: log.user ? [log.user] : [],
            sourceIps: log.sourceIp ? [log.sourceIp] : [],
            hosts: log.host ? [log.host] : [],
          },
          mitreTactic: 'Initial Access / Defense Evasion',
          mitreTechniqueId: 'T1078',
          mitreTechniqueName: 'Valid Accounts',
        });
      }
    }
  });

  // 3. REGLA: ESCALAMIENTO DE PRIVILEGIOS
  logs.forEach((log) => {
    const textToScan = `${log.processOrCommand || ''} ${log.action || ''} ${log.details || ''} ${log.eventId || ''}`;
    const isPrivEsc =
      String(log.eventId) === '4732' || // Member added to security-enabled local group
      String(log.eventId) === '4728' || // Member added to global security group
      String(log.eventId) === '4672' || // Special privileges assigned to new logon
      /localgroup administrators.*\/add/i.test(textToScan) ||
      /group "Domain Admins".*\/add/i.test(textToScan) ||
      /fodhelper\.exe|eventvwr\.exe|sdclt\.exe/i.test(textToScan) ||
      /SeDebugPrivilege|SeTcbPrivilege/i.test(textToScan) ||
      /lsass\.dmp|comsvcs\.dll.*MiniDump|mimikatz|sekurlsa/i.test(textToScan);

    if (isPrivEsc) {
      const isLsassOrAdmin = /comsvcs\.dll|lsass|localgroup administrators/i.test(textToScan);
      const severity: AlertSeverity = isLsassOrAdmin ? 'critico' : 'alto';
      registerLogAlert(log.rowId, 'escalamiento', severity);

      alerts.push({
        id: `PRIV-ESC-${log.rowId}`,
        title: /lsass|MiniDump|mimikatz/i.test(textToScan)
          ? 'Volcado de Memoria LSASS / Extracción de Credenciales'
          : /localgroup|group/i.test(textToScan)
          ? 'Modificación No Autorizada de Grupo de Administradores'
          : 'Elevación de Privilegios / Asignación de Permisos Críticos',
        category: 'escalamiento',
        severity,
        description: `Se detectó actividad de escalamiento en ${log.host || 'host'}: ${log.details || log.processOrCommand}`,
        technicalJustification: `Regla T1068/T1003/T1098: Identificado evento ID ${log.eventId || '4688'} con patrón de elevación administrativa o token dumping. Usuario: ${log.user}.`,
        rowIds: [log.rowId],
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        entities: {
          users: log.user ? [log.user] : [],
          hosts: log.host ? [log.host] : [],
          commands: log.processOrCommand ? [log.processOrCommand] : [],
        },
        mitreTactic: 'Privilege Escalation / Credential Access',
        mitreTechniqueId: /lsass/i.test(textToScan) ? 'T1003.001' : 'T1098',
        mitreTechniqueName: /lsass/i.test(textToScan) ? 'OS Credential Dumping: LSASS' : 'Account Manipulation',
      });
    }
  });

  // 4. REGLA: COMANDOS Y PROCESOS SOSPECHOSOS
  logs.forEach((log) => {
    const cmd = log.processOrCommand || '';
    const details = log.details || '';
    const fullText = `${cmd} ${details}`;

    const isSuspCmd =
      /whoami(\.exe)?\s+(\/priv|\/all)/i.test(fullText) ||
      /nltest(\.exe)?\s+\/(dclist|domain_trusts)/i.test(fullText) ||
      /net(\.exe)?\s+group\s+"Domain Admins"/i.test(fullText) ||
      /certutil(\.exe)?.*-urlcache/i.test(fullText) ||
      /powershell(\.exe)?.*(-enc|-encodedcommand|IEX|DownloadString|Hidden)/i.test(fullText) ||
      /bitsadmin(\.exe)?.*\/transfer/i.test(fullText) ||
      /vssadmin(\.exe)?\s+delete\s+shadows/i.test(fullText) ||
      /curl.*\|\s*sh|wget.*\|\s*sh/i.test(fullText);

    if (isSuspCmd) {
      const isDangerous = /powershell.*-enc|certutil.*-urlcache|vssadmin delete shadows/i.test(fullText);
      const severity: AlertSeverity = isDangerous ? 'critico' : 'alto';
      registerLogAlert(log.rowId, 'comandos_procesos', severity);

      alerts.push({
        id: `CMD-SUSP-${log.rowId}`,
        title: /vssadmin/i.test(fullText)
          ? 'Intento de Destrucción de Copias de Seguridad (Shadow Copies)'
          : /certutil|download/i.test(fullText)
          ? 'Descarga Maliciosa mediante Herramienta Legítima (LOLBAS)'
          : /powershell.*-enc/i.test(fullText)
          ? 'Ejecución de PowerShell Ofuscado en Base64'
          : 'Comandos de Reconocimiento del Dominio / Enumeración',
        category: 'comandos_procesos',
        severity,
        description: `Ejecución sospechosa en ${log.host || 'Host'}: ${cmd}`,
        technicalJustification: `Regla T1059/T1105/T1490: Comando anómalo que coincide con firmas reconocidas de ciberataques. Detalle: ${details}`,
        rowIds: [log.rowId],
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        entities: {
          users: log.user ? [log.user] : [],
          hosts: log.host ? [log.host] : [],
          commands: [cmd],
        },
        mitreTactic: 'Execution / Defense Evasion',
        mitreTechniqueId: /vssadmin/i.test(fullText) ? 'T1490' : 'T1059.001',
        mitreTechniqueName: /vssadmin/i.test(fullText) ? 'Inhibit System Recovery' : 'PowerShell / Command Interpreter',
      });
    }
  });

  // 5. REGLA: MOVIMIENTO LATERAL
  logs.forEach((log) => {
    const text = `${log.processOrCommand || ''} ${log.action || ''} ${log.details || ''} ${log.eventId || ''}`;
    const isLateral =
      String(log.eventId) === '5140' || // Network Share Object accessed
      String(log.eventId) === '5145' ||
      String(log.eventId) === '7045' || // New Service Installed (PsExec)
      /PSEXESVC|psexec/i.test(text) ||
      /ADMIN\$|C\$/i.test(text) ||
      /wmic(\.exe)?\s+\/node:/i.test(text) ||
      /wmic.*process call create/i.test(text) ||
      (/network logon/i.test(log.action || '') && log.sourceIp && log.destinationIp && log.sourceIp !== log.destinationIp);

    if (isLateral) {
      const isPsExecOrWmic = /PSEXESVC|psexec|wmic.*\/node/i.test(text);
      const severity: AlertSeverity = isPsExecOrWmic ? 'critico' : 'alto';
      registerLogAlert(log.rowId, 'movimiento_lateral', severity);

      alerts.push({
        id: `LAT-MOV-${log.rowId}`,
        title: /PSEXESVC|psexec/i.test(text)
          ? 'Ejecución Remota Mediante Servicio PsExec'
          : /wmic/i.test(text)
          ? 'Movimiento Lateral mediante Invocación WMI'
          : 'Acceso a Recurso Compartido Administrativo de Red (SMB)',
        category: 'movimiento_lateral',
        severity,
        description: `Propagación lateral desde ${log.sourceIp || 'origen'} hacia ${log.destinationIp || log.host || 'destino'}.`,
        technicalJustification: `Regla T1021 (Remote Services): Acceso a canal administrativo o instalación de servicio de ejecución remota entre estaciones internas.`,
        rowIds: [log.rowId],
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        entities: {
          users: log.user ? [log.user] : [],
          sourceIps: log.sourceIp ? [log.sourceIp] : [],
          destinationIps: log.destinationIp ? [log.destinationIp] : [],
          hosts: log.host ? [log.host] : [],
          commands: log.processOrCommand ? [log.processOrCommand] : [],
        },
        mitreTactic: 'Lateral Movement',
        mitreTechniqueId: 'T1021.002',
        mitreTechniqueName: 'SMB/Windows Admin Shares',
      });
    }
  });

  // 6. REGLA: OTRAS ANOMALÍAS (Persistencia, Evasión de Defensas, Borrado de Logs)
  logs.forEach((log) => {
    const text = `${log.processOrCommand || ''} ${log.action || ''} ${log.details || ''} ${log.eventId || ''}`;
    const isOther =
      String(log.eventId) === '1102' || // Audit log cleared
      String(log.eventId) === '104' || // System log cleared
      /wevtutil(\.exe)?\s+cl/i.test(text) ||
      /audit log.*cleared|registro de auditoría.*borrado/i.test(text) ||
      String(log.eventId) === '4698' || // Scheduled task created
      /schtasks(\.exe)?\s+\/create/i.test(text) ||
      /netsh.*advfirewall.*off/i.test(text);

    if (isOther) {
      const isLogCleared = /1102|104|wevtutil|borrado|cleared/i.test(text);
      const severity: AlertSeverity = isLogCleared ? 'critico' : 'alto';
      registerLogAlert(log.rowId, 'otras_anomalias', severity);

      alerts.push({
        id: `ANOM-${log.rowId}`,
        title: isLogCleared
          ? 'ALERTA MÁXIMA: Borrado Intencional de Registros de Auditoría'
          : /schtasks/i.test(text)
          ? 'Persistencia Mediante Tarea Programada Sospechosa'
          : 'Desactivación de Seguridad Perimetral / Cortafuegos',
        category: 'otras_anomalias',
        severity,
        description: isLogCleared
          ? `Se eliminó el registro de eventos en ${log.host || 'host'} para destruir evidencia forense.`
          : `Anomalía crítica registrada en ${log.host || 'host'}: ${log.details || log.processOrCommand}`,
        technicalJustification: isLogCleared
          ? 'Regla T1070.001 (Clear Windows Event Logs): Acción típica de atacantes avanzados para obstaculizar el análisis post-incidente.'
          : 'Regla T1053 (Scheduled Task/Job): Mecanismo de persistencia para sobrevivir a reinicios.',
        rowIds: [log.rowId],
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        entities: {
          users: log.user ? [log.user] : [],
          hosts: log.host ? [log.host] : [],
          commands: log.processOrCommand ? [log.processOrCommand] : [],
        },
        mitreTactic: isLogCleared ? 'Defense Evasion' : 'Persistence',
        mitreTechniqueId: isLogCleared ? 'T1070.001' : 'T1053.005',
        mitreTechniqueName: isLogCleared ? 'Clear Windows Event Logs' : 'Scheduled Task',
      });
    }
  });

  // Enriquecer registros crudos con sus etiquetas
  const enrichedLogs = logs.map((log) => {
    const found = categorizedLogMap.get(log.rowId);
    return {
      ...log,
      detectedAlerts: found?.alerts || [],
      severity: found?.severity || 'bajo',
    };
  });

  // Métricas agregadas
  const categoriesCount: Record<AlertCategory, number> = {
    fuerza_bruta: 0,
    inicios_sospechosos: 0,
    escalamiento: 0,
    comandos_procesos: 0,
    movimiento_lateral: 0,
    otras_anomalias: 0,
  };
  alerts.forEach((a) => {
    categoriesCount[a.category] = (categoriesCount[a.category] || 0) + 1;
  });

  const severityCount: Record<AlertSeverity, number> = {
    critico: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
  };
  alerts.forEach((a) => {
    severityCount[a.severity] = (severityCount[a.severity] || 0) + 1;
  });

  // Calcular severidad general y puntaje de riesgo (0 - 100)
  let overallRisk: AlertSeverity = 'bajo';
  let riskScore = 15;

  if (severityCount.critico > 0) {
    overallRisk = 'critico';
    riskScore = Math.min(100, 85 + severityCount.critico * 3 + severityCount.alto * 2);
  } else if (severityCount.alto > 0) {
    overallRisk = 'alto';
    riskScore = Math.min(84, 65 + severityCount.alto * 4);
  } else if (severityCount.medio > 0) {
    overallRisk = 'medio';
    riskScore = Math.min(64, 40 + severityCount.medio * 3);
  } else {
    overallRisk = 'bajo';
    riskScore = 20;
  }

  // Entidades comprometidas únicas
  const compromisedUsers = Array.from(
    new Set(
      alerts
        .flatMap((a) => a.entities.users || [])
        .filter((u) => u && !u.includes('NT AUTHORITY') && u !== 'srv_backup')
    )
  );

  const attackerIps = Array.from(
    new Set(
      alerts
        .flatMap((a) => a.entities.sourceIps || [])
        .filter((ip) => ip && !isPrivateIp(ip))
    )
  );

  const affectedHosts = Array.from(
    new Set(alerts.flatMap((a) => a.entities.hosts || []).filter(Boolean))
  );

  return {
    fileName,
    totalLogs: logs.length,
    rawLogs: enrichedLogs,
    alerts,
    overallRisk,
    riskScore,
    startTime: logs[0]?.timestamp,
    endTime: logs[logs.length - 1]?.timestamp,
    compromisedUsers,
    attackerIps,
    affectedHosts,
    categoriesCount,
    severityCount,
    isAiAnalyzing: false,
  };
}
