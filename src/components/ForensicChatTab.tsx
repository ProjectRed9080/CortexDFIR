import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Terminal,
  Clock,
  RefreshCw,
  Flame,
  UserX,
  TrendingUp,
  Shuffle,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { SIEMAnalysisState } from '../types/siem';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'local_dfir_engine';
}

interface ForensicChatTabProps {
  state: SIEMAnalysisState;
  onInspectRow: (rowId: number) => void;
}

export const ForensicChatTab: React.FC<ForensicChatTabProps> = ({ state, onInspectRow }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🛡️ Asistente Pericial DFIR Activo\n\nHe auditado los **${state.totalLogs} registros** del archivo \`${state.fileName}\`.\n\nCada respuesta está sujeta al **rigor analítico**: únicamente respondo con hechos verificables citando los números de fila, timestamps, usuarios, IPs y comandos exactos del registro.\n\nPuedes seleccionar una consulta rápida abajo o escribir tu propia pregunta.`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickCategories = [
    {
      label: 'Fuerza Bruta',
      prompt: '¿Qué IP ejecutó la fuerza bruta, cuántos fallos hubo y qué cuenta fue vulnerada?',
      icon: Flame,
      color: 'text-[#F59E0B]',
    },
    {
      label: 'Inicios Sospechosos',
      prompt: '¿Qué inicios de sesión anómalos ocurrieron fuera de horario o desde IPs externas?',
      icon: UserX,
      color: 'text-[#38BDF8]',
    },
    {
      label: 'Escalamiento de Privilegios',
      prompt: '¿Cómo se logró el escalamiento a SYSTEM y qué se extrajo con el volcado de LSASS?',
      icon: TrendingUp,
      color: 'text-purple-300',
    },
    {
      label: 'Comandos & LOLBAS',
      prompt: '¿Qué comandos sospechosos, scripts de PowerShell y binarios LOLBAS se ejecutaron?',
      icon: Terminal,
      color: 'text-[#F87171]',
    },
    {
      label: 'Movimiento Lateral',
      prompt: '¿Cómo fue la propagación lateral hacia el Domain Controller y el servidor de Base de Datos?',
      icon: Shuffle,
      color: 'text-[#38BDF8]',
    },
    {
      label: 'Borrado de Logs y Evasión',
      prompt: '¿Qué eventos de borrado de registros de auditoría (1102 / 104) o evasión se detectaron?',
      icon: EyeOff,
      color: 'text-[#F87171]',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/forensic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.text,
          contextSummary: {
            fileName: state.fileName,
            totalLogs: state.totalLogs,
            overallRisk: state.overallRisk,
            riskScore: state.riskScore,
            compromisedUsers: state.compromisedUsers,
            attackerIps: state.attackerIps,
            affectedHosts: state.affectedHosts,
            categoriesCount: state.categoriesCount,
          },
          recentLogs: state.rawLogs.slice(0, 100),
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply ||
        data.error ||
        'No se pudo obtener respuesta del análisis pericial.';

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        source: data.source,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Fallo al procesar consulta forense: ${err?.message || 'Error de conexión'}`,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-[#F1F5F9] mt-2 mb-1 flex items-center gap-1.5 font-heading">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-base text-[#F1F5F9] mt-2.5 mb-1 font-heading">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('```')) {
            return null;
          }
          if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
            const clean = line.trim().replace(/^[-•]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed pl-2">
                <span className="text-[#94A3B8] mt-1 shrink-0">•</span>
                <span>{renderInlineStyles(clean)}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="text-xs leading-relaxed pl-2 font-medium text-[#94A3B8] mt-1">
                {renderInlineStyles(line.trim())}
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-xs leading-relaxed text-[#94A3B8]">
              {renderInlineStyles(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineStyles = (str: string) => {
    const parts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1);
        const rowMatch = codeText.match(/Fila\s*#?(\d+)/i);
        if (rowMatch) {
          const rId = parseInt(rowMatch[1], 10);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onInspectRow(rId)}
              className="px-1.5 py-0.2 mx-0.5 rounded bg-[#0E1726] text-[#38BDF8] border border-[#26334D] hover:bg-[#0EA5E9]/20 font-mono text-[11px] underline underline-offset-2"
              title={`Ver registro Fila #${rId}`}
            >
              {codeText}
            </button>
          );
        }
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[#0B0F19] text-[#F59E0B] font-mono text-[11px] border border-[#26334D] mx-0.5">
            {codeText}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-[#F1F5F9] font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-[calc(100vh-220px)] min-h-[580px] flex flex-col rounded-2xl bg-[#161E2E] border border-[#26334D] overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-[#26334D] bg-[#0E1726] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-blue-600 flex items-center justify-center text-[#0B0F19] shadow-md shadow-[#0EA5E9]/20 font-bold">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F1F5F9] tracking-tight font-heading">
                Asistente Forense Digital DFIR
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-[#161E2E] text-[#94A3B8] border border-[#26334D]">
                SIEM Forensics AI
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Interrogatorio riguroso y fundamentado sobre el archivo {state.fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome',
                  sender: 'assistant',
                  text: `### 🛡️ Historial Reiniciado\n\nPuedes formular cualquier consulta técnica sobre los ${state.totalLogs} eventos analizados.`,
                  timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="text-xs text-[#94A3B8] hover:text-[#F1F5F9] p-1.5 rounded-lg hover:bg-[#0E1726] transition flex items-center gap-1 font-mono"
            title="Limpiar conversación"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isBot
                    ? 'bg-[#0E1726] text-[#94A3B8] border border-[#26334D]'
                    : 'bg-[#0EA5E9] text-[#0B0F19]'
                }`}
              >
                {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  isBot
                    ? 'bg-[#0E1726] text-[#94A3B8] border border-[#26334D] shadow-md font-sans'
                    : 'bg-[#0EA5E9] text-[#0B0F19] font-medium shadow-md'
                }`}
              >
                <div className={`flex items-center justify-between gap-4 text-[10px] pb-1 font-mono ${isBot ? 'border-b border-[#26334D] text-[#94A3B8]' : 'text-[#0B0F19]/80'}`}>
                  <span className={`font-bold ${isBot ? 'text-[#F1F5F9]' : 'text-[#0B0F19]'}`}>
                    {isBot ? 'Analista Forense SOC' : 'Investigador'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                {isBot ? renderFormattedText(msg.text) : <div className="whitespace-pre-line">{msg.text}</div>}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-[#0E1726] text-[#94A3B8] border border-[#26334D]">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0E1726] border border-[#26334D] text-xs text-[#94A3B8] flex items-center gap-2">
              <span className="animate-pulse font-mono">Inspeccionando registros y correlacionando evidencia...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Consultas Rápidas por Categoría Requerida */}
      <div className="px-6 py-2 bg-[#0E1726] border-t border-[#26334D] overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] font-mono text-[#94A3B8] uppercase shrink-0 font-bold">
          Consultas Clave:
        </span>
        {quickCategories.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#161E2E] hover:bg-[#26334D] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#26334D] shrink-0 transition disabled:opacity-40 flex items-center gap-1.5 font-sans"
            >
              <Icon className={`w-3 h-3 ${item.color}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#26334D] bg-[#0E1726]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Escribe tu consulta pericial (ej: ¿Qué comandos ejecutó msanchez y en qué hosts?)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#161E2E] text-[#F1F5F9] pl-10 pr-4 py-2.5 rounded-xl border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono placeholder:text-[#94A3B8]"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#38BDF8] text-[#0B0F19] font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-[#0EA5E9]/20 disabled:opacity-40 font-heading"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Consultar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
