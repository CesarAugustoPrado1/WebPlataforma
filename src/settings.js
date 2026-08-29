// Ajustes de filtros guardados por el usuario (persisten en este navegador).
// El catálogo de filtros.config.js es la base; acá se guardan los "overrides":
// qué filtros están habilitados, su nombre, su comparador y su valor por defecto.
import { CATALOGO_FILTROS, comparadorPorDefecto } from '../filtros.config.js';

const CLAVE = 'webplataforma.settings.v1';

export function cargarOverrides() {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function guardarOverrides(overrides) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(overrides));
  } catch {
    /* almacenamiento no disponible: seguimos solo en memoria */
  }
}

export function limpiarOverrides() {
  try { localStorage.removeItem(CLAVE); } catch { /* ignore */ }
}

// Comparador por defecto de un filtro (para lista es Equals; si no, el del tipo).
export function comparadorInicial(f) {
  return f.opciones === 'lista' ? 'Equals' : comparadorPorDefecto(f.tipo);
}

// Catálogo con los overrides aplicados. Cada filtro queda con:
//   habilitado, label, comparadorDefault, valorDefault  (efectivos)
export function filtrosEfectivos(overrides = cargarOverrides()) {
  return CATALOGO_FILTROS.map((f) => {
    const o = overrides[f.atributo] || {};
    return {
      ...f,
      habilitado: o.habilitado ?? f.habilitado,
      label: (o.label ?? f.label) || f.atributo,
      comparadorDefault: o.comparador ?? comparadorInicial(f),
      valorDefault: o.valor ?? '',
    };
  });
}

// Construye el objeto de overrides a partir de un draft (lista de filtros efectivos),
// guardando solo lo que difiere del catálogo base para mantenerlo chico.
export function overridesDesdeDraft(draft) {
  const base = new Map(CATALOGO_FILTROS.map((f) => [f.atributo, f]));
  const out = {};
  for (const d of draft) {
    const b = base.get(d.atributo);
    if (!b) continue;
    const o = {};
    if (d.habilitado !== b.habilitado) o.habilitado = d.habilitado;
    if (d.label && d.label !== b.label) o.label = d.label;
    if (d.comparadorDefault !== comparadorInicial(b)) o.comparador = d.comparadorDefault;
    if ((d.valorDefault ?? '') !== '') o.valor = d.valorDefault;
    if (Object.keys(o).length) out[d.atributo] = o;
  }
  return out;
}
