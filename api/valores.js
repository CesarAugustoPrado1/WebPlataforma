import { obtenerTiposArticulos, obtenerValoresDistintos, conCache } from './_lib/plataforma.js';
import { definicionFiltro } from '../filtros.config.js';

// GET /api/valores?atributo=TipoDeArticulo
// Devuelve { valores: [{valor, label}] } para poblar el desplegable del filtro.
export default async function handler(req, res) {
  try {
    const atributo = (req.query.atributo || '').toString().trim();
    const def = definicionFiltro(atributo);
    if (!def) return res.status(400).json({ error: `Atributo desconocido: ${atributo}` });
    if (def.opciones !== 'lista') return res.status(200).json({ valores: [] });

    const valores = await conCache(`valores:${atributo}`, async () => {
      if (def.nombreAttr === '__tipos__') return obtenerTiposArticulos();
      return obtenerValoresDistintos(atributo, def.nombreAttr || null);
    });

    res.status(200).json({ atributo, total: valores.length, valores });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
