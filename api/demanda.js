import { obtenerArticulos, obtenerStockDisponiblePF } from './_lib/plataforma.js';

const LOTE = 100;
const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

// GET /api/demanda?tipos=PIE,PLA[&config=1]
// Demanda (pedidos de venta pendientes) por artículo, cruzando todos los clientes,
// usando el cálculo preconfigurado ObtenerStockDisponibleConfiguracionPF (rápido).
export default async function handler(req, res) {
  try {
    const tipos = (req.query.tipos || '').toString().split(',').map((s) => s.trim()).filter(Boolean);
    if (!tipos.length) return res.status(400).json({ error: 'Falta el parámetro tipos (ej: ?tipos=PIE,PLA)' });
    const config = Number(req.query.config) || 1;

    // 1) Artículos de los tipos elegidos (id, nombre, código, tipo, línea)
    const porId = new Map();
    for (const t of tipos) {
      const arts = await obtenerArticulos({
        atributos: ['ArticuloID', 'Nombre', 'ArticuloEmpresa', 'TipoDeArticulo', 'Clasificacion1Articulos', 'Clasificacion1ArticulosNombre'],
        filtros: [{ atributo: 'TipoDeArticulo', comparador: 'Equals', valor: t }],
      });
      for (const a of arts) porId.set(String(a.ArticuloID), a);
    }
    const ids = [...porId.keys()];

    // 2) Stock disponible / pedidos pendientes por lotes (config PF)
    const stockPorId = new Map();
    for (const lote of chunk(ids, LOTE)) {
      const st = await obtenerStockDisponiblePF(config, lote);
      for (const s of st) stockPorId.set(String(s.articuloId), s);
    }

    // 3) Filas
    const filas = ids.map((id) => {
      const a = porId.get(id); const s = stockPorId.get(id) || {};
      return {
        ArticuloID: id, Nombre: a.Nombre, ArticuloEmpresa: a.ArticuloEmpresa,
        TipoNombre: a.TipoDeArticulo,
        LineaNombre: a.Clasificacion1ArticulosNombre || a.Clasificacion1Articulos || '',
        pendiente: s.egresarPedidos || 0, fisico: s.fisico || 0,
        reservado: s.reservado || 0, disponible: s.disponible || 0,
      };
    });
    const totalPendiente = filas.reduce((acc, f) => acc + (f.pendiente || 0), 0);
    res.status(200).json({ config, tipos, total: filas.length, totalPendiente, filas });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
