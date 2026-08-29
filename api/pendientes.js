import { obtenerRenglonesPendientes, toNumber } from './_lib/plataforma.js';

// GET /api/pendientes?cliente=926[&estado=Pendiente|Parcial|Total|Todos]
export default async function handler(req, res) {
  try {
    const cliente = (req.query.cliente || '').toString().trim();
    if (!cliente) return res.status(400).json({ error: 'Falta el parámetro cliente' });
    const estado = (req.query.estado || 'Pendiente').toString().trim();
    const renglones = await obtenerRenglonesPendientes(cliente, estado);
    const totalImporte = renglones.reduce((s, r) => s + (toNumber(r.ImportePendienteRemitir) || 0), 0);
    res.status(200).json({ cliente, estado, cantidad: renglones.length, totalImporte, renglones });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
