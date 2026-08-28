import { obtenerArticulos } from './_lib/plataforma.js';

// GET /api/articulos?q=texto[&campo=Nombre|ArticuloEmpresa|ArticuloID][&comparador=LikeFull|Equals|...]
export default async function handler(req, res) {
  try {
    const q = (req.query.q || '').toString().trim();
    const campo = (req.query.campo || '').toString().trim();
    const comparador = (req.query.comparador || '').toString().trim();

    let filtros = [];
    if (q) {
      if (campo) {
        const cmp = comparador || (campo === 'ArticuloID' ? 'Equals' : 'LikeFull');
        filtros = [{ atributo: campo, comparador: cmp, valor: q }];
      } else if (/^\d+$/.test(q)) {
        filtros = [{ atributo: 'ArticuloID', comparador: 'Equals', valor: q }];
      } else {
        filtros = [{ atributo: 'Nombre', comparador: 'LikeFull', valor: q }];
      }
    }

    let articulos = await obtenerArticulos({ filtros });

    // Fallback: si buscaban texto por nombre y no hubo match, probamos por código de empresa.
    if (q && !campo && !/^\d+$/.test(q) && articulos.length === 0) {
      articulos = await obtenerArticulos({
        filtros: [{ atributo: 'ArticuloEmpresa', comparador: 'LikeFull', valor: q }],
      });
    }

    res.status(200).json({ total: articulos.length, articulos });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
