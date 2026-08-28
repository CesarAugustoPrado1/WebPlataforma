import { CONFIG, verificarConexion } from './_lib/plataforma.js';

export default async function handler(req, res) {
  try {
    const info = await verificarConexion();
    res.status(200).json({ ...info, baseUrl: CONFIG.baseUrl });
  } catch (err) {
    res.status(502).json({ error: err.message, baseUrl: CONFIG.baseUrl });
  }
}
