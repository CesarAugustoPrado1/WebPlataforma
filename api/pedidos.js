import { obtenerNotasDePedido, obtenerClientes, ATRIBUTOS_PEDIDO_DETALLE } from './_lib/plataforma.js';

function norm(tipo, comparador, valor) {
  const v = (valor ?? '').toString().trim();
  if (comparador === 'Null') return '';
  if (tipo === 'decimal') return v.replace('.', ',');
  return v;
}

// GET /api/pedidos?filtros=<json>              -> listado de notas de pedido
// GET /api/pedidos?div=101&tipo=NPA&num=28979  -> detalle (cabecera) + nombre de cliente
export default async function handler(req, res) {
  try {
    const div = (req.query.div || '').toString().trim();
    const tipo = (req.query.tipo || '').toString().trim();
    const num = (req.query.num || '').toString().trim();

    if (div && tipo && num) {
      const [ped] = await obtenerNotasDePedido({
        atributos: ATRIBUTOS_PEDIDO_DETALLE,
        filtros: [
          { atributo: 'Division', comparador: 'Equals', valor: div },
          { atributo: 'Tipo', comparador: 'Equals', valor: tipo },
          { atributo: 'Numero', comparador: 'Equals', valor: num },
        ],
      });
      let clienteNombre = null;
      if (ped?.Cliente) {
        const [cli] = await obtenerClientes({
          atributos: ['ClienteID', 'Nombre'],
          filtros: [{ atributo: 'ClienteID', comparador: 'Equals', valor: ped.Cliente }],
        });
        clienteNombre = cli?.Nombre || null;
      }
      return res.status(200).json({ pedido: ped ? { ...ped, ClienteNombre: clienteNombre } : null });
    }

    let raw = [];
    if (req.query.filtros) { try { raw = JSON.parse(req.query.filtros); } catch { raw = []; } }
    const filtros = (Array.isArray(raw) ? raw : [])
      .map((f) => ({ atributo: f.atributo, comparador: f.comparador || 'Equals', valor: norm(f.tipo, f.comparador, f.valor) }))
      .filter((f) => f.comparador === 'Null' || f.valor !== '');

    const pedidos = await obtenerNotasDePedido({ filtros });
    res.status(200).json({ total: pedidos.length, pedidos });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
