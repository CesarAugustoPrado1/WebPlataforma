import { obtenerComposicionDeSaldo, toNumber } from './_lib/plataforma.js';

// GET /api/saldo?cliente=926[&moneda=PS]
export default async function handler(req, res) {
  try {
    const cliente = (req.query.cliente || '').toString().trim();
    if (!cliente) return res.status(400).json({ error: 'Falta el parámetro cliente' });
    const moneda = (req.query.moneda || '').toString().trim() || null;
    const renglones = await obtenerComposicionDeSaldo(cliente, undefined, moneda);
    // SaldoMonedaExpresion es el saldo ACUMULADO por línea; el saldo real es Debe - Haber.
    const debe = renglones.reduce((s, r) => s + (toNumber(r.DebeMonedaExpresion) || 0), 0);
    const haber = renglones.reduce((s, r) => s + (toNumber(r.HaberMonedaExpresion) || 0), 0);
    const total = debe - haber;
    res.status(200).json({ cliente, total, debe, haber, cantidad: renglones.length, renglones });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
