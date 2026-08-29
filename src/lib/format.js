// Helpers de formato compartidos entre vistas.

export const fmtNum = (n) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(n);

// Parsea números tolerando coma decimal (es-AR) y punto decimal (invariante).
export function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  let s = String(v).trim();
  const c = s.includes(','), p = s.includes('.');
  if (c && p) s = s.replace(/\./g, '').replace(',', '.');
  else if (c) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

export const fmtMoneda = (v) => {
  const n = parseNum(v);
  return n === null ? (v ?? '—')
    : new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

export const fmtFecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-AR');
};

// Normaliza texto para búsqueda (sin acentos, minúsculas).
export const norm = (s) =>
  (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
