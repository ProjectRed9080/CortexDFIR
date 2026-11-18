import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Clock,
  FileSpreadsheet,
  FileText,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { AlertCategory, RawLogEntry, SIEMAnalysisState } from './types/siem';
import { SAMPLE_FORENSIC_LOGS } from './services/sampleDataset';
import { analyzeLogsDeterministically } from './services/correlationEngine';
import { downloadSampleExcelFile } from './services/excelParser';
import { generateIncidentPdf } from './services/pdfExporter';

import { Navbar } from './components/Navbar';
import { UploadModal } from './components/UploadModal';
import { LogDetailModal } from './components/LogDetailModal';
import { SeverityModal } from './components/SeverityModal';
import { DashboardTab } from './components/DashboardTab';
import { FindingsTab } from './components/FindingsTab';
import { TimelineTab } from './components/TimelineTab';
import { RawLogsTab } from './components/RawLogsTab';
import { ReportTab } from './components/ReportTab';
import { ForensicChatTab } from './components/ForensicChatTab';

export default function App() {
  // Inicialización con dataset de prueba forense SIN informe pre-generado (a decisión del usuario)
  const [state, setState] = useState<SIEMAnalysisState>(() => {
    const base = analyzeLogsDeterministically(SAMPLE_FORENSIC_LOGS, 'Incidente_APT_MultiEtapa.xlsx');
    return {
      ...base,
      report: undefined, // El usuario decide cuándo generar el informe técnico
    };
  });

  // fileSessionKey cambia con cada carga de archivo para remontar el Chat y el Informe limpiamente
  const [fileSessionKey, setFileSessionKey] = useState<string>('initial');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AlertCategory | 'all'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSeverityModalOpen, setIsSeverityModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [inspectedLog, setInspectedLog] = useState<RawLogEntry | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Manejador al cargar un nuevo archivo Excel o CSV
  const handleLogsLoaded = (logs: RawLogEntry[], fileName: string) => {
    const analyzed = analyzeLogsDeterministically(logs, fileName);
    setState({
      ...analyzed,
      report: undefined, // Reiniciar informe para que el usuario decida emitirlo
    });
    // Nueva sesión: fuerza remontado limpio del Informe y del Chat
    setFileSessionKey(`${fileName}-${Date.now()}`);
    setActiveTab('dashboard');
    setActiveCategoryFilter('all');
  };

  // Manejador para recargar dataset muestra
  const handleLoadSample = () => {
    const analyzed = analyzeLogsDeterministically(
      SAMPLE_FORENSIC_LOGS,
      'Incidente_APT_MultiEtapa.xlsx'
    );
    setState({
      ...analyzed,
      report: undefined,
    });
    // Nueva sesión al recargar muestra también
    setFileSessionKey(`sample-${Date.now()}`);
  };

  // Manejador para ejecutar la emisión del informe técnico (por solicitud explícita del usuario)
  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const criticalSample = state.rawLogs
        .filter(
          (l) =>
            (l.detectedAlerts && l.detectedAlerts.length > 0) ||
            l.severity === 'critico' ||
            l.severity === 'alto' ||
            l.status === 'FAILURE'
        )
        .slice(0, 80);

      const response = await fetch('/api/gemini/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentsSummary: {
            categoriesCount: state.categoriesCount,
            severityCount: state.severityCount,
            overallRisk: state.overallRisk,
            compromisedUsers: state.compromisedUsers,
            attackerIps: state.attackerIps,
            affectedHosts: state.affectedHosts,
          },
          criticalEventsSample: criticalSample,
          metadata: {
            fileName: state.fileName,
            totalRows: state.totalLogs,
            timeRange: `${state.startTime} a ${state.endTime}`,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setState((prev) => ({
          ...prev,
          report: {
            ...data.analysis,
            analyzedAt: new Date().toISOString(),
            modelUsed: 'gemini-3.8-flash',
          },
        }));
        setActiveTab('report');
      } else {
        setAiError(data.error || 'Error al procesar el dictamen pericial.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || 'Error de comunicación con el servicio de análisis.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Resetear informe a la vista de configuración
  const handleResetReport = () => {
    setState((prev) => ({
      ...prev,
      report: undefined,
    }));
  };

  // Inspección de un registro específico
  const handleInspectRow = (rowId: number) => {
    const target = state.rawLogs.find((l) => l.rowId === rowId);
    if (target) {
      setInspectedLog(target);
    }
  };

  // Exportar PDF
  const handleExportPdf = () => {
    generateIncidentPdf(state, state.report);
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'findings',
      label: 'Hallazgos & Amenazas',
      icon: ShieldAlert,
      badge: state.alerts.length,
    },
    { id: 'timeline', label: 'Línea de Tiempo', icon: Clock },
    {
      id: 'raw_logs',
      label: 'Registros Crudos',
      icon: FileSpreadsheet,
      badge: state.totalLogs,
    },
    {
      id: 'report',
      label: 'Informe Técnico & PDF',
      icon: FileText,
      highlight: Boolean(state.report),
    },
    { id: 'forensic_chat', label: 'Asistente Forense IA', icon: Bot, isAi: true },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col font-sans selection:bg-[#0EA5E9]/30 selection:text-cyan-200">
      {/* Navbar Superior */}
      <Navbar
        state={state}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadSample={handleLoadSample}
        onDownloadSample={downloadSampleExcelFile}
        onExportPdf={handleExportPdf}
        onRunAiAnalysis={handleRunAiAnalysis}
        onOpenSeverityInfo={() => setIsSeverityModalOpen(true)}
        isAiLoading={isAiLoading}
      />

      {/* Barra de Pestañas Principal */}
      <div className="bg-[#0E1726] border-b border-[#26334D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition font-heading tracking-wide ${
                    isActive
                      ? 'bg-[#161E2E] text-[#38BDF8] border border-[#0EA5E9] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161E2E]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/40'
                          : 'bg-[#161E2E] text-[#94A3B8]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {tab.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Alerta de Error si ocurre */}
      {aiError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#F87171] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={() => setAiError(null)}
              className="text-xs text-[#F87171] hover:text-[#FCA5A5] font-bold px-2 py-0.5"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'dashboard' && (
          <DashboardTab
            state={state}
            onSelectTab={(tab) => setActiveTab(tab)}
            onFilterCategory={(cat) => {
              setActiveCategoryFilter(cat);
              setActiveTab('findings');
            }}
            onInspectRow={handleInspectRow}
            onOpenSeverityInfo={() => setIsSeverityModalOpen(true)}
          />
        )}

        {activeTab === 'findings' && (
          <FindingsTab
            state={state}
            activeCategoryFilter={activeCategoryFilter}
            onInspectRow={handleInspectRow}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab state={state} onInspectRow={handleInspectRow} />
        )}

        {activeTab === 'raw_logs' && (
          <RawLogsTab state={state} onInspectRow={handleInspectRow} />
        )}

        {activeTab === 'report' && (
          <ReportTab
            key={fileSessionKey}
            state={state}
            onRunAiAnalysis={handleRunAiAnalysis}
            onExportPdf={handleExportPdf}
            onResetReport={handleResetReport}
            isAiLoading={isAiLoading}
            onInspectRow={handleInspectRow}
          />
        )}

        {activeTab === 'forensic_chat' && (
          <ForensicChatTab key={fileSessionKey} state={state} onInspectRow={handleInspectRow} />
        )}
      </main>

      {/* Modales */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLogsLoaded={handleLogsLoaded}
        onLoadSample={handleLoadSample}
      />

      <SeverityModal
        isOpen={isSeverityModalOpen}
        onClose={() => setIsSeverityModalOpen(false)}
        state={state}
      />

      <LogDetailModal log={inspectedLog} onClose={() => setInspectedLog(null)} />
    </div>
  );
}
