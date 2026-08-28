import { obtenerStock } from './_lib/plataforma.js';

// GET /api/stock?ids=666,667[&um=CJ]
export default async function handler(req, res) {
  try {
    const ids = (req.query.ids || '').toString().split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ error: 'Falta el parámetro ids (ej: ?ids=666,667)' });
    }
    const um = (req.query.um || '').toString().trim() || null;
    const stock = await obtenerStock({ articulosId: ids, unidadMedida: um });
    res.status(200).json({ stock });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
