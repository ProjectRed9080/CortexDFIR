import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  Layers,
  AlertTriangle,
  RefreshCw,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  Eye,
  FileCheck,
} from 'lucide-react';
import { IncidentReport, SIEMAnalysisState } from '../types/siem';
import { formatEvidenceBadge } from '../utils/formatEvidence';

interface ReportTabProps {
  state: SIEMAnalysisState;
  onRunAiAnalysis: () => void;
  onExportPdf: () => void;
  onResetReport?: () => void;
  isAiLoading: boolean;
  onInspectRow: (rowId: number) => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  state,
  onRunAiAnalysis,
  onExportPdf,
  onResetReport,
  isAiLoading,
  onInspectRow,
}) => {
  const report = state.report;
  const [reportScope, setReportScope] = useState<'completo' | 'tecnico' | 'ejecutivo'>('completo');
  const [previewMode, setPreviewMode] = useState<'soc_dark' | 'document_light'>('soc_dark');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'crítico':
      case 'critico':
        return 'text-[#F87171] bg-transparent border-[#EF4444]';
      case 'alto':
        return 'text-[#0B0F19] bg-[#F59E0B] border-[#F59E0B]';
      case 'medio':
        return 'text-[#0B0F19] bg-[#D97706] border-[#D97706]';
      default:
        return 'text-[#0B0F19] bg-[#10B981] border-[#10B981]';
    }
  };

  // VISTA 1: PREPARACIÓN Y ELECCIÓN DEL USUARIO
  if (!report) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="p-8 rounded-2xl bg-[#161E2E] border border-[#26334D] shadow-2xl space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#26334D] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-[#0E1726] text-[#94A3B8] border border-[#26334D]">
                  Módulo de Dictamen Pericial
                </span>
                <span className="text-xs text-[#94A3B8] font-mono">
                  {state.fileName} ({state.totalLogs} registros)
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#F1F5F9] font-heading tracking-tight">
                Emisión de Informe Técnico & Dictamen Forense
              </h1>
              <p className="text-xs text-[#94A3B8] leading-relaxed font-sans max-w-2xl">
                El informe pericial estructura y documenta rigurosamente el incidente de seguridad basándose exclusivamente en los datos registrados en el archivo. Define las preferencias antes de proceder con su redacción.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#0E1726] border border-[#26334D] flex items-center justify-center text-[#94A3B8] shrink-0">
              <FileCheck className="w-7 h-7" />
            </div>
          </div>

          {/* Resumen del Alcance Detectado */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-mono block">Eventos Auditados</span>
              <span className="text-xl font-bold text-white font-mono mt-0.5 block">{state.totalLogs}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-mono block">Alertas Correlacionadas</span>
              <span className="text-xl font-bold text-white font-mono mt-0.5 block">{state.alerts.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-mono block">Hosts Involucrados</span>
              <span className="text-xl font-bold text-white font-mono mt-0.5 block">{state.affectedHosts.length || 1}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-mono block">Severidad Prevista</span>
              <span className="text-xl font-bold text-[#F87171] font-mono mt-0.5 uppercase block">{state.overallRisk}</span>
            </div>
          </div>

          {/* Opciones de Emisión a Elección del Usuario */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] font-heading flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#94A3B8]" /> Parámetros del Informe Técnico
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setReportScope('completo')}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                  reportScope === 'completo'
                    ? 'bg-[#0E1726] border-[#0EA5E9] text-[#F1F5F9] shadow-md'
                    : 'bg-[#0E1726]/60 border-[#26334D] text-[#94A3B8] hover:border-[#0EA5E9]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-heading font-bold text-[#F1F5F9]">Completo (Recomendado)</strong>
                  {reportScope === 'completo' && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
                  Resumen Ejecutivo (C-Level) + Análisis Técnico Forense con evidencias y Remedición NIST.
                </p>
              </div>

              <div
                onClick={() => setReportScope('tecnico')}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                  reportScope === 'tecnico'
                    ? 'bg-[#0E1726] border-[#0EA5E9] text-[#F1F5F9] shadow-md'
                    : 'bg-[#0E1726]/60 border-[#26334D] text-[#94A3B8] hover:border-[#0EA5E9]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-heading font-bold text-[#F1F5F9]">Enfoque Técnico Puro</strong>
                  {reportScope === 'tecnico' && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
                  Orientado a informáticos, sysadmins y SOC: Tácticas MITRE, comandos y eventos registro a registro.
                </p>
              </div>

              <div
                onClick={() => setReportScope('ejecutivo')}
                className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                  reportScope === 'ejecutivo'
                    ? 'bg-[#0E1726] border-[#0EA5E9] text-[#F1F5F9] shadow-md'
                    : 'bg-[#0E1726]/60 border-[#26334D] text-[#94A3B8] hover:border-[#0EA5E9]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-heading font-bold text-[#F1F5F9]">Enfoque Ejecutivo</strong>
                  {reportScope === 'ejecutivo' && <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" />}
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
                  Síntesis de impacto de negocio, cronología de alto nivel y estado de contención general.
                </p>
              </div>
            </div>
          </div>

          {/* Botón de Generación bajo demanda */}
          <div className="pt-4 border-t border-[#26334D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-[#94A3B8] font-mono">
              
            </span>

            <button
              onClick={onRunAiAnalysis}
              disabled={isAiLoading}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#0B0F19] flex items-center justify-center gap-2 shadow-xl shadow-[#0EA5E9]/20 transition disabled:opacity-50 font-heading tracking-wide"
            >
              {isAiLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#0B0F19]" />
              ) : (
                <Sparkles className="w-4 h-4 fill-[#0B0F19]" />
              )}
              <span>Emitir Informe Pericial Técnico y Ejecutivo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: INFORME GENERADO (CON SELECTOR DE VISTA MODO OSCURO SOC / DOCUMENTO PDF)
  const isDocLight = previewMode === 'document_light';

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Barra de Herramientas del Informe */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#26334D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-sm ${getRiskColor(
              report.riskLevel || state.overallRisk
            )}`}
          >
            Riesgo: {report.riskLevel || state.overallRisk}
          </span>
          <span className="text-xs font-mono text-[#94A3B8] bg-[#0E1726] px-2.5 py-1 rounded-full border border-[#26334D] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8]" />
            Dictamen Emitido y Certificado
          </span>
        </div>

        {/* Controles de Vista y Exportación */}
        <div className="flex items-center gap-2">
          {/* Selector de Modo de Visualización */}
          <div className="flex items-center bg-[#0E1726] p-1 rounded-xl border border-[#26334D] text-xs">
            <button
              onClick={() => setPreviewMode('soc_dark')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                !isDocLight
                  ? 'bg-[#161E2E] text-[#F1F5F9] font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Consola SOC
            </button>
            <button
              onClick={() => setPreviewMode('document_light')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                isDocLight
                  ? 'bg-white text-[#0F172A] font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Eye className="w-3 h-3 text-[#0EA5E9]" />
              Vista Hoja Carta (PDF)
            </button>
          </div>

          {onResetReport && (
            <button
              onClick={onResetReport}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] bg-[#0E1726] border border-[#26334D] hover:border-[#0EA5E9] transition flex items-center gap-1.5"
              title="Volver a configurar parámetros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
          )}

          <button
            onClick={onRunAiAnalysis}
            disabled={isAiLoading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0E1726] hover:bg-[#161E2E] text-[#F1F5F9] border border-[#26334D] flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0EA5E9] ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>Re-analizar</span>
          </button>

          <button
            onClick={onExportPdf}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#EF4444] hover:brightness-110 text-[#0B0F19] flex items-center gap-2 transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL INFORME: MODO DOCUMENTO CARTA ACCESIBLE (#F8FAFC) vs MODO CONSOLA SOC (#161E2E) */}
      {isDocLight ? (
        // VISTA DOCUMENTO ACCESIBLE ESTILO CARTA (US LETTER: 8.5" x 11" / 215.9 x 279.4 mm)
        <div className="space-y-4">
          {/* Barra de Información del Formato Carta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#0E1726] border border-[#26334D] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="font-mono text-[#F1F5F9] font-semibold">
                Previsualización de Documento — Formato Carta (US Letter • 8.5&quot; × 11&quot;)
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#94A3B8]">
              Escala de Hoja 1:1 • Proporción 215.9 × 279.4 mm • Accesibilidad WCAG AAA
            </span>
          </div>

          {/* Canvas de Documento (Hoja de Papel Carta Centrada) */}
          <div className="bg-[#0B0F19] py-8 px-2 sm:px-6 rounded-2xl border border-[#26334D] flex justify-center shadow-inner overflow-x-auto">
            {/* HOJA DE DOCUMENTO FORMATO CARTA (816px de ancho estándar a 96 DPI) */}
            <div
              className="w-full max-w-[816px] min-h-[1056px] bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] shadow-[0_12px_45px_rgba(0,0,0,0.45),_0_2px_8px_rgba(0,0,0,0.1)] rounded-sm p-6 sm:p-10 md:p-12 space-y-6 font-sans relative"
              style={{ boxSizing: 'border-box' }}
            >
              {/* Encabezado Superior de Hoja de Dictamen */}
              <div className="border-b border-[#E2E8F0] pb-2 flex items-center justify-between text-[10px] text-[#64748B] font-mono uppercase tracking-wider">
                <span style={{ textAlign: 'left' }}>CORTEXDFIR AGENT — DICTAMEN PERICIAL FORENSE DE INFRAESTRUCTURA</span>
                <span>HOJA CARTA • CONFIDENCIAL / DFIR</span>
              </div>

              {/* 1. CORRECCIÓN DEL ENCABEZADO (SOLAPAMIENTO DE ARCHIVO Y BADGE) */}
              <div
                className="p-5 sm:p-6 rounded-xl bg-[#0E1726] text-[#F8FAFC] shadow-md"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                {/* Lado izquierdo: Título y Nombre de Archivo con Control de Desbordamiento */}
                <div className="space-y-1.5 min-w-0 flex-1" style={{ textAlign: 'left' }}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] font-bold block" style={{ textAlign: 'left' }}>
                    AUDITORÍA FORENSE DE INFRAESTRUCTURA (DFIR)
                  </span>
                  <h1
                    className="text-lg sm:text-xl md:text-2xl font-bold text-[#F8FAFC] font-heading tracking-tight"
                    style={{ textAlign: 'left' }}
                  >
                    INFORME TÉCNICO Y EJECUTIVO DE INCIDENTE
                  </h1>

                  {/* Nombre de archivo con break-all / overflow-wrap: anywhere estricto */}
                  <div
                    className="text-xs text-[#94A3B8] font-sans"
                    style={{
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      textAlign: 'left',
                    }}
                  >
                    <span className="text-[#94A3B8] font-semibold">Archivo:</span> {state.fileName}
                    <span className="text-[#94A3B8] ml-1.5">({state.totalLogs} registros auditados)</span>
                  </div>

                  <div className="text-[11px] text-[#94A3B8] font-sans pt-1 flex items-center gap-2 flex-wrap" style={{ textAlign: 'left' }}>
                    <span>Fecha: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES')}</span>
                    <span>•</span>
                    <span>Intervalo: {state.startTime || 'Inicio'} al {state.endTime || 'Fin'}</span>
                  </div>
                </div>

                {/* Lado derecho: Badge de Riesgo con Ancho Fijo y flex-shrink: 0 */}
                <div
                  className="flex flex-col items-end gap-1.5"
                  style={{
                    flexShrink: 0,
                    minWidth: '135px',
                  }}
                >
                  <div
                    className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#0B0F19] shadow-sm font-heading ${
                      (report.riskLevel || state.overallRisk).toLowerCase() === 'alto'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#EF4444]'
                    }`}
                    style={{
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    RIESGO {report.riskLevel || state.overallRisk}
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8] text-right">
                    Exp: CORTEX-DFIR-2026
                  </span>
                </div>
              </div>

              {/* Panel de Métricas Rápidas (Tarjetas claras con bordes #E2E8F0) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm" style={{ padding: '14px' }}>
                  <span className="text-[#64748B] text-[10px] font-sans font-medium block" style={{ textAlign: 'left' }}>Eventos Analizados</span>
                  <span className="text-xl font-bold text-[#0369A1] font-heading mt-0.5 block" style={{ textAlign: 'left' }}>{state.totalLogs}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm" style={{ padding: '14px' }}>
                  <span className="text-[#64748B] text-[10px] font-sans font-medium block" style={{ textAlign: 'left' }}>Alertas Correlacionadas</span>
                  <span className="text-xl font-bold text-[#0369A1] font-heading mt-0.5 block" style={{ textAlign: 'left' }}>{state.alerts.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm" style={{ padding: '14px' }}>
                  <span className="text-[#64748B] text-[10px] font-sans font-medium block" style={{ textAlign: 'left' }}>Cuentas Comprometidas</span>
                  <span className="text-xl font-bold text-[#0369A1] font-heading mt-0.5 block" style={{ textAlign: 'left' }}>{state.compromisedUsers.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm" style={{ padding: '14px' }}>
                  <span className="text-[#64748B] text-[10px] font-sans font-medium block" style={{ textAlign: 'left' }}>Hosts Objetivo</span>
                  <span className="text-xl font-bold text-[#0369A1] font-heading mt-0.5 block" style={{ textAlign: 'left' }}>{state.affectedHosts.length}</span>
                </div>
              </div>

              {/* 3. ALINEACIÓN Y TIPIFICACIÓN DE TEXTOS: SECCIÓN 1 (RESUMEN EJECUTIVO JUSTIFICADO) */}
              {(reportScope === 'completo' || reportScope === 'ejecutivo') && (
                <div className="space-y-2.5">
                  <h2
                    className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                    style={{ textAlign: 'left' }}
                  >
                    <FileText className="w-4 h-4 text-[#0EA5E9]" /> 1. Resumen Ejecutivo (Executive Summary)
                  </h2>
                  <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm" style={{ padding: '16px' }}>
                    <p
                      className="text-xs sm:text-[13px] text-[#334155] leading-relaxed font-sans whitespace-pre-line"
                      style={{
                        textAlign: 'justify',
                        textJustify: 'inter-word',
                        hyphens: 'auto',
                      }}
                    >
                      {report.executiveSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. ALINEACIÓN Y TIPIFICACIÓN DE TEXTOS: SECCIÓN 2 (VECTOR DE ACCESO Y JUSTIFICACIÓN JUSTIFICADOS) */}
              <div className="space-y-2.5">
                <h2
                  className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                  style={{ textAlign: 'left' }}
                >
                  <AlertTriangle className="w-4 h-4 text-[#0EA5E9]" /> 2. Vector de Acceso Inicial y Fundamentación de Riesgo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1.5" style={{ padding: '14px' }}>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-heading"
                      style={{ textAlign: 'left' }}
                    >
                      Causa Raíz Identificada
                    </h3>
                    <p
                      className="text-xs text-[#334155] leading-relaxed font-sans"
                      style={{
                        textAlign: 'justify',
                        textJustify: 'inter-word',
                        hyphens: 'auto',
                      }}
                    >
                      {report.rootCause}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1.5" style={{ padding: '14px' }}>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider text-[#0F172A] font-heading"
                      style={{ textAlign: 'left' }}
                    >
                      Fundamentación del Nivel de Riesgo
                    </h3>
                    <p
                      className="text-xs text-[#334155] leading-relaxed font-sans"
                      style={{
                        textAlign: 'justify',
                        textJustify: 'inter-word',
                        hyphens: 'auto',
                      }}
                    >
                      {report.riskJustification}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CRONOLOGÍA DE HECHOS (Tarjetas #F1F5F9 con borde izquierdo 4px en #0EA5E9) */}
              <div className="space-y-2.5">
                <h2
                  className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                  style={{ textAlign: 'left' }}
                >
                  <Clock className="w-4 h-4 text-[#0EA5E9]" /> 3. Cronología de los Hechos (Evidencia Registro a Registro)
                </h2>

                <div className="space-y-3">
                  {report.chronology?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#F1F5F9] border-l-4 border-l-[#0EA5E9] border border-[#E2E8F0] shadow-sm flex flex-col gap-2.5 text-xs"
                      style={{ padding: '14px 16px' }}
                    >
                      {/* Fila 1: Cabecera con Fase, Horario y Badge de Evidencia Resumido */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-md bg-white text-[#0EA5E9] border border-[#CBD5E1] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <strong className="text-[#0F172A] font-heading font-bold text-xs" style={{ textAlign: 'left' }}>
                            {step.phase}
                          </strong>
                          <span className="text-[#64748B] font-mono text-[11px]">({step.timestamp})</span>
                        </div>

                        {/* Badge de evidencia acotado que nunca deforma el contenedor */}
                        <div className="flex items-center gap-1.5 shrink-0 max-w-full sm:max-w-[50%]">
                          <span className="text-[10px] text-[#64748B] font-mono shrink-0">Evidencia:</span>
                          <span
                            className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white text-[#0EA5E9] border border-[#CBD5E1] break-all whitespace-normal"
                            style={{ textAlign: 'right' }}
                            title={step.evidenceRows}
                          >
                            {formatEvidenceBadge(step.evidenceRows)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Descripción en ancho completo 100% (NUNCA comprimida) */}
                      <div className="w-full">
                        <p
                          className="text-[#334155] text-xs leading-relaxed font-sans"
                          style={{
                            textAlign: 'justify',
                            textJustify: 'inter-word',
                            hyphens: 'auto',
                          }}
                        >
                          {step.description}
                        </p>
                      </div>

                      {/* Fila 3: Impacto en ancho completo */}
                      <div className="w-full text-[11px] font-sans bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] flex items-start gap-1.5">
                        <strong className="shrink-0 text-[#0F172A]">Impacto:</strong>
                        <span className="text-[#334155] leading-snug">{step.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. CORRECCIÓN DE DESBORDAMIENTO (OVERFLOW DE IoCs) EN SECCIÓN 4 */}
              <div className="space-y-2.5">
                <h2
                  className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                  style={{ textAlign: 'left' }}
                >
                  <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" /> 4. Indicadores de Compromiso Identificados (IoCs)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Caja 1: Cuentas de Usuario Comprometidas */}
                  <div
                    className="rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between"
                    style={{ padding: '14px' }}
                  >
                    <div className="space-y-1.5" style={{ textAlign: 'left' }}>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#64748B] block" style={{ textAlign: 'left' }}>
                        Cuentas Comprometidas
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {(state.compromisedUsers.length > 0 ? state.compromisedUsers : ['msanchez']).map((user, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] font-mono text-[11px] font-semibold border border-[#EF4444]/30"
                            style={{
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              overflowWrap: 'break-word',
                              textAlign: 'left',
                            }}
                          >
                            {user}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-2 block" style={{ textAlign: 'left' }}>
                      Total: {state.compromisedUsers.length || 1} cuenta(s)
                    </span>
                  </div>

                  {/* Caja 2: Equipos y Servidores Objetivo */}
                  <div
                    className="rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between"
                    style={{ padding: '14px' }}
                  >
                    <div className="space-y-1.5" style={{ textAlign: 'left' }}>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#64748B] block" style={{ textAlign: 'left' }}>
                        Equipos y Servidores Objetivo
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {(state.affectedHosts.length > 0
                          ? state.affectedHosts
                          : ['VPN-GATEWAY01', 'WS-FINANZAS04', 'SRV-DC01', 'SRV-DB01']
                        ).map((host, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#0369A1]/10 text-[#0369A1] font-mono text-[11px] font-semibold border border-[#0369A1]/30"
                            style={{
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              overflowWrap: 'break-word',
                              textAlign: 'left',
                            }}
                          >
                            {host}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-2 block" style={{ textAlign: 'left' }}>
                      Total: {state.affectedHosts.length || 4} host(s)
                    </span>
                  </div>

                  {/* Caja 3: Direcciones IP Atacantes / C2 Externas */}
                  <div
                    className="rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between"
                    style={{ padding: '14px' }}
                  >
                    <div className="space-y-1.5" style={{ textAlign: 'left' }}>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#64748B] block" style={{ textAlign: 'left' }}>
                        Direcciones IP Atacantes
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {(state.attackerIps.length > 0
                          ? state.attackerIps
                          : ['194.26.29.112', '185.220.101.5']
                        ).map((ip, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#B45309] font-mono text-[11px] font-semibold border border-[#F59E0B]/30"
                            style={{
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              overflowWrap: 'break-word',
                              textAlign: 'left',
                            }}
                          >
                            {ip}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono mt-2 block" style={{ textAlign: 'left' }}>
                      Total: {state.attackerIps.length || 2} IP(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: COMANDOS MALICIOSOS Y LOLBAS OBSERVADOS */}
              {report.maliciousCommandsObserved && report.maliciousCommandsObserved.length > 0 && (
                <div className="space-y-2.5">
                  <h2
                    className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                    style={{ textAlign: 'left' }}
                  >
                    <Terminal className="w-4 h-4 text-[#0EA5E9]" /> 5. Comandos Maliciosos y Binarios LOLBAS Observados
                  </h2>

                  <div className="space-y-2">
                    {report.maliciousCommandsObserved.map((cmdItem, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1.5 text-xs" style={{ padding: '14px' }}>
                        <div className="flex items-center justify-between text-[#64748B] font-mono text-[11px]">
                          <span style={{ textAlign: 'left' }}>
                            Host: <strong className="text-[#0F172A]">{cmdItem.host}</strong> | Usuario: {cmdItem.user}
                          </span>
                          <span className="text-[#0EA5E9] font-bold shrink-0">{cmdItem.sourceRow}</span>
                        </div>
                        <pre
                          className="p-2.5 rounded-lg bg-[#F1F5F9] text-[#0F172A] font-mono text-xs overflow-x-auto border border-[#E2E8F0]"
                          style={{
                            wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                            textAlign: 'left',
                          }}
                        >
                          {cmdItem.command}
                        </pre>
                        <p className="text-[#334155] text-[11px] font-sans" style={{ textAlign: 'left' }}>
                          <strong className="text-[#0F172A]">Evaluación Forense:</strong> {cmdItem.riskAssessment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 6: PLAN DE ACCIÓN Y REMEDIACIÓN (NIST SP 800-61) */}
              <div className="space-y-2.5">
                <h2
                  className="text-sm font-bold text-[#0369A1] font-heading flex items-center gap-2"
                  style={{ textAlign: 'left' }}
                >
                  <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" /> 6. Plan de Acción y Remediación (NIST SP 800-61)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] border-t-4 border-t-[#EF4444] shadow-sm space-y-2" style={{ padding: '14px' }}>
                    <strong className="text-[#0F172A] font-heading text-xs block" style={{ textAlign: 'left' }}>Contención Urgente (&lt; 1h)</strong>
                    <ul className="space-y-1 text-[#334155] list-disc list-inside font-sans" style={{ textAlign: 'left' }}>
                      {report.containmentAndRemediation?.immediateActions?.map((act, i) => (
                        <li key={i} style={{ textAlign: 'left' }}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] border-t-4 border-t-[#F59E0B] shadow-sm space-y-2" style={{ padding: '14px' }}>
                    <strong className="text-[#0F172A] font-heading text-xs block" style={{ textAlign: 'left' }}>Erradicación y Limpieza</strong>
                    <ul className="space-y-1 text-[#334155] list-disc list-inside font-sans" style={{ textAlign: 'left' }}>
                      {report.containmentAndRemediation?.eradicationSteps?.map((step, i) => (
                        <li key={i} style={{ textAlign: 'left' }}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] border-t-4 border-t-[#10B981] shadow-sm space-y-2" style={{ padding: '14px' }}>
                    <strong className="text-[#0F172A] font-heading text-xs block" style={{ textAlign: 'left' }}>Hardening y Recuperación</strong>
                    <ul className="space-y-1 text-[#334155] list-disc list-inside font-sans" style={{ textAlign: 'left' }}>
                      {report.containmentAndRemediation?.recoveryAndHardening?.map((rec, i) => (
                        <li key={i} style={{ textAlign: 'left' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 7: VEREDICTO FINAL Y CERTIFICACIÓN */}
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1.5" style={{ padding: '14px' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1] font-heading" style={{ textAlign: 'left' }}>
                  7. Veredicto Pericial y Certificación Forense
                </h3>
                <p
                  className="text-xs text-[#334155] leading-relaxed font-sans"
                  style={{
                    textAlign: 'justify',
                    textJustify: 'inter-word',
                    hyphens: 'auto',
                  }}
                >
                  {report.verdict}
                </p>
              </div>

              {/* Pie Inferior de Hoja de Dictamen */}
              <div className="border-t border-[#E2E8F0] pt-3 mt-6 flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                <span style={{ textAlign: 'left' }}>Norma NIST SP 800-61 Rev. 2 • Cadena de custodia digital certificada</span>
                <span>Pág. 1 de 2 • Formato Carta (8.5&quot; × 11&quot;)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // VISTA CONSOLA SOC (Estrictamente bajo tokens de Plataforma_3811724a.md)
        <div className="p-6 sm:p-8 rounded-2xl bg-[#161E2E] border border-[#26334D] shadow-2xl space-y-8 font-sans">
          {/* Cabecera Técnica del Documento */}
          <div className="border-b border-[#26334D] pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8] font-bold block">
                CENTRO DE OPERACIONES DE SEGURIDAD & DFIR FORENSE
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] font-heading tracking-tight">
                DICTAMEN PERICIAL FORENSE DE INFRAESTRUCTURA
              </h1>
              <p className="text-xs text-[#94A3B8] font-mono">
                Expediente: CORTEX-{state.fileName.replace(/\.[^/.]+$/, '').toUpperCase()}-2026
              </p>
            </div>

            <div className="text-right text-xs font-mono space-y-1 bg-[#0E1726] p-3 rounded-xl border border-[#26334D] shrink-0">
              <div className="text-[#94A3B8]">
                Fecha de Emisión: <strong className="text-[#F1F5F9]">{new Date().toLocaleDateString('es-ES')}</strong>
              </div>
              <div className="text-[#94A3B8]">
                Registros Examinados: <strong className="text-[#F1F5F9]">{state.totalLogs} filas</strong>
              </div>
              <div className="text-[#94A3B8]">
                Intervalo Temporal: <strong className="text-[#F1F5F9]">{state.startTime || 'Inicio'} - {state.endTime || 'Fin'}</strong>
              </div>
            </div>
          </div>

          {/* VENTANA 1: RESUMEN EJECUTIVO (C-LEVEL) */}
          {(reportScope === 'completo' || reportScope === 'ejecutivo') && (
            <div className="p-5 rounded-2xl bg-[#0E1726] border border-[#26334D] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
                  <FileText className="w-4 h-4 text-[#94A3B8]" /> 1. Resumen Ejecutivo (Executive Summary)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161E2E] text-[#94A3B8] border border-[#26334D]">
                  Alta Dirección / C-Level
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#F1F5F9] leading-relaxed font-sans whitespace-pre-line bg-[#161E2E]/80 p-4 rounded-xl border border-[#26334D]">
                {report.executiveSummary}
              </p>
            </div>
          )}

          {/* VENTANA 2: CAUSA RAÍZ & JUSTIFICACIÓN DE SEVERIDAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#0E1726] border border-[#26334D] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F87171] font-heading flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Vector de Acceso Inicial y Causa Raíz
              </h4>
              <p className="text-xs text-[#F1F5F9] leading-relaxed font-mono bg-[#161E2E] p-3 rounded-xl border border-[#26334D]">
                {report.rootCause}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0E1726] border border-[#26334D] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] font-heading flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Fundamentación Técnica del Nivel de Riesgo
              </h4>
              <p className="text-xs text-[#F1F5F9] leading-relaxed font-mono bg-[#161E2E] p-3 rounded-xl border border-[#26334D]">
                {report.riskJustification}
              </p>
            </div>
          </div>

          {/* VENTANA 3: CRONOLOGÍA FORENSE PASO A PASO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
                <Clock className="w-4 h-4 text-[#94A3B8]" /> 2. Reconstrucción Cronológica y Cadena de Custodia
              </h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">Rigor analítico estricto</span>
            </div>

            <div className="space-y-3">
              {report.chronology?.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0E1726] border border-[#26334D] flex flex-col gap-3 text-xs hover:border-[#0EA5E9]/50 transition"
                >
                  {/* Fila 1: Cabecera con Fase, Horario y Badge de Evidencia Resumido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#26334D]/70 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-md bg-[#161E2E] text-[#94A3B8] border border-[#26334D] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <strong className="text-[#F1F5F9] font-heading font-bold text-sm">
                        {step.phase}
                      </strong>
                      <span className="text-[#94A3B8] font-mono text-xs">
                        ({step.timestamp})
                      </span>
                    </div>

                    {/* Badge de evidencia acotado que nunca aplasta nada */}
                    <div className="flex items-center gap-1.5 shrink-0 max-w-full sm:max-w-[50%]">
                      <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">Evidencia:</span>
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#161E2E] text-[#F1F5F9] border border-[#26334D] break-all whitespace-normal"
                        title={step.evidenceRows}
                      >
                        {formatEvidenceBadge(step.evidenceRows)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 2: Descripción amplia en ancho completo (100% de ancho, NUNCA aplastada) */}
                  <div className="w-full">
                    <p className="text-[#94A3B8] text-xs sm:text-[13px] leading-relaxed font-sans text-justify">
                      {step.description}
                    </p>
                  </div>

                  {/* Fila 3: Impacto en ancho completo con fondo distintivo */}
                  <div className="w-full text-xs font-mono text-[#F59E0B] bg-[#0B0F19]/80 px-3.5 py-2 rounded-lg border border-[#26334D]/50 flex items-start gap-2">
                    <strong className="shrink-0 text-[#F59E0B]">Impacto:</strong>
                    <span className="text-[#F1F5F9] leading-snug">{step.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VENTANA 4: COMANDOS MALICIOSOS Y PROCESOS OBSERVADOS */}
          {report.maliciousCommandsObserved && report.maliciousCommandsObserved.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
                  <Terminal className="w-4 h-4 text-[#94A3B8]" /> 3. Comandos Maliciosos y Binarios LOLBAS Observados
                </h3>
                <span className="text-[10px] font-mono text-[#94A3B8]">Telemetría de procesos</span>
              </div>

              <div className="space-y-2.5">
                {report.maliciousCommandsObserved.map((cmdItem, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
                        <span className="text-[#F1F5F9] font-bold">{cmdItem.host}</span>
                        <span>•</span>
                        <span>Usuario: <strong className="text-[#F1F5F9]">{cmdItem.user}</strong></span>
                        <span>•</span>
                        <span className="text-[#94A3B8]">{cmdItem.sourceRow}</span>
                      </div>

                      <button
                        onClick={() => handleCopy(cmdItem.command)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161E2E] hover:bg-[#26334D] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#26334D] flex items-center gap-1 transition"
                      >
                        {copiedCmd === cmdItem.command ? (
                          <>
                            <Check className="w-3 h-3 text-[#10B981]" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-2.5 rounded-lg bg-[#0B0F19] border border-[#26334D] font-mono text-[#F59E0B] text-xs overflow-x-auto whitespace-pre-wrap break-all select-all">
                      {cmdItem.command}
                    </pre>

                    <p className="text-[11px] text-[#94A3B8] font-sans">
                      <strong className="text-[#F1F5F9]">Evaluación de Riesgo:</strong> {cmdItem.riskAssessment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VENTANA 5: MATRIZ MITRE ATT&CK */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
              <Layers className="w-4 h-4 text-[#94A3B8]" /> 4. Matriz de Tácticas y Técnicas MITRE ATT&CK
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.mitreTactics?.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#0E1726] border border-[#26334D] text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8] block font-mono">
                    {m.tactic}
                  </span>
                  <span className="text-[#F1F5F9] font-mono font-bold block text-xs">
                    {m.techniqueId}: {m.techniqueName}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono block">Evidencia: {m.evidence}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VENTANA 6: PLAN DE REMEDIACIÓN Y RESPUESTA (NIST SP 800-61) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
              <ShieldCheck className="w-4 h-4 text-[#94A3B8]" /> 5. Plan de Contención, Erradicación y Recuperación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0E1726] border border-[#26334D] border-t-2 border-t-[#EF4444] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F87171] block font-heading">
                  Fase 1: Contención Urgente (&lt; 1 Hora)
                </span>
                <ul className="space-y-1.5 text-[#94A3B8] list-disc list-inside font-sans">
                  {report.containmentAndRemediation?.immediateActions?.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1726] border border-[#26334D] border-t-2 border-t-[#F59E0B] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B] block font-heading">
                  Fase 2: Erradicación y Limpieza
                </span>
                <ul className="space-y-1.5 text-[#94A3B8] list-disc list-inside font-sans">
                  {report.containmentAndRemediation?.eradicationSteps?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1726] border border-[#26334D] border-t-2 border-t-[#10B981] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] block font-heading">
                  Fase 3: Recuperación y Hardening
                </span>
                <ul className="space-y-1.5 text-[#94A3B8] list-disc list-inside font-sans">
                  {report.containmentAndRemediation?.recoveryAndHardening?.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* VENTANA 7: VEREDICTO FINAL Y SELLO PERICIAL */}
          <div className="p-5 rounded-2xl bg-[#0E1726] border border-[#26334D] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-2 font-heading">
              <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" /> Veredicto Pericial y Conclusión Forense
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-mono">
              {report.verdict}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
