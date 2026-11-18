import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Download,
} from 'lucide-react';
import { ColumnMapping, RawLogEntry } from '../types/siem';
import {
  inspectExcelFile,
  convertRowsToLogEntries,
  ParseResult,
  downloadSampleExcelFile,
} from '../services/excelParser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogsLoaded: (logs: RawLogEntry[], fileName: string) => void;
  onLoadSample: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLogsLoaded,
  onLoadSample,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ timestamp: '' });
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    await processFile(dropped);
  };

  const processFile = async (selected: File) => {
    setFile(selected);
    setError(null);
    setIsLoading(true);

    try {
      const { result, rawJsonData } = await inspectExcelFile(selected);
      setParseResult(result);
      setMapping(result.suggestedMapping);
      setRawRows(rawJsonData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al procesar el archivo Excel.');
      setParseResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyMapping = () => {
    if (!file || !rawRows.length) return;
    try {
      const logs = convertRowsToLogEntries(rawRows, mapping);
      onLogsLoaded(logs, file.name);
      onClose();
    } catch (err: any) {
      setError('Error al estructurar los datos con el mapeo seleccionado.');
    }
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === '__NONE__' ? undefined : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161E2E] border border-[#26334D] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#26334D] flex items-center justify-between bg-[#0E1726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E1726] border border-[#26334D] flex items-center justify-center text-[#94A3B8]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F1F5F9]">
                Importar Registro de Logs (Excel / CSV)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Soporta archivos .xlsx, .xls y .csv con mapeo inteligente de columnas
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Opción rápida: Probar con dataset forense demo */}
          <div className="p-4 rounded-xl bg-[#0E1726] border border-[#26334D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#94A3B8]" /> ¿No tienes un archivo a la mano?
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Carga el <span className="font-semibold text-[#F1F5F9]">Incidente APT Multi-Etapa</span> con 33 eventos reales de ataque.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleExcelFile}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161E2E] hover:bg-[#1E293B] text-[#F1F5F9] border border-[#26334D] flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Descargar Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadSample();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center gap-1.5 transition shadow-sm"
              >
                Cargar Demo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zona de Drop */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
              file
                ? 'border-[#0EA5E9] bg-[#0E1726]'
                : 'border-[#26334D] hover:border-[#0EA5E9]/60 bg-[#0E1726]/60'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className="w-10 h-10 mx-auto text-[#0EA5E9] mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#F1F5F9]">
              {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic para examinar'}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB — Listo para estructurar`
                : 'Formato recomendado: columnas con Fecha, Usuario, IP Origen, Host, Proceso, Detalle'}
            </p>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#F87171] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mapeo de Columnas (Si ya se procesó el archivo) */}
          {parseResult && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-1.5">
                    Mapeo de Campos ({parseResult.totalRows} filas detectadas)
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Verifica que las columnas coincidan con la estructura de tus logs
                  </p>
                </div>
                <span className="text-[11px] font-mono bg-[#0E1726] text-[#F1F5F9] px-2 py-0.5 rounded border border-[#26334D]">
                  {parseResult.headers.length} columnas
                </span>
              </div>

              {/* Banner de Compatibilidad Estándar 12 Columnas */}
              <div className="p-3 rounded-xl bg-[#0E1726] border border-[#26334D] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span className="text-[#F1F5F9] font-bold">Estándar Forense de 12 Columnas</span>
                </div>
                <span className="text-[10px] text-[#94A3B8]">
                  Estructura Oficial SIEM: Log_ID • Timestamp • Hostname • Event_ID • User • Source_IP • Destination • Log_Source • Event_Description • Process_CommandLine • Result • Severity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* 1. Log_ID */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>1. Log_ID</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">EVT-00001</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.logId || '__NONE__'}
                    onChange={(e) => handleMappingChange('logId', e.target.value)}
                  >
                    <option value="__NONE__">(Autogenerar EVT-xxxxx)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Timestamp */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>2. Timestamp <span className="text-[#F87171]">*</span></span>
                    <span className="text-[10px] text-[#F87171]">Obligatorio</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.timestamp || ''}
                    onChange={(e) => handleMappingChange('timestamp', e.target.value)}
                  >
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Hostname */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>3. Hostname</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">WS-018</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.hostname || mapping.host || '__NONE__'}
                    onChange={(e) => {
                      handleMappingChange('hostname', e.target.value);
                      handleMappingChange('host', e.target.value);
                    }}
                  >
                    <option value="__NONE__">(Ninguno)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Event_ID */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>4. Event_ID</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">7036 / 4624</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.eventId || '__NONE__'}
                    onChange={(e) => handleMappingChange('eventId', e.target.value)}
                  >
                    <option value="__NONE__">(Ninguno / No disponible)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. User */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>5. User</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">CORP\helpdesk</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.user || '__NONE__'}
                    onChange={(e) => handleMappingChange('user', e.target.value)}
                  >
                    <option value="__NONE__">(Ninguno)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Source_IP */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>6. Source_IP</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">10.10.3.18</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.sourceIp || '__NONE__'}
                    onChange={(e) => handleMappingChange('sourceIp', e.target.value)}
                  >
                    <option value="__NONE__">(Ninguno)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Destination */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>7. Destination</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">DC-01</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.destination || mapping.destinationIp || '__NONE__'}
                    onChange={(e) => {
                      handleMappingChange('destination', e.target.value);
                      handleMappingChange('destinationIp', e.target.value);
                    }}
                  >
                    <option value="__NONE__">(Ninguno)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Log_Source */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>8. Log_Source</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">System / Security</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.logSource || '__NONE__'}
                    onChange={(e) => handleMappingChange('logSource', e.target.value)}
                  >
                    <option value="__NONE__">(Por defecto: System)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. Event_Description */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>9. Event_Description</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">Acción / Mensaje</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.eventDescription || mapping.details || mapping.action || '__NONE__'}
                    onChange={(e) => {
                      handleMappingChange('eventDescription', e.target.value);
                      handleMappingChange('details', e.target.value);
                      handleMappingChange('action', e.target.value);
                    }}
                  >
                    <option value="__NONE__">(Ninguno)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 10. Process_CommandLine */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>10. Process_CommandLine</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">CLI / Argumentos</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.processCommandLine || mapping.processOrCommand || '__NONE__'}
                    onChange={(e) => {
                      handleMappingChange('processCommandLine', e.target.value);
                      handleMappingChange('processOrCommand', e.target.value);
                    }}
                  >
                    <option value="__NONE__">(Ninguno / Vacío)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 11. Result */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>11. Result</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">Success / Failure</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.result || mapping.status || '__NONE__'}
                    onChange={(e) => {
                      handleMappingChange('result', e.target.value);
                      handleMappingChange('status', e.target.value);
                    }}
                  >
                    <option value="__NONE__">(Por defecto: Success)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 12. Severity */}
                <div className="p-2.5 rounded-lg bg-[#0E1726] border border-[#26334D]">
                  <label className="block text-[#94A3B8] font-medium mb-1 flex items-center justify-between">
                    <span>12. Severity</span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">Critical, High...</span>
                  </label>
                  <select
                    className="w-full bg-[#161E2E] text-[#F1F5F9] rounded px-2 py-1.5 border border-[#26334D] focus:outline-none focus:border-[#0EA5E9] text-xs font-mono"
                    value={mapping.severity || '__NONE__'}
                    onChange={(e) => handleMappingChange('severity', e.target.value)}
                  >
                    <option value="__NONE__">(Calcular automáticamente)</option>
                    {parseResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#26334D] flex items-center justify-between bg-[#0E1726]">
          <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8]" /> Rigor analítico: Los registros se analizan sin alterar su integridad.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161E2E] transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!parseResult || isLoading}
              onClick={handleApplyMapping}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#0EA5E9] hover:bg-[#0284C7] text-white transition shadow-md shadow-[#0EA5E9]/20 disabled:opacity-50 flex items-center gap-2"
            >
              Analizar Registros SIEM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
