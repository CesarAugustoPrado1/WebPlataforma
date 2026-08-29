import { obtenerClientes, ATRIBUTOS_CLIENTE_DETALLE } from './_lib/plataforma.js';

// Normalización mínima de valores según el tipo declarado por el frontend.
function norm(tipo, comparador, valor) {
  const v = (valor ?? '').toString().trim();
  if (comparador === 'Null') return '';
  if (tipo === 'decimal') return v.replace('.', ',');
  return v;
}

// GET /api/clientes?filtros=<json>           -> listado
// GET /api/clientes?id=926                   -> ficha (detalle)
export default async function handler(req, res) {
  try {
    const id = (req.query.id || '').toString().trim();
    if (id) {
      const [cli] = await obtenerClientes({
        atributos: ATRIBUTOS_CLIENTE_DETALLE,
        filtros: [{ atributo: 'ClienteID', comparador: 'Equals', valor: id }],
      });
      return res.status(200).json({ cliente: cli || null });
    }

    let raw = [];
    if (req.query.filtros) { try { raw = JSON.parse(req.query.filtros); } catch { raw = []; } }
    const filtros = (Array.isArray(raw) ? raw : [])
      .map((f) => ({ atributo: f.atributo, comparador: f.comparador || 'Equals', valor: norm(f.tipo, f.comparador, f.valor) }))
      .filter((f) => f.comparador === 'Null' || f.valor !== '');

    const clientes = await obtenerClientes({ filtros });
    res.status(200).json({ total: clientes.length, clientes });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
