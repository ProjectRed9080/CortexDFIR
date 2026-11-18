import React from 'react';
import {
  X,
  ShieldAlert,
  Calculator,
  Flame,
  UserX,
  TrendingUp,
  Terminal,
  Shuffle,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SIEMAnalysisState } from '../types/siem';

interface SeverityModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SIEMAnalysisState;
}

export const SeverityModal: React.FC<SeverityModalProps> = ({
  isOpen,
  onClose,
  state,
}) => {
  if (!isOpen) return null;

  const scoreFactors = [
    {
      title: 'Evasión de Defensas & Destrucción de Evidencia',
      weight: '+35 pts',
      detected: state.categoriesCount.otras_anomalias > 0,
      icon: EyeOff,
      color: 'text-rose-400',
      description:
        'Borrado deliberado de registros de auditoría de Windows (Event ID 1102 / 104), eliminación de sombras (vssadmin delete shadows) o desactivación del firewall interno. Indica un adversario avanzado intentando encubrir su presencia.',
    },
    {
      title: 'Escalamiento de Privilegios & Volcado LSASS',
      weight: '+25 pts',
      detected: state.categoriesCount.escalamiento > 0,
      icon: TrendingUp,
      color: 'text-purple-300',
      description:
        'Adición ilegítima al grupo de Administradores locales/dominio, UAC Bypass (fodhelper) y volcado de memoria de LSASS (comsvcs.dll) para extraer credenciales en texto claro y hashes NTLM.',
    },
    {
      title: 'Movimiento Lateral a Activos Críticos',
      weight: '+20 pts',
      detected: state.categoriesCount.movimiento_lateral > 0,
      icon: Shuffle,
      color: 'text-blue-400',
      description:
        'Propagación este-oeste hacia servidores de misión crítica (Controladores de Dominio SRV-DC01 y Bases de Datos SRV-DB01) mediante servicios remotos PsExec, WMI y recursos compartidos ocultos (ADMIN$, C$).',
    },
    {
      title: 'Acceso Inicial & Fuerza Bruta Exitosa',
      weight: '+15 pts',
      detected: state.categoriesCount.fuerza_bruta > 0 && state.compromisedUsers.length > 0,
      icon: Flame,
      color: 'text-[#F59E0B]',
      description:
        'Múltiples fallos consecutivos de autenticación (Event ID 4625) seguidos de un inicio de sesión exitoso (Event ID 4624) desde una IP pública no corporativa fuera del horario operativo.',
    },
    {
      title: 'Comandos Ofuscados & Binarios LOLBAS',
      weight: '+10 pts',
      detected: state.categoriesCount.comandos_procesos > 0,
      icon: Terminal,
      color: 'text-[#F87171]',
      description:
        'Uso de herramientas nativas de Windows abusadas (certutil, PowerShell codificado en Base64, whoami /priv, nltest) para evadir antivirus perimetrales.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161E2E] border border-[#26334D] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#26334D] flex items-center justify-between bg-[#0E1726]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E1726] border border-[#26334D] flex items-center justify-center text-[#94A3B8]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Metodología del Puntaje de Severidad (0 - 100)
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Modelo forense cuantitativo alineado con MITRE ATT&CK y NIST SP 800-61
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161E2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#94A3B8]">
          {/* Banner de Puntaje Actual */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#EF4444]/10 via-[#0E1726] to-[#0E1726] border border-[#EF4444]/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold block">
                Puntaje Calculado para este Incidente:
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-white">
                  {state.riskScore} / 100
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/40">
                  Nivel {state.overallRisk}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#94A3B8] max-w-xs text-right hidden sm:block">
              Calculado determinísticamente a partir de la correlación de {state.alerts.length} alertas en {state.totalLogs} registros.
            </p>
          </div>

          {/* Explicación de la Fórmula y Factores */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] font-heading">
              1. Ponderación por Fases de Compromiso Detectadas
            </h4>
            <div className="space-y-2">
              {scoreFactors.map((factor, i) => {
                const Icon = factor.icon;
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                      factor.detected
                        ? 'bg-[#0E1726] border-[#26334D] shadow-sm'
                        : 'bg-[#0B0F19]/60 border-[#1E293B] opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#0B0F19] border border-[#26334D] shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${factor.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#F1F5F9] text-xs font-heading">
                            {factor.title}
                          </strong>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              factor.detected
                                ? 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/40'
                                : 'bg-[#161E2E] text-[#94A3B8] border border-[#26334D]'
                            }`}
                          >
                            {factor.detected ? 'DETECTADO EN LOGS' : 'NO DETECTADO'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
                          {factor.description}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs text-[#F1F5F9] shrink-0 bg-[#0B0F19] px-2 py-1 rounded border border-[#26334D]">
                      {factor.weight}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla de Umbrales de Riesgo */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] font-heading">
              2. Escala de Clasificación Forense
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#F87171] font-heading">CRÍTICO (85 - 100 pts)</strong>
                  <span className="text-[10px] font-mono text-[#F87171]">Impacto Inminente</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Adversario con persistencia activa, privilegios de administrador de dominio (SYSTEM) y acciones de sabotaje o borrado de auditoría.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#F59E0B] font-heading">ALTO (65 - 84 pts)</strong>
                  <span className="text-[10px] font-mono text-[#F59E0B]">Brecha Confirmada</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Compromiso de cuentas, descarga de herramientas maliciosas o saltos laterales a equipos internos sin control total del bosque.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#EAB308] font-heading">MEDIO (40 - 64 pts)</strong>
                  <span className="text-[10px] font-mono text-[#EAB308]">Anomalía Contenida</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Fuerza bruta perimetral rechazada, escaneo de puertos internos o inicios de sesión sospechosos sin escalamiento comprobado.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/40 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[#10B981] font-heading">BAJO (0 - 39 pts)</strong>
                  <span className="text-[10px] font-mono text-[#10B981]">Tráfico Rutinario</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Fallos de login esporádicos o actividades de mantenimiento habituales de los administradores de sistemas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#26334D] bg-[#0E1726] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#161E2E] hover:bg-[#26334D] text-[#F1F5F9] border border-[#26334D] transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
