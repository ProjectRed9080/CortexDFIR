import React from 'react';
import {
  ShieldAlert,
  Flame,
  Terminal,
  Shuffle,
  EyeOff,
  UserX,
  Server,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  FileText,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { AlertCategory, AlertSeverity, SIEMAnalysisState } from '../types/siem';

interface DashboardTabProps {
  state: SIEMAnalysisState;
  onSelectTab: (tab: string) => void;
  onFilterCategory?: (category: AlertCategory) => void;
  onInspectRow: (rowId: number) => void;
  onOpenSeverityInfo: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  onSelectTab,
  onFilterCategory,
  onInspectRow,
  onOpenSeverityInfo,
}) => {
  const categoriesConfig: {
    key: AlertCategory;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeColor: string;
  }[] = [
    {
      key: 'fuerza_bruta',
      name: 'Fuerza Bruta',
      description: 'Ráfagas de fallos y ataques de Password Spraying contra servicios de autenticación',
      icon: Flame,
      accentColor: 'text-[#F59E0B]',
      badgeColor: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
    },
    {
      key: 'inicios_sospechosos',
      name: 'Inicios Sospechosos',
      description: 'Logons desde IPs externas, horarios nocturnos intempestivos o patrones anómalos',
      icon: UserX,
      accentColor: 'text-[#38BDF8]',
      badgeColor: 'bg-[#0EA5E9]/15 text-[#38BDF8] border-[#0EA5E9]/40',
    },
    {
      key: 'escalamiento',
      name: 'Escalamiento de Privilegios',
      description: 'Asignación no autorizada de privilegios, adición a grupos administradores y UAC Bypass',
      icon: TrendingUp,
      accentColor: 'text-purple-300',
      badgeColor: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
    },
    {
      key: 'comandos_procesos',
      name: 'Comandos y Procesos',
      description: 'Herramientas de reconocimiento, binarios LOLBAS, certutil y PowerShell ofuscado',
      icon: Terminal,
      accentColor: 'text-[#F87171]',
      badgeColor: 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40',
    },
    {
      key: 'movimiento_lateral',
      name: 'Movimiento Lateral',
      description: 'Propagación este-oeste hacia servidores internos mediante PsExec, WMI y SMB',
      icon: Shuffle,
      accentColor: 'text-[#38BDF8]',
      badgeColor: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40',
    },
    {
      key: 'otras_anomalias',
      name: 'Otras Anomalías y Evasión',
      description: 'Borrado deliberado de registros de auditoría (1102/104) y persistencia en el sistema',
      icon: EyeOff,
      accentColor: 'text-[#F87171]',
      badgeColor: 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Estado del Incidente (#161E2E con borde #26334D) */}
      <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#26334D] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-bold tracking-wider bg-transparent text-[#F87171] border border-[#EF4444]">
                Incidente Confirmado
              </span>
              <span className="text-[#94A3B8] text-xs font-mono">
                Intervalo: {state.startTime || 'Inicio'} &rarr; {state.endTime || 'Fin'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#F1F5F9] font-heading tracking-tight">
              Análisis Forense de Infraestructura:{' '}
              <span className="text-[#F8FAFC]">{state.fileName}</span>
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed font-sans">
              El motor de correlación forense ha examinado{' '}
              <strong className="text-[#F1F5F9]">{state.totalLogs} eventos</strong> y comprobado la
              secuencia de ataque (Cyber Kill Chain). Todos los hallazgos técnicos están respaldados
              estrictamente en los registros sin extrapolaciones ficticias.
            </p>
          </div>

          {/* Tarjeta de Severidad (#0E1726) */}
          <div
            onClick={onOpenSeverityInfo}
            className="flex items-center gap-4 shrink-0 bg-[#0E1726] p-4 rounded-xl border border-[#26334D] hover:border-[#0EA5E9] transition cursor-pointer group shadow-lg"
            title="Haz clic para ver el desglose y fórmula del cálculo de severidad"
          >
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold block flex items-center justify-end gap-1 font-mono">
                Puntaje de Severidad
                <HelpCircle className="w-3.5 h-3.5 text-[#0EA5E9] group-hover:text-[#38BDF8]" />
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black font-mono text-white">
                  {state.riskScore}
                </span>
                <span className="text-xs text-[#94A3B8] font-mono">/100</span>
              </div>
              <span className="text-[11px] font-bold uppercase text-[#F87171] font-mono block">
                Nivel {state.overallRisk}
              </span>
              <span className="text-[10px] text-[#0EA5E9] underline underline-offset-2 font-mono block mt-0.5">
                ¿En qué se basa?
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center text-[#F87171] shadow-inner group-hover:scale-105 transition">
              <AlertOctagon className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (#161E2E) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#0EA5E9]/40 transition">
          <span className="text-[#94A3B8] text-xs font-medium block">Total Registros</span>
          <span className="text-2xl font-bold font-mono text-[#F1F5F9] mt-1 block font-heading">
            {state.totalLogs}
          </span>
          <span className="text-[10px] text-[#94A3B8]">Filas analizadas</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#EF4444]/40 transition">
          <span className="text-[#F87171] text-xs font-medium block">Alertas Críticas</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block font-heading">
            {state.severityCount.critico}
          </span>
          <span className="text-[10px] text-[#94A3B8]">Máximo impacto</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#F59E0B]/40 transition">
          <span className="text-[#F59E0B] text-xs font-medium block">Alertas Altas</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block font-heading">
            {state.severityCount.alto}
          </span>
          <span className="text-[10px] text-[#94A3B8]">Movimientos maliciosos</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#0EA5E9]/40 transition">
          <span className="text-[#94A3B8] text-xs font-medium block">Cuentas Vulneradas</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block font-heading">
            {state.compromisedUsers.length}
          </span>
          <span className="text-[10px] text-[#94A3B8] truncate block">
            {state.compromisedUsers.slice(0, 2).join(', ') || 'Ninguna'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#0EA5E9]/40 transition">
          <span className="text-[#94A3B8] text-xs font-medium block">Hosts Objetivo</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block font-heading">
            {state.affectedHosts.length}
          </span>
          <span className="text-[10px] text-[#94A3B8] truncate block">
            {state.affectedHosts.slice(0, 2).join(', ') || 'N/A'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#26334D] hover:border-[#EF4444]/40 transition">
          <span className="text-[#F87171] text-xs font-medium block">IPs Atacantes</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block font-heading">
            {state.attackerIps.length}
          </span>
          <span className="text-[10px] text-[#94A3B8] truncate block">
            {state.attackerIps.slice(0, 1).join(', ') || 'Internas'}
          </span>
        </div>
      </div>

      {/* Grid de las 6 Categorías Requeridas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2 font-heading">
              <ShieldAlert className="w-4 h-4 text-[#94A3B8]" />
              Categorías de Detección Forense Requeridas
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Evaluación estricta de las 6 amenazas clave de la infraestructura
            </p>
          </div>
          <button
            onClick={() => onSelectTab('findings')}
            className="text-xs font-semibold text-[#0EA5E9] hover:text-[#38BDF8] flex items-center gap-1 transition"
          >
            Ver Detalle de Hallazgos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesConfig.map((cat) => {
            const count = state.categoriesCount[cat.key] || 0;
            const Icon = cat.icon;
            const hasAlerts = count > 0;

            return (
              <div
                key={cat.key}
                onClick={() => {
                  if (onFilterCategory) onFilterCategory(cat.key);
                  onSelectTab('findings');
                }}
                className={`p-5 rounded-xl border transition cursor-pointer group ${
                  hasAlerts
                    ? 'bg-[#161E2E] border-[#26334D] hover:border-[#0EA5E9]'
                    : 'bg-[#161E2E]/60 border-[#1E293B] hover:border-[#26334D]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D] group-hover:scale-105 transition">
                      <Icon className={`w-5 h-5 ${cat.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F1F5F9] group-hover:text-[#38BDF8] transition font-heading">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {count} {count === 1 ? 'evento correlacionado' : 'eventos correlacionados'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                      hasAlerts
                        ? 'bg-transparent text-[#F87171] border-[#EF4444]'
                        : 'bg-[#0E1726] text-[#94A3B8] border-[#26334D]'
                    }`}
                  >
                    {hasAlerts ? 'POSITIVO' : 'LIMPIO'}
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8] mt-3 leading-relaxed line-clamp-2 font-sans">
                  {cat.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#26334D] flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Explorar evidencia</span>
                  <span className="font-semibold text-[#0EA5E9] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Inspeccionar &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección Inferior: IoCs y Alertas Correlacionadas Destacadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IoCs y Entidades */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-[#161E2E] border border-[#26334D] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2 font-heading">
              <Globe className="w-4 h-4 text-[#94A3B8]" />
              Indicadores de Compromiso (IoCs)
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0E1726] text-[#94A3B8] border border-[#26334D]">
              Confirmados
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* IPs atacantes */}
            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider block mb-1 font-mono">
                Direcciones IP Atacantes Detectadas
              </span>
              {state.attackerIps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {state.attackerIps.map((ip) => (
                    <span
                      key={ip}
                      className="px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#F87171] font-mono text-[11px] border border-[#EF4444]/40"
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#94A3B8] italic">No se observaron IPs públicas anómalas</span>
              )}
            </div>

            {/* Cuentas comprometidas */}
            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider block mb-1 font-mono">
                Cuentas de Usuario Comprometidas
              </span>
              {state.compromisedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {state.compromisedUsers.map((u) => (
                    <span
                      key={u}
                      className="px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-mono text-[11px] border border-[#F59E0B]/40"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#94A3B8] italic">Ningún usuario comprometido identificado</span>
              )}
            </div>

            {/* Equipos afectados */}
            <div className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D]">
              <span className="text-[#94A3B8] text-[10px] uppercase font-bold tracking-wider block mb-1 font-mono">
                Equipos y Servidores Involucrados
              </span>
              {state.affectedHosts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {state.affectedHosts.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded bg-[#0E1726] text-[#F1F5F9] font-mono text-[11px] border border-[#26334D]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#94A3B8] italic">Sin hosts específicos</span>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de Hallazgos Recientes y Acceso al Informe */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#161E2E] border border-[#26334D] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2 font-heading">
                <Activity className="w-4 h-4 text-[#94A3B8]" />
                Alertas Correlacionadas Destacadas
              </h3>
              <button
                onClick={() => onSelectTab('report')}
                className="text-xs font-bold text-[#0EA5E9] hover:text-[#38BDF8] flex items-center gap-1 font-mono"
              >
                <FileText className="w-3.5 h-3.5" /> Ir al Informe Completo
              </button>
            </div>

            <div className="space-y-2.5">
              {state.alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-[#0E1726] border border-[#26334D] flex items-start justify-between gap-3 hover:border-[#0EA5E9]/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-bold border ${
                          alert.severity === 'critico'
                            ? 'bg-transparent text-[#F87171] border-[#EF4444]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="text-xs font-bold text-[#F1F5F9] font-heading">{alert.title}</h4>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] line-clamp-1 font-sans">{alert.description}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {alert.rowIds.slice(0, 2).map((rid) => (
                      <button
                        key={rid}
                        onClick={() => onInspectRow(rid)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161E2E] hover:bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#26334D]"
                        title="Ver evidencia exacta en el log"
                      >
                        Fila #{rid}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#26334D] flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">
              ¿Deseas emitir el informe técnico pericial o descargar en PDF?
            </span>
            <button
              onClick={() => onSelectTab('report')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#0B0F19] flex items-center gap-1.5 transition shadow-sm font-heading"
            >
              <Sparkles className="w-3.5 h-3.5" /> Configurar & Emitir Dictamen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
