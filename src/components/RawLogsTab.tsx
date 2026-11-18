import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AlertSeverity, RawLogEntry, SIEMAnalysisState } from '../types/siem';

interface RawLogsTabProps {
  state: SIEMAnalysisState;
  onInspectRow: (rowId: number) => void;
}

const PAGE_SIZE = 25;

export const RawLogsTab: React.FC<RawLogsTabProps> = ({ state, onInspectRow }) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrado
  const filteredLogs = useMemo(() => {
    return state.rawLogs.filter((log) => {
      if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = `${log.rowId} ${log.timestamp} ${log.user || ''} ${log.host || ''} ${
          log.sourceIp || ''
        } ${log.destinationIp || ''} ${log.processOrCommand || ''} ${log.details || ''} ${
          log.action || ''
        }`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [state.rawLogs, search, severityFilter, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const handleExportCsv = () => {
    if (!filteredLogs.length) return;
    const headers = [
      'Log_ID',
      'Timestamp',
      'Hostname',
      'Event_ID',
      'User',
      'Source_IP',
      'Destination',
      'Log_Source',
      'Event_Description',
      'Process_CommandLine',
      'Result',
      'Severity',
    ];

    const rows = filteredLogs.map((l) => [
      l.logId || `EVT-${String(l.rowId).padStart(5, '0')}`,
      `"${l.timestamp}"`,
      `"${l.hostname || l.host || ''}"`,
      l.eventId || '',
      `"${l.user || ''}"`,
      l.sourceIp || '',
      `"${l.destination || l.destinationIp || ''}"`,
      `"${l.logSource || 'System'}"`,
      `"${(l.eventDescription || l.details || l.action || '').replace(/"/g, '""')}"`,
      `"${(l.processCommandLine || l.processOrCommand || '').replace(/"/g, '""')}"`,
      l.result || l.status || 'Success',
      l.severityRaw || (l.severity === 'critico' ? 'Critical' : l.severity === 'alto' ? 'High' : l.severity === 'medio' ? 'Medium' : 'Informational'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Logs_SIEM_12_Columnas_${state.fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity?: AlertSeverity, severityRaw?: string) => {
    const label = severityRaw || (severity === 'critico' ? 'Critical' : severity === 'alto' ? 'High' : severity === 'medio' ? 'Medium' : 'Informational');
    switch (severity) {
      case 'critico':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-transparent text-[#F87171] border border-[#EF4444]">
            {label}
          </span>
        );
      case 'alto':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#F59E0B] text-[#0B0F19]">
            {label}
          </span>
        );
      case 'medio':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#D97706]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            {label}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#94A3B8] bg-[#0E1726] border border-[#26334D]">
            {label}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles y Búsqueda */}
      <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Log_ID, usuario, IP, comando, host..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0E1726] text-[#F1F5F9] pl-9 pr-3 py-1.5 rounded-lg border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono placeholder:text-[#94A3B8]"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-[#0E1726] text-[#F1F5F9] text-xs rounded-lg px-2.5 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9]"
          >
            <option value="all">Todas las Severidades</option>
            <option value="critico">Critical (Crítico)</option>
            <option value="alto">High (Alto)</option>
            <option value="medio">Medium (Medio)</option>
            <option value="bajo">Low / Informational</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#0E1726] text-[#F1F5F9] text-xs rounded-lg px-2.5 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] hidden sm:block"
          >
            <option value="all">Todos los Resultados</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="ALERT">ALERT</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-between">
          <span className="text-xs text-[#94A3B8] font-mono">
            {filteredLogs.length} registros (Esquema 12 columnas)
          </span>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0E1726] hover:bg-[#161E2E] text-[#F1F5F9] border border-[#26334D] flex items-center gap-1.5 transition"
            title="Exportar registros filtrados a archivo CSV estándar de 12 columnas"
          >
            <Download className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Exportar CSV (12 Col)</span>
          </button>
        </div>
      </div>

      {/* Tabla de Registros: Estándar Forense de 12 Columnas */}
      <div className="rounded-xl border border-[#26334D] bg-[#161E2E] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0E1726] border-b border-[#26334D] text-[11px] text-[#94A3B8] uppercase font-mono tracking-wider whitespace-nowrap">
                <th className="py-3 px-3 w-28">1. Log_ID</th>
                <th className="py-3 px-3 w-40">2. Timestamp</th>
                <th className="py-3 px-3 w-28">3. Hostname</th>
                <th className="py-3 px-3 w-24">4. Event_ID</th>
                <th className="py-3 px-3 w-36">5. User</th>
                <th className="py-3 px-3 w-32">6. Source_IP</th>
                <th className="py-3 px-3 w-28">7. Destination</th>
                <th className="py-3 px-3 w-28">8. Log_Source</th>
                <th className="py-3 px-3 min-w-[200px]">9. Event_Description</th>
                <th className="py-3 px-3 min-w-[220px]">10. Process_CommandLine</th>
                <th className="py-3 px-3 w-24 text-center">11. Result</th>
                <th className="py-3 px-3 w-28 text-center">12. Severity</th>
                <th className="py-3 px-3 w-14 text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26334D]/60 font-mono">
              {currentLogs.map((log) => {
                const isCritical = log.severity === 'critico';
                const isFail = log.result === 'Failure' || log.status === 'FAILURE' || log.status === 'ALERT';
                const logIdDisplay = log.logId || `EVT-${String(log.rowId).padStart(5, '0')}`;

                return (
                  <tr
                    key={log.rowId}
                    onClick={() => onInspectRow(log.rowId)}
                    className={`hover:bg-[#0E1726]/80 cursor-pointer transition ${
                      isCritical ? 'bg-[#EF4444]/10' : ''
                    }`}
                  >
                    {/* 1. Log_ID */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] font-bold whitespace-nowrap">
                      {logIdDisplay}
                    </td>

                    {/* 2. Timestamp */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>

                    {/* 3. Hostname */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] font-bold whitespace-nowrap">
                      {log.hostname || log.host || '-'}
                    </td>

                    {/* 4. Event_ID */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] font-bold whitespace-nowrap">
                      {log.eventId || '-'}
                    </td>

                    {/* 5. User */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] truncate max-w-[140px]" title={log.user}>
                      {log.user || '-'}
                    </td>

                    {/* 6. Source_IP */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] whitespace-nowrap">
                      {log.sourceIp || '-'}
                    </td>

                    {/* 7. Destination */}
                    <td className="py-2.5 px-3 text-[#F1F5F9] whitespace-nowrap">
                      {log.destination || log.destinationIp || '-'}
                    </td>

                    {/* 8. Log_Source */}
                    <td className="py-2.5 px-3 text-[#94A3B8] whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0E1726] border border-[#26334D]">
                        {log.logSource || 'System'}
                      </span>
                    </td>

                    {/* 9. Event_Description */}
                    <td className="py-2.5 px-3 text-[#94A3B8] max-w-xs truncate" title={log.eventDescription || log.details || log.action}>
                      {log.eventDescription || log.details || log.action || '-'}
                    </td>

                    {/* 10. Process_CommandLine */}
                    <td className="py-2.5 px-3 text-[#F59E0B] max-w-sm truncate" title={log.processCommandLine || log.processOrCommand}>
                      {log.processCommandLine || log.processOrCommand ? (
                        <code className="bg-[#0B0F19] px-1.5 py-0.5 rounded border border-[#26334D] text-[11px]">
                          {log.processCommandLine || log.processOrCommand}
                        </code>
                      ) : (
                        <span className="text-[#94A3B8] italic">N/A</span>
                      )}
                    </td>

                    {/* 11. Result */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFail
                            ? 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30'
                            : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                        }`}
                      >
                        {log.result || log.status || 'Success'}
                      </span>
                    </td>

                    {/* 12. Severity */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getSeverityBadge(log.severity, log.severityRaw)}
                    </td>

                    {/* Ver */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectRow(log.rowId);
                        }}
                        className="p-1 rounded text-[#0EA5E9] hover:text-[#38BDF8] hover:bg-[#0E1726] transition"
                        title="Inspeccionar registro completo"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 py-3 border-t border-[#26334D] bg-[#0E1726] flex items-center justify-between text-xs">
          <span className="text-[#94A3B8] font-mono">
            Página {currentPage} de {totalPages} (Mostrando {currentLogs.length} registros)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#161E2E] border border-[#26334D] text-[#F1F5F9] hover:bg-[#26334D] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono text-[#F1F5F9] font-bold bg-[#161E2E] rounded border border-[#26334D]">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#161E2E] border border-[#26334D] text-[#F1F5F9] hover:bg-[#26334D] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
