import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  Terminal,
  Shuffle,
  EyeOff,
  UserX,
  TrendingUp,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Server,
  User,
  CheckCircle,
} from 'lucide-react';
import { AlertCategory, AlertSeverity, SecurityAlert, SIEMAnalysisState } from '../types/siem';

interface FindingsTabProps {
  state: SIEMAnalysisState;
  activeCategoryFilter?: AlertCategory | 'all';
  onInspectRow: (rowId: number) => void;
}

export const FindingsTab: React.FC<FindingsTabProps> = ({
  state,
  activeCategoryFilter = 'all',
  onInspectRow,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'all'>(
    activeCategoryFilter
  );
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { key: AlertCategory | 'all'; name: string; count: number }[] = [
    { key: 'all', name: 'Todas las Categorías', count: state.alerts.length },
    { key: 'fuerza_bruta', name: 'Fuerza Bruta', count: state.categoriesCount.fuerza_bruta || 0 },
    { key: 'inicios_sospechosos', name: 'Inicios Sospechosos', count: state.categoriesCount.inicios_sospechosos || 0 },
    { key: 'escalamiento', name: 'Escalamiento', count: state.categoriesCount.escalamiento || 0 },
    { key: 'comandos_procesos', name: 'Comandos y Procesos', count: state.categoriesCount.comandos_procesos || 0 },
    { key: 'movimiento_lateral', name: 'Movimiento Lateral', count: state.categoriesCount.movimiento_lateral || 0 },
    { key: 'otras_anomalias', name: 'Otras Anomalías', count: state.categoriesCount.otras_anomalias || 0 },
  ];

  const severities: { key: AlertSeverity | 'all'; name: string }[] = [
    { key: 'all', name: 'Todas' },
    { key: 'critico', name: 'Crítico' },
    { key: 'alto', name: 'Alto' },
    { key: 'medio', name: 'Medio' },
    { key: 'bajo', name: 'Bajo' },
  ];

  // Filtrado de alertas
  const filteredAlerts = state.alerts.filter((alert) => {
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText =
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.technicalJustification.toLowerCase().includes(q) ||
        (alert.mitreTechniqueName && alert.mitreTechniqueName.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critico':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-transparent text-[#F87171] border border-[#EF4444]">
            Crítico
          </span>
        );
      case 'alto':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-[#F59E0B] text-[#0B0F19]">
            Alto
          </span>
        );
      case 'medio':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-[#D97706]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            Medio
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
            Bajo
          </span>
        );
    }
  };

  const getCategoryColor = (category: AlertCategory) => {
    switch (category) {
      case 'fuerza_bruta':
        return 'text-[#F59E0B]';
      case 'inicios_sospechosos':
        return 'text-[#38BDF8]';
      case 'escalamiento':
        return 'text-purple-300';
      case 'comandos_procesos':
        return 'text-[#F87171]';
      case 'movimiento_lateral':
        return 'text-[#38BDF8]';
      case 'otras_anomalias':
        return 'text-[#F87171]';
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'fuerza_bruta':
        return <Flame className="w-4 h-4 text-[#F59E0B]" />;
      case 'inicios_sospechosos':
        return <UserX className="w-4 h-4 text-[#38BDF8]" />;
      case 'escalamiento':
        return <TrendingUp className="w-4 h-4 text-purple-300" />;
      case 'comandos_procesos':
        return <Terminal className="w-4 h-4 text-[#F87171]" />;
      case 'movimiento_lateral':
        return <Shuffle className="w-4 h-4 text-[#38BDF8]" />;
      case 'otras_anomalias':
        return <EyeOff className="w-4 h-4 text-[#F87171]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Barra de Filtros (#161E2E) */}
      <div className="p-5 rounded-xl bg-[#161E2E] border border-[#26334D] space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2 font-heading">
              <ShieldAlert className="w-4 h-4 text-[#94A3B8]" />
              Hallazgos de Seguridad y Correlación de Amenazas
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {filteredAlerts.length} de {state.alerts.length} alertas identificadas en los registros
            </p>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en hallazgos, MITRE o IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1726] text-[#F1F5F9] pl-9 pr-3 py-1.5 rounded-lg border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-sans placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Categorías Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition flex items-center gap-1.5 ${
                selectedCategory === c.key
                  ? 'bg-[#0EA5E9] text-[#0B0F19] shadow-sm font-bold'
                  : 'bg-[#0E1726] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#26334D]'
              }`}
            >
              <span>{c.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === c.key
                    ? 'bg-[#0B0F19] text-[#0EA5E9]'
                    : 'bg-[#161E2E] text-[#94A3B8]'
                }`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Severidad Filtro */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#26334D] text-xs">
          <span className="text-[#94A3B8] font-medium flex items-center gap-1 font-mono">
            <Filter className="w-3 h-3 text-[#94A3B8]" /> Severidad:
          </span>
          <div className="flex items-center gap-1">
            {severities.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedSeverity(s.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  selectedSeverity === s.key
                    ? 'bg-[#0E1726] text-[#F1F5F9] font-bold border border-[#0EA5E9]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#161E2E] border border-[#26334D]">
          <CheckCircle className="w-10 h-10 mx-auto text-[#10B981] mb-2 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-[#F1F5F9] font-heading">No se encontraron alertas en este filtro</h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            Intenta seleccionar otra categoría o reiniciar los términos de búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#0EA5E9]/60 transition space-y-4 shadow-lg"
            >
              {/* Header de la Alerta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <span
                      className={`flex items-center gap-1 text-xs font-mono font-medium ${getCategoryColor(
                        alert.category
                      )}`}
                    >
                      {getCategoryIcon(alert.category)}
                      {alert.category.replace('_', ' ').toUpperCase()}
                    </span>
                    {alert.mitreTechniqueId && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0E1726] text-[#94A3B8] border border-[#26334D]">
                        MITRE {alert.mitreTechniqueId}: {alert.mitreTechniqueName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#F1F5F9] tracking-tight mt-1 font-heading">
                    {alert.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[#94A3B8]" /> {alert.firstSeen}
                  </span>
                  {alert.lastSeen !== alert.firstSeen && (
                    <span className="text-[10px] text-[#94A3B8] font-mono block">
                      Hasta: {alert.lastSeen}
                    </span>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#0E1726] p-3 rounded-lg border border-[#26334D] font-sans">
                {alert.description}
              </p>

              {/* Justificación Técnica con Rigor Forense */}
              <div className="p-3 rounded-lg bg-[#0E1726]/80 border border-[#26334D] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block font-mono">
                  Justificación Técnica y Criterio de Riesgo:
                </span>
                <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                  {alert.technicalJustification}
                </p>
              </div>

              {/* Entidades Afectadas y Chips de Evidencia en Registros */}
              <div className="pt-2 border-t border-[#26334D] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                {/* Entidades */}
                <div className="flex items-center gap-3 flex-wrap text-[#94A3B8]">
                  {alert.entities.sourceIps && alert.entities.sourceIps.length > 0 && (
                    <span className="flex items-center gap-1 font-mono">
                      <strong className="text-[#F1F5F9] font-sans">IP Origen:</strong>{' '}
                      <span className="text-[#F87171]">{alert.entities.sourceIps.join(', ')}</span>
                    </span>
                  )}
                  {alert.entities.users && alert.entities.users.length > 0 && (
                    <span className="flex items-center gap-1 font-mono">
                      <User className="w-3 h-3 text-[#94A3B8]" />
                      <span className="text-[#F1F5F9]">{alert.entities.users.join(', ')}</span>
                    </span>
                  )}
                  {alert.entities.hosts && alert.entities.hosts.length > 0 && (
                    <span className="flex items-center gap-1 font-mono">
                      <Server className="w-3 h-3 text-[#94A3B8]" />
                      <span className="text-[#F1F5F9]">{alert.entities.hosts.join(', ')}</span>
                    </span>
                  )}
                </div>

                {/* Chips de Evidencia Exacta en el Registro */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8] font-mono">
                    Evidencia:
                  </span>
                  {alert.rowIds.map((rowId) => (
                    <button
                      key={rowId}
                      onClick={() => onInspectRow(rowId)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0E1726] hover:bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#26334D] hover:border-[#0EA5E9] transition flex items-center gap-1"
                      title="Ver fila exacta en el archivo de registro"
                    >
                      #Fila {rowId}
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
