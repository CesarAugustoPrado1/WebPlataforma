import { kvDisponible, getMes, estado } from './_lib/store.js';

const NOMBRE_TIPO = { PIE: 'Piedra', PLA: 'Placa', GUA: 'Guardas' };

// GET /api/pedidos-mes[?mes=YYYY-MM]
// Devuelve el acumulado del mes agrupado por tipo (Piedra/Placa/Guardas) con detalle por artículo.
export default async function handler(req, res) {
  if (!kvDisponible) return res.status(500).json({ error: 'Falta configurar la base (KV_REST_API_URL / KV_REST_API_TOKEN).' });
  try {
    const est = await estado();
    const mes = (req.query.mes || est.meses[0] || '').toString().trim();
    if (!mes) return res.status(200).json({ estado: est, mes: null, tipos: [] });

    const filas = await getMes(mes);
    const porTipo = new Map();
    for (const f of filas) {
      const t = f.tipo || '?';
      if (!porTipo.has(t)) porTipo.set(t, { tipo: t, nombre: NOMBRE_TIPO[t] || t, total: 0, articulos: [] });
      const g = porTipo.get(t);
      g.total += f.cantidad;
      g.articulos.push({ articuloId: f.articuloId, nombre: f.nombre, um: f.um, linea: f.linea, cantidad: f.cantidad });
    }
    const tipos = [...porTipo.values()]
      .map((g) => ({ ...g, articulos: g.articulos.sort((a, b) => b.cantidad - a.cantidad) }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({ estado: est, mes, tipos });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
