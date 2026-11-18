import React from 'react';
import {
  X,
  ShieldAlert,
  Server,
  User,
  Terminal,
  Activity,
  Copy,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { RawLogEntry } from '../types/siem';

interface LogDetailModalProps {
  log: RawLogEntry | null;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const handleCopyCmd = () => {
    if (log.processOrCommand) {
      navigator.clipboard.writeText(log.processOrCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSeverityBadge = () => {
    switch (log.severity) {
      case 'critico':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-transparent text-[#F87171] border border-[#EF4444] font-mono">
            Crítico
          </span>
        );
      case 'alto':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 font-mono">
            Alto
          </span>
        );
      case 'medio':
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/40 font-mono">
            Medio
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 font-mono">
            Informativo / Bajo
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161E2E] border border-[#26334D] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#26334D] flex items-center justify-between bg-[#0E1726]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0E1726] border border-[#26334D] flex items-center justify-center text-[#94A3B8]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F1F5F9] font-mono">
                  {log.logId || `EVT-${String(log.rowId).padStart(5, '0')}`}
                </h3>
                <span className="text-[10px] text-[#94A3B8] font-mono bg-[#0E1726] px-1.5 py-0.5 rounded border border-[#26334D]">
                  Fila #{log.rowId}
                </span>
                {getSeverityBadge()}
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 mt-0.5 font-mono">
                <Calendar className="w-3 h-3 text-[#94A3B8]" /> {log.timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0E1726] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Categorías detectadas */}
          {log.detectedAlerts && log.detectedAlerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30">
              <span className="text-[11px] font-bold text-[#F87171] uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Amenazas Correlacionadas en este Registro:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {log.detectedAlerts.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#F87171] text-[11px] font-mono border border-[#EF4444]/40 uppercase font-semibold"
                  >
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grid de Atributos del Estándar Forense de 12 Columnas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                1. Log_ID
              </span>
              <span className="font-mono font-bold text-[#F1F5F9] text-xs">
                {log.logId || `EVT-${String(log.rowId).padStart(5, '0')}`}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                3. Hostname
              </span>
              <span className="font-mono font-bold text-[#F1F5F9] text-xs truncate block">
                {log.hostname || log.host || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                4. Event_ID
              </span>
              <span className="font-mono font-bold text-[#F1F5F9] text-xs">
                {log.eventId || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                8. Log_Source
              </span>
              <span className="font-mono font-bold text-[#F1F5F9] text-xs truncate block">
                {log.logSource || 'System'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono flex items-center gap-1">
                <User className="w-3 h-3 text-[#94A3B8]" /> 5. User
              </span>
              <span className="font-mono font-semibold text-[#F1F5F9] text-xs truncate block">
                {log.user || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                6. Source_IP
              </span>
              <span className="font-mono text-[#F1F5F9] text-xs truncate block">
                {log.sourceIp || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                7. Destination
              </span>
              <span className="font-mono text-[#F1F5F9] text-xs truncate block">
                {log.destination || log.destinationIp || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] font-medium block text-[10px] uppercase font-mono">
                11. Result
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  log.result === 'Failure' || log.status === 'FAILURE' || log.status === 'ALERT'
                    ? 'text-[#F87171]'
                    : 'text-[#10B981]'
                }`}
              >
                {log.result || log.status || 'Success'}
              </span>
            </div>
          </div>

          {/* 9. Event_Description */}
          <div className="p-3.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
            <span className="text-[#94A3B8] font-mono uppercase text-[10px] block mb-1">
              9. Event_Description (Descripción de la Acción):
            </span>
            <p className="text-[#F1F5F9] leading-relaxed font-sans text-xs">
              {log.eventDescription || log.details || log.action || 'No especificada'}
            </p>
          </div>

          {/* 10. Process_CommandLine */}
          <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#26334D]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#94A3B8] font-mono uppercase text-[10px] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#94A3B8]" /> 10. Process_CommandLine:
              </span>
              {(log.processCommandLine || log.processOrCommand) && (
                <button
                  onClick={handleCopyCmd}
                  className="text-[#94A3B8] hover:text-[#F1F5F9] flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#161E2E] border border-[#26334D]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copiar
                    </>
                  )}
                </button>
              )}
            </div>
            <pre className="font-mono text-[#F59E0B] text-xs bg-[#0E1726] p-2.5 rounded border border-[#26334D] overflow-x-auto whitespace-pre-wrap break-all select-all">
              {log.processCommandLine || log.processOrCommand || 'N/A (Sin argumentos o no aplica)'}
            </pre>
          </div>

          {/* Datos crudos adicionales de la fila de Excel */}
          {log.rawData && Object.keys(log.rawData).length > 0 && (
            <div className="space-y-2">
              <span className="text-[#94A3B8] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#94A3B8]" /> Todos los Campos del Archivo Excel:
              </span>
              <div className="bg-[#0B0F19] rounded-lg p-3 border border-[#26334D] max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
                {Object.entries(log.rawData).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 py-1 border-b border-[#26334D]/50 last:border-0">
                    <span className="text-[#94A3B8] shrink-0 w-36">{key}:</span>
                    <span className="text-[#F1F5F9] break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#26334D] bg-[#0E1726] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#161E2E] hover:bg-[#1E293B] text-[#F1F5F9] border border-[#26334D] transition"
          >
            Cerrar Inspección
          </button>
        </div>
      </div>
    </div>
  );
};
