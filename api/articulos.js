import { obtenerArticulos, ATRIBUTOS_ARTICULO_DEFAULT } from './_lib/plataforma.js';
import {
  COMPARADORES_POR_TIPO, definicionFiltro, esColumnaValida, comparadorPorDefecto,
} from '../filtros.config.js';

// Normaliza el valor según el tipo del filtro para lo que espera el ERP.
function normalizarValor(tipo, comparador, valor) {
  const v = (valor ?? '').toString().trim();
  if (comparador === 'Null') return '';
  if (tipo === 'boolean') {
    if (/^(true|1|si|sí)$/i.test(v)) return 'True';
    if (/^(false|0|no)$/i.test(v)) return 'False';
    return v;
  }
  if (tipo === 'decimal') return v.replace('.', ','); // es-AR: coma decimal
  return v;
}

// Valida y arma la lista de filtros a partir de lo que mandó el frontend.
function construirFiltros(raw) {
  const out = [];
  for (const f of raw) {
    const def = definicionFiltro(f.atributo);
    if (!def) continue; // atributo desconocido -> lo ignoramos
    const permitidos = COMPARADORES_POR_TIPO[def.tipo] || COMPARADORES_POR_TIPO.string;
    const comparador = permitidos.includes(f.comparador) ? f.comparador : comparadorPorDefecto(def.tipo);
    const valor = normalizarValor(def.tipo, comparador, f.valor);
    if (comparador !== 'Null' && valor === '') continue; // sin valor -> no filtra
    out.push({ atributo: def.atributo, comparador, valor });
  }
  return out;
}

export default async function handler(req, res) {
  try {
    // Modo simple (compatibilidad): ?q=texto
    const q = (req.query.q || '').toString().trim();
    // Modo filtros: ?filtros=<json codificado>  (array de {atributo, comparador, valor})
    let rawFiltros = [];
    if (req.query.filtros) {
      try { rawFiltros = JSON.parse(req.query.filtros); } catch { rawFiltros = []; }
    }

    let filtros = construirFiltros(Array.isArray(rawFiltros) ? rawFiltros : []);

    // Si no vinieron filtros estructurados pero sí un q, replicamos el comportamiento anterior.
    if (!filtros.length && q) {
      if (/^\d+$/.test(q)) filtros = [{ atributo: 'ArticuloID', comparador: 'Equals', valor: q }];
      else filtros = [{ atributo: 'Nombre', comparador: 'LikeFull', valor: q }];
    }

    // Columnas a traer. Si viene ?atributos=... (lista), se usa esa (validada);
    // si no, las por defecto + los atributos de los filtros usados (si son columnas válidas).
    let atributos;
    if (req.query.atributos) {
      const pedidos = req.query.atributos.toString().split(',').map((s) => s.trim()).filter(Boolean);
      // Acepta columnas válidas y sus variantes "…Nombre" (cuya base es columna).
      const ok = (a) => a === 'ArticuloID' || esColumnaValida(a) || (a.endsWith('Nombre') && esColumnaValida(a.replace(/Nombre$/, '')));
      const validos = pedidos.filter(ok);
      atributos = validos.length ? [...new Set(['ArticuloID', ...validos])] : ATRIBUTOS_ARTICULO_DEFAULT;
    } else {
      const extra = filtros
        .map((f) => f.atributo)
        .filter((a) => esColumnaValida(a) && !ATRIBUTOS_ARTICULO_DEFAULT.includes(a));
      atributos = [...ATRIBUTOS_ARTICULO_DEFAULT, ...new Set(extra)];
    }

    let articulos = await obtenerArticulos({ atributos, filtros });

    // Fallback del modo simple: si buscaba texto por nombre y no hubo match, probar por código.
    if (q && !rawFiltros.length && !/^\d+$/.test(q) && articulos.length === 0) {
      articulos = await obtenerArticulos({
        atributos,
        filtros: [{ atributo: 'ArticuloEmpresa', comparador: 'LikeFull', valor: q }],
      });
    }

    res.status(200).json({ total: articulos.length, articulos, filtrosAplicados: filtros });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
