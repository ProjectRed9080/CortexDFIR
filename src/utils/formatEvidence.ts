/**
 * Formateador inteligente de referencias de evidencia forense
 * Evita que listas excesivamente largas de filas (#2, #5, #10... x35)
 * deformen la interfaz o desborden y superpongan texto en los informes y PDF.
 */
export function formatEvidenceBadge(evidence?: string): string {
  if (!evidence) return 'Evidencia en registros';

  // Buscar todos los números de fila con formato #123
  const rowMatches = Array.from(evidence.matchAll(/#(\d+)/g), (m) => parseInt(m[1], 10));

  if (rowMatches.length > 4) {
    const min = Math.min(...rowMatches);
    const max = Math.max(...rowMatches);
    return `Filas #${min} a #${max} (${rowMatches.length} eventos)`;
  }

  // Si no tiene prefijo '#' pero contiene múltiples elementos separados por comas
  if (evidence.length > 40 && evidence.includes(',')) {
    const parts = evidence.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 4) {
      return `${parts[0]} ... ${parts[parts.length - 1]} (${parts.length} eventos)`;
    }
  }

  return evidence;
}
