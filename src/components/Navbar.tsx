import React from 'react';
import {
  Cpu,
  FileSpreadsheet,
  FileDown,
  Sparkles,
  Download,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import { SIEMAnalysisState } from '../types/siem';

interface NavbarProps {
  state: SIEMAnalysisState;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  onDownloadSample: () => void;
  onExportPdf: () => void;
  onRunAiAnalysis: () => void;
  onOpenSeverityInfo: () => void;
  isAiLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  onOpenUpload,
  onLoadSample,
  onDownloadSample,
  onExportPdf,
  onRunAiAnalysis,
  onOpenSeverityInfo,
  isAiLoading,
}) => {
  const getRiskBadge = () => {
    switch (state.overallRisk) {
      case 'critico':
        return (
          <button
            onClick={onOpenSeverityInfo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EF4444] text-[#0B0F19] border border-[#EF4444] hover:brightness-110 transition shadow-sm font-mono group"
            title="Ver desglose del cálculo de severidad"
          >
            <span className="w-2 h-2 rounded-full bg-[#0B0F19] animate-pulse"></span>
            <span>Riesgo Crítico ({state.riskScore}/100)</span>
            <HelpCircle className="w-3 h-3 text-[#0B0F19]/70 group-hover:text-[#0B0F19]" />
          </button>
        );
      case 'alto':
        return (
          <button
            onClick={onOpenSeverityInfo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F59E0B] text-[#0B0F19] border border-[#F59E0B] hover:brightness-110 transition shadow-sm font-mono group"
            title="Ver desglose del cálculo de severidad"
          >
            <span className="w-2 h-2 rounded-full bg-[#0B0F19]"></span>
            <span>Riesgo Alto ({state.riskScore}/100)</span>
            <HelpCircle className="w-3 h-3 text-[#0B0F19]/70 group-hover:text-[#0B0F19]" />
          </button>
        );
      case 'medio':
        return (
          <button
            onClick={onOpenSeverityInfo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/40 hover:bg-[#EAB308]/25 transition shadow-sm font-mono group"
            title="Ver desglose del cálculo de severidad"
          >
            <span className="w-2 h-2 rounded-full bg-[#EAB308]"></span>
            <span>Riesgo Medio ({state.riskScore}/100)</span>
            <HelpCircle className="w-3 h-3 text-[#EAB308]/80 group-hover:text-[#EAB308]" />
          </button>
        );
      default:
        return (
          <button
            onClick={onOpenSeverityInfo}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 hover:bg-[#10B981]/25 transition shadow-sm font-mono group"
            title="Ver desglose del cálculo de severidad"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>Riesgo Bajo ({state.riskScore}/100)</span>
            <HelpCircle className="w-3 h-3 text-[#10B981]/80 group-hover:text-[#10B981]" />
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/95 backdrop-blur-md border-b border-[#26334D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand: CortexDFIR Agent */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black tracking-tight shrink-0 border border-cyan-400/30">
            <Cpu className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-heading">
                Cortex<span className="text-cyan-400">DFIR</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#0E1726] text-[#94A3B8] border border-[#26334D] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Agente IA
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate max-w-[200px] sm:max-w-xs font-mono">
              Para Informáticos & SecOps • {state.fileName}
            </p>
          </div>
        </div>

        {/* Center: Risk Badge with info popover */}
        <div className="hidden md:flex items-center gap-2">
          {getRiskBadge()}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cargar Archivo */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161E2E] hover:bg-[#1E293B] text-[#F1F5F9] border border-[#26334D] transition"
            title="Importar archivo Excel (.xlsx, .xls o .csv)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span className="hidden sm:inline">Subir Excel</span>
          </button>

          {/* Cargar Caso de Ejemplo */}
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0EA5E9]/15 hover:bg-[#0EA5E9]/25 text-[#38BDF8] border border-[#0EA5E9]/40 transition"
            title="Cargar incidente de prueba completo con APT Kill Chain"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden md:inline">Caso Demo</span>
          </button>

          {/* Plantilla Excel */}
          <button
            onClick={onDownloadSample}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0E1726] hover:bg-[#161E2E] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#26334D] transition font-mono"
            title="Descargar plantilla de Excel para estructurar logs"
          >
            <Download className="w-3 h-3" />
            <span>Plantilla</span>
          </button>

          {/* Exportar PDF */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/40 transition shadow-sm"
            title="Descargar informe forense formal en PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-[#F87171]" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
