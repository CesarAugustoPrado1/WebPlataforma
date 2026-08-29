// Ajustes de filtros por entidad, guardados en el navegador (localStorage).
// Genérico: cada entidad pasa su catálogo y su clave de almacenamiento.
import { comparadorPorDefecto } from '../../filtros.comunes.js';

export function cargarOverrides(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function guardarOverrides(storageKey, overrides) {
  try { localStorage.setItem(storageKey, JSON.stringify(overrides)); } catch { /* sin storage */ }
}

export function limpiarOverrides(storageKey) {
  try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
}

// Comparador por defecto de un filtro (para lista es Equals; si no, el del tipo).
export function comparadorInicial(f) {
  return f.opciones === 'lista' ? 'Equals' : comparadorPorDefecto(f.tipo);
}

// Catálogo con overrides aplicados: habilitado, label, comparadorDefault, valorDefault efectivos.
export function filtrosEfectivos(catalogo, overrides = {}) {
  return catalogo.map((f) => {
    const o = overrides[f.atributo] || {};
    return {
      ...f,
      habilitado: o.habilitado ?? f.habilitado,
      label: (o.label ?? f.label) || f.atributo,
      comparadorDefault: o.comparador ?? comparadorInicial(f),
      valorDefault: o.valor ?? f.valorDefault ?? '',
    };
  });
}

// Overrides a partir del draft (guardando solo lo que difiere del catálogo base).
export function overridesDesdeDraft(catalogo, draft) {
  const base = new Map(catalogo.map((f) => [f.atributo, f]));
  const out = {};
  for (const d of draft) {
    const b = base.get(d.atributo);
    if (!b) continue;
    const o = {};
    if (d.habilitado !== b.habilitado) o.habilitado = d.habilitado;
    if (d.label && d.label !== b.label) o.label = d.label;
    if (d.comparadorDefault !== comparadorInicial(b)) o.comparador = d.comparadorDefault;
    if ((d.valorDefault ?? '') !== (b.valorDefault ?? '')) o.valor = d.valorDefault;
    if (Object.keys(o).length) out[d.atributo] = o;
  }
  return out;
}
