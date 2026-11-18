import React from 'react';
import {
  Clock,
  Flame,
  Terminal,
  Shuffle,
  EyeOff,
  UserX,
  TrendingUp,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AlertCategory, SIEMAnalysisState } from '../types/siem';

interface TimelineTabProps {
  state: SIEMAnalysisState;
  onInspectRow: (rowId: number) => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ state, onInspectRow }) => {
  const incidentLogs = state.rawLogs
    .filter((l) => (l.detectedAlerts && l.detectedAlerts.length > 0) || l.severity === 'critico' || l.severity === 'alto')
    .sort((a, b) => a.rowId - b.rowId);

  const getCategoryBadge = (category: AlertCategory) => {
    switch (category) {
      case 'fuerza_bruta':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#F59E0B] bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <Flame className="w-3 h-3 text-[#F59E0B]" /> Fuerza Bruta
          </span>
        );
      case 'inicios_sospechosos':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#38BDF8] bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <UserX className="w-3 h-3 text-[#38BDF8]" /> Inicio Sospechoso
          </span>
        );
      case 'escalamiento':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-purple-300 bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <TrendingUp className="w-3 h-3 text-purple-300" /> Escalamiento
          </span>
        );
      case 'comandos_procesos':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#F87171] bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <Terminal className="w-3 h-3 text-[#F87171]" /> Comando / Proceso
          </span>
        );
      case 'movimiento_lateral':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#38BDF8] bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <Shuffle className="w-3 h-3 text-[#38BDF8]" /> Movimiento Lateral
          </span>
        );
      case 'otras_anomalias':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-[#F87171] bg-[#0E1726] px-2 py-0.5 rounded border border-[#26334D]">
            <EyeOff className="w-3 h-3 text-[#F87171]" /> Anomalía / Evasión
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="p-5 rounded-xl bg-[#161E2E] border border-[#26334D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2 font-heading">
            <Clock className="w-4 h-4 text-[#94A3B8]" />
            Línea de Tiempo Forense y Reconstrucción Cronológica
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Secuencia temporal exacta de eventos que componen el incidente ({incidentLogs.length} eventos clave)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] bg-[#0E1726] px-3 py-1.5 rounded-lg border border-[#26334D]">
          <span>{state.startTime || 'Inicio'}</span>
          <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
          <span>{state.endTime || 'Fin'}</span>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#0EA5E9] before:via-[#38BDF8] before:to-[#EF4444]">
        {incidentLogs.map((log) => {
          const isCritical = log.severity === 'critico';
          // Mostrar TODAS las categorías detectadas del evento, no solo la primera.
          // Así un salto lateral (movimiento_lateral) no queda oculto detrás de fuerza_bruta
          // cuando el motor le asignó varias etiquetas.
          const categories: AlertCategory[] = log.detectedAlerts?.length
            ? log.detectedAlerts
            : ['otras_anomalias'];

          return (
            <div key={log.rowId} className="relative group">
              {/* Dot en la línea temporal */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  isCritical
                    ? 'bg-[#0E1726] border-[#EF4444] text-[#F87171] shadow-md shadow-[#EF4444]/30'
                    : 'bg-[#0E1726] border-[#0EA5E9] text-[#0EA5E9]'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCritical ? 'bg-[#EF4444] animate-ping' : 'bg-[#0EA5E9]'
                  }`}
                />
              </div>

              {/* Contenedor del evento */}
              <div
                className={`p-4 rounded-xl border transition ${
                  isCritical
                    ? 'bg-[#161E2E] border-[#EF4444]/60 hover:border-[#EF4444]'
                    : 'bg-[#161E2E]/80 border-[#26334D] hover:border-[#0EA5E9]/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {categories.map((cat, idx) => (
                      <span key={idx} className="mr-2">
                        {getCategoryBadge(cat)}
                      </span>
                    ))}
                    <span className="font-mono text-xs font-bold text-[#F1F5F9]">
                      {log.action || `Evento ${log.eventId || 'Seguridad'}`}
                    </span>
                    <button
                      onClick={() => onInspectRow(log.rowId)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0E1726] hover:bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#26334D] flex items-center gap-1 transition"
                    >
                      #Fila {log.rowId} <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <span className="text-xs font-mono text-[#94A3B8] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#94A3B8]" />
                    {log.timestamp}
                  </span>
                </div>

                {/* Comando o Detalle */}
                {log.processOrCommand ? (
                  <div className="my-2 p-2 rounded bg-[#0E1726] border border-[#26334D] font-mono text-xs text-[#F59E0B] break-all select-all">
                    {log.processOrCommand}
                  </div>
                ) : null}

                {log.details && (
                  <p className="text-xs text-[#94A3B8] leading-relaxed mt-1 font-sans">
                    {log.details}
                  </p>
                )}

                {/* Footer del Evento */}
                <div className="mt-3 pt-2 border-t border-[#26334D] flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                  <div className="flex items-center gap-3">
                    {log.user && <span>Usuario: <strong className="text-[#F1F5F9]">{log.user}</strong></span>}
                    {log.host && <span>Host: <strong className="text-[#F1F5F9]">{log.host}</strong></span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {log.sourceIp && (
                      <span className="text-[#94A3B8]">
                        IP: <strong className="text-[#F1F5F9]">{log.sourceIp}</strong>
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.2 rounded uppercase text-[10px] font-bold ${
                        log.status === 'FAILURE' || log.status === 'ALERT'
                          ? 'text-[#F87171] bg-[#EF4444]/15'
                          : 'text-[#10B981] bg-[#10B981]/15'
                      }`}
                    >
                      {log.status || 'OK'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
