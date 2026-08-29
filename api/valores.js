import {
  obtenerTiposArticulos, obtenerValoresDistintos, obtenerValoresDistintosClientes, conCache,
} from './_lib/plataforma.js';
import { definicionFiltro } from '../filtros.config.js';
import { CATALOGO_CLIENTES } from '../clientes.config.js';

// GET /api/valores?atributo=TipoDeArticulo               -> artículos (default)
// GET /api/valores?entidad=clientes&atributo=Provincia   -> clientes
export default async function handler(req, res) {
  try {
    const entidad = (req.query.entidad || 'articulos').toString();
    const atributo = (req.query.atributo || '').toString().trim();

    if (entidad === 'clientes') {
      const def = CATALOGO_CLIENTES.find((f) => f.atributo === atributo);
      if (!def || def.opciones !== 'lista') return res.status(200).json({ valores: [] });
      // Deriva TODAS las columnas lista de clientes en una sola consulta cacheada.
      const pares = CATALOGO_CLIENTES.filter((f) => f.opciones === 'lista')
        .map((f) => ({ atributo: f.atributo, nombreAttr: f.nombreAttr || null }));
      const mapa = await conCache('clientes:valores', () => obtenerValoresDistintosClientes(pares));
      return res.status(200).json({ atributo, valores: mapa[atributo] || [] });
    }

    // Artículos
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
