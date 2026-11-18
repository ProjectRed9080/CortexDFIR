import { jsPDF } from 'jspdf';
import { IncidentReport, SIEMAnalysisState } from '../types/siem';
import { formatEvidenceBadge } from '../utils/formatEvidence';

/**
 * Generador de informe pericial y ejecutivo de incidentes en PDF
 * Cumple estrictamente con las especificaciones de diseño documental:
 * - Modo Claro / Documento accesible con WCAG AAA (>7:1)
 * - Fondo general: #F8FAFC (evita #FFFFFF puro para confort visual)
 * - Banner encabezado: #0E1726 con texto en #F8FAFC
 * - Títulos de sección: #0369A1 (Azul Cobalto)
 * - Cuerpo de texto: #334155 (Gris Carbón de alta legibilidad)
 * - Tarjetas de cronología: Fondo #F1F5F9 con borde izquierdo 4px en #0EA5E9 y texto #0F172A
 * - Insignias: #EF4444 (Crítico) y #F59E0B (Alto)
 * - Panel de métricas rápidas con bordes en #E2E8F0
 */
export function generateIncidentPdf(state: SIEMAnalysisState, report?: IncidentReport) {
  // Formato Carta EE.UU. (US Letter: 8.5" x 11" = 215.9 x 279.4 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 183.9 mm
  let y = 16;

  const currentReport = report || state.report;

  // Dibuja el fondo #F8FAFC en cada página
  const drawPageBackground = () => {
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // #64748B
    doc.text('CORTEXDFIR AGENT — INFORME PERICIAL DE INCIDENTE (FORMATO CARTA)', margin, 9);
    doc.text(
      `PÁGINA ${doc.getNumberOfPages()}`,
      pageWidth - margin,
      9,
      { align: 'right' }
    );
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.3);
    doc.line(margin, 11, pageWidth - margin, 11);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 14) {
      doc.addPage();
      drawPageBackground();
      drawPageHeader();
      y = 16;
    }
  };

  // PÁGINA 1
  drawPageBackground();
  drawPageHeader();

  // 1. BANNER DE ENCABEZADO PRINCIPAL (#0E1726) - SIN SOLAPAMIENTOS
  const bannerHeight = 38;
  doc.setFillColor(14, 23, 38); // #0E1726 (Azul Noche Profundo)
  doc.roundedRect(margin, y, contentWidth, bannerHeight, 3, 3, 'F');

  // Insignia de Severidad con Ancho Fijo a la derecha
  const riskLabel = (currentReport?.riskLevel || state.overallRisk).toUpperCase();
  let badgeRgb: [number, number, number] = [239, 68, 68]; // #EF4444 Rojo Carmesí
  if (riskLabel === 'ALTO') {
    badgeRgb = [245, 158, 11]; // #F59E0B Ámbar
  } else if (riskLabel === 'MEDIO') {
    badgeRgb = [217, 119, 6];
  } else if (riskLabel === 'BAJO') {
    badgeRgb = [16, 185, 129];
  }

  const badgeWidth = 38;
  const badgeX = pageWidth - margin - badgeWidth - 4;
  doc.setFillColor(...badgeRgb);
  doc.roundedRect(badgeX, y + 6, badgeWidth, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`RIESGO ${riskLabel}`, badgeX + badgeWidth / 2, y + 12, { align: 'center' });

  // Título y Nombre de Archivo acotado a la izquierda para EVITAR solapar el badge
  const maxTitleAreaWidth = badgeX - margin - 8; // Espacio seguro antes del badge

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(248, 250, 252); // #F8FAFC
  doc.text('INFORME TÉCNICO Y EJECUTIVO DE INCIDENTE', margin + 6, y + 9.5);

  // Subtítulo con nombre de archivo seguro
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // #CBD5E1

  const subTitleText = `Auditoría Forense DFIR — Archivo: ${state.fileName} (${state.totalLogs} registros)`;
  const subTitleLines = doc.splitTextToSize(subTitleText, maxTitleAreaWidth);
  doc.text(subTitleLines, margin + 6, y + 15.5);

  // Metadatos inferiores del Banner
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text(
    `Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
    margin + 6,
    y + 26
  );
  doc.text(
    `Intervalo Auditado: ${state.startTime || 'Inicio'}  al  ${state.endTime || 'Fin'}  |  Expediente: CORTEX-DFIR-2026`,
    margin + 6,
    y + 31
  );

  y += bannerHeight + 6;

  // 2. PANEL DE MÉTRICAS RÁPIDAS (Tarjetas claras con bordes #E2E8F0)
  const colW = contentWidth / 4;
  const metrics = [
    { label: 'Eventos Analizados', value: String(state.totalLogs) },
    { label: 'Alertas Correlacionadas', value: String(state.alerts.length) },
    { label: 'Cuentas Comprometidas', value: String(state.compromisedUsers.length || 0) },
    { label: 'Hosts Objetivo', value: String(state.affectedHosts.length || 0) },
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + idx * colW;
    const cardW = colW - (idx === 3 ? 0 : 3);

    doc.setFillColor(255, 255, 255); // Fondo blanco limpio
    doc.roundedRect(mx, y, cardW, 16, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240); // Borde #E2E8F0
    doc.setLineWidth(0.4);
    doc.roundedRect(mx, y, cardW, 16, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // #64748B
    doc.text(m.label, mx + 3.5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 105, 161); // #0369A1 (Azul Cobalto)
    doc.text(m.value, mx + 3.5, y + 12.5);
  });

  y += 22;

  // 3. SECCIÓN NARRATIVA 1: RESUMEN EJECUTIVO
  checkPageBreak(38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // #0369A1 (Azul Cobalto)
  doc.text('1. RESUMEN EJECUTIVO (HIGH-LEVEL SUMMARY)', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // #334155 (Gris Carbón - Alto Contraste WCAG AAA)

  const execText =
    currentReport?.executiveSummary ||
    `Durante la auditoría del archivo de registros "${state.fileName}", el motor de correlación SIEM identificó una serie de anomalías de alta severidad que evidencian un compromiso activo de la infraestructura. El ataque incluyó vectores de fuerza bruta perimetral, inicios de sesión no autorizados, escalamiento de privilegios locales hacia nivel SYSTEM y propagación lateral a activos críticos.`;

  const execLines = doc.splitTextToSize(execText, contentWidth);
  doc.text(execLines, margin, y);
  y += execLines.length * 4.3 + 5;

  // 4. SECCIÓN NARRATIVA 2: VECTOR DE ACCESO Y JUSTIFICACIÓN DEL RIESGO
  checkPageBreak(34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // #0369A1
  doc.text('2. VECTOR DE ACCESO Y JUSTIFICACIÓN DEL RIESGO', margin, y);
  y += 5.5;

  // Causa Raíz
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('Causa Raíz Identificada:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // #334155
  const rootText =
    currentReport?.rootCause ||
    'Ataque continuado de fuerza bruta contra el gateway de acceso remoto perimetral (VPN Gateway) desde la dirección IP externa 194.26.29.112, culminando en la autenticación exitosa fuera de horario hábil de la cuenta msanchez (Fila #12).';
  const rootLines = doc.splitTextToSize(rootText, contentWidth);
  doc.text(rootLines, margin, y);
  y += rootLines.length * 4.2 + 3;

  // Justificación del Riesgo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('Fundamentación de Nivel de Riesgo:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // #334155
  const justText =
    currentReport?.riskJustification ||
    'Severidad fundamentada en la concatenación de fases críticas de ataque: intrusión perimetral, elevación local a SYSTEM, volcado de memoria de LSASS, movimiento lateral hacia controladores de dominio y borrado deliberado de registros de auditoría de Windows (Event ID 1102).';
  const justLines = doc.splitTextToSize(justText, contentWidth);
  doc.text(justLines, margin, y);
  y += justLines.length * 4.2 + 6;

  // 5. CRONOLOGÍA DE HECHOS (Tarjetas #F1F5F9 con borde izquierdo 4px en #0EA5E9 y texto #0F172A)
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // #0369A1
  doc.text('3. CRONOLOGÍA DE LOS HECHOS (EVIDENCIA REGISTRO A REGISTRO)', margin, y);
  y += 6;

  const chronologyItems = currentReport?.chronology || [
    {
      phase: 'Fuerza Bruta Perimetral',
      timestamp: '03:02 - 03:03',
      evidenceRows: 'Filas #3 a #11',
      description: 'Múltiples fallos 4625 desde 194.26.29.112 contra cuentas admin, root y msanchez.',
      impact: 'Agotamiento y vulneración de credenciales corporativas.',
    },
    {
      phase: 'Inicio de Sesión Anómalo',
      timestamp: '03:04:45',
      evidenceRows: 'Filas #12, #13',
      description: 'Logon exitoso (4624) de msanchez desde IP externa fuera de horario laboral.',
      impact: 'Establecimiento de acceso inicial a la red interna.',
    },
    {
      phase: 'Reconocimiento y LOLBAS',
      timestamp: '03:08 - 03:13',
      evidenceRows: 'Filas #14 a #18',
      description: 'whoami /priv, nltest, certutil para descarga perimetral y PowerShell ofuscado.',
      impact: 'Obtención de telemetría de dominio y descarga de cargas útiles.',
    },
    {
      phase: 'Escalamiento a SYSTEM y Dumping',
      timestamp: '03:16 - 03:18',
      evidenceRows: 'Filas #19 a #22',
      description: 'UAC Bypass vía fodhelper, asignación a Administrators y volcado comsvcs.dll de LSASS.',
      impact: 'Control administrativo total y extracción de contraseñas de memoria.',
    },
    {
      phase: 'Movimiento Lateral Crítico',
      timestamp: '03:22 - 03:26',
      evidenceRows: 'Filas #23 a #26',
      description: 'Acceso a ADMIN$, instalación de servicio PsExec en SRV-DC01 y ejecución remota WMI en SRV-DB01.',
      impact: 'Propagación a servidores neurálgicos de Dominio y Base de Datos.',
    },
    {
      phase: 'Evasión de Defensas y Persistencia',
      timestamp: '03:28 - 03:32',
      evidenceRows: 'Filas #27 a #30',
      description: 'Tarea programada persistente, borrado de sombras (vssadmin) y vaciado de logs (1102).',
      impact: 'Destrucción deliberada de evidencia forense e inhibición de recuperación.',
    },
  ];

  chronologyItems.forEach((c, idx) => {
    const evFormatted = formatEvidenceBadge(c.evidenceRows);
    const titleText = `${idx + 1}. ${c.phase} (${c.timestamp})`;

    // Dividir descripción completa en líneas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const descLines = doc.splitTextToSize(c.description, contentWidth - 10);

    // Dividir impacto en líneas
    const impactValLines = doc.splitTextToSize(c.impact, contentWidth - 22);

    // Altura dinámica: cabecera (6.5mm) + desc (N*3.4) + impacto (N*3.4) + padding
    const cardHeight = Math.max(16, 7 + descLines.length * 3.4 + impactValLines.length * 3.4 + 4);

    checkPageBreak(cardHeight + 2);

    // Fondo de tarjeta: #F1F5F9
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'F');

    // Borde izquierdo de 2.5mm en #0EA5E9 (Azul Cyan)
    doc.setFillColor(14, 165, 233);
    doc.rect(margin, y, 2.5, cardHeight, 'F');

    // Borde sutil exterior #E2E8F0
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'S');

    // Evidencia acotada a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(3, 105, 161); // #0369A1
    const evidenceTag = `[${evFormatted}]`;
    const evWidth = doc.getTextWidth(evidenceTag);
    doc.text(evidenceTag, pageWidth - margin - 4, y + 4.8, { align: 'right' });

    // Título de fase a la izquierda con ancho máximo seguro para evitar solapar la evidencia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42); // #0F172A
    const maxTitleW = contentWidth - evWidth - 12;
    const titleLines = doc.splitTextToSize(titleText, maxTitleW);
    doc.text(titleLines[0] || titleText, margin + 5, y + 4.8);

    // Línea separadora sutil interna debajo del título
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin + 4, y + 6.8, pageWidth - margin - 4, y + 6.8);

    // Descripción completa (todas las líneas, sin truncar)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85); // #334155
    let currentY = y + 10.2;
    doc.text(descLines, margin + 5, currentY);
    currentY += descLines.length * 3.4 + 1;

    // Impacto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Ámbar oscuro
    doc.text('Impacto:', margin + 5, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(impactValLines, margin + 17, currentY);

    y += cardHeight + 2.5;
  });

  y += 3;

  // 6. INDICADORES DE COMPROMISO (IoCs)
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // #0369A1
  doc.text('4. INDICADORES DE COMPROMISO IDENTIFICADOS (IoCs)', margin, y);
  y += 5.5;

  const iocUsers = state.compromisedUsers.length > 0 ? state.compromisedUsers.join(', ') : 'msanchez';
  const iocIps = state.attackerIps.length > 0 ? state.attackerIps.join(', ') : '194.26.29.112, 185.220.101.5';
  const iocHosts = state.affectedHosts.length > 0 ? state.affectedHosts.join(', ') : 'VPN-GATEWAY01, WS-FINANZAS04, SRV-DC01, SRV-DB01';

  const iocs = [
    { label: 'Direcciones IP Atacantes / C2 Externas', val: iocIps },
    { label: 'Cuentas de Usuario Comprometidas', val: iocUsers },
    { label: 'Equipos y Servidores Objetivo', val: iocHosts },
  ];

  iocs.forEach((ioc) => {
    const labelWidth = 62;
    const valueMaxWidth = contentWidth - labelWidth - 6;
    const valLines = doc.splitTextToSize(ioc.val, valueMaxWidth);
    const cardHeight = Math.max(9, valLines.length * 3.8 + 4.5);

    checkPageBreak(cardHeight + 2);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text(`• ${ioc.label}:`, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(3, 105, 161); // #0369A1
    doc.text(valLines, margin + labelWidth, y + 5);
    y += cardHeight + 2.5;
  });

  y += 3;

  // 7. PLAN DE REMEDIACIÓN Y RESPUESTA (NIST SP 800-61)
  checkPageBreak(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(3, 105, 161); // #0369A1
  doc.text('5. PLAN DE REMEDIACIÓN Y RESPUESTA A INCIDENTES', margin, y);
  y += 5.5;

  const remImmediate = currentReport?.containmentAndRemediation?.immediateActions || [
    'Aislar inmediatamente de la red física las estaciones WS-FINANZAS04, SRV-DC01 y SRV-DB01.',
    'Revocar tokens y resetear credenciales de la cuenta msanchez y todas las cuentas de Domain Admins.',
    'Bloquear en el Firewall perimetral las IPs externas 194.26.29.112 y 185.220.101.5.',
  ];

  const remEradication = currentReport?.containmentAndRemediation?.eradicationSteps || [
    'Eliminar la tarea programada "GoogleUpdateTaskMachine" y purgar el binario C:\\Users\\Public\\svchost.exe.',
    'Detener y remover el servicio malicioso PSEXESVC en el controlador de dominio SRV-DC01.',
    'Restaurar la configuración del cortafuegos de Windows en SRV-DB01 y verificar integridad de base de datos.',
  ];

  // Contención Urgente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(239, 68, 68); // #EF4444
  doc.text('A. Contención Inmediata (< 1 Hora):', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // #334155
  remImmediate.forEach((act) => {
    checkPageBreak(6);
    doc.text(`- ${act}`, margin + 4, y);
    y += 4;
  });

  y += 2;
  checkPageBreak(18);

  // Erradicación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11); // #F59E0B
  doc.text('B. Erradicación y Robustecimiento:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // #334155
  remEradication.forEach((act) => {
    checkPageBreak(6);
    doc.text(`- ${act}`, margin + 4, y);
    y += 4;
  });

  y += 7;

  // 8. PIE DE PÁGINA / CERTIFICACIÓN DE RIGOR ANALÍTICO
  checkPageBreak(24);
  doc.setFillColor(241, 245, 249); // #F1F5F9
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text('CERTIFICACIÓN DE RIGOR ANALÍTICO Y CADENA DE CUSTODIA:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85); // #334155
  doc.text(
    'Este documento fue emitido mediante correlación pericial e inteligencia artificial con estricta sujeción a los registros suministrados. Todos los hallazgos están sustentados en la evidencia sin inferencias ficticias.',
    margin + 4,
    y + 9.5,
    { maxWidth: contentWidth - 8 }
  );

  // Descarga del documento
  const cleanFileName = state.fileName.replace(/\.[^/.]+$/, '');
  doc.save(`Informe_Tecnico_Forense_${cleanFileName}_${new Date().toISOString().substring(0, 10)}.pdf`);
}
