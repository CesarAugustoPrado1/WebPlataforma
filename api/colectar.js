import { obtenerNotasDePedido, obtenerRenglonesPendientes, toNumber } from './_lib/plataforma.js';
import { kvDisponible, getCursor, setCursor, setUpdated, yaProcesado, aplicarPedido } from './_lib/store.js';

// Tipos de artículo que colectamos: Piedra, Placa, Guardas.
const TIPOS = new Set(['PIE', 'PLA', 'GUA']);
const VENTANA_DIAS = 3;        // días por ventana de headers
const PRESUPUESTO_MS = 48000;  // corte de tiempo por invocación (bajo el límite de Vercel)

const ymd = (d) => d.toISOString().slice(0, 10);
const mesDe = (fechaIso) => (fechaIso || '').slice(0, 7); // "2026-08-13T00:00:00" -> "2026-08"
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const inicioMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };

// GET /api/colectar[?desde=YYYY-MM-DD]  (target del cron; también manual)
// Junta los pedidos nuevos de Piedra/Placa/Guardas y acumula por mes/artículo.
export default async function handler(req, res) {
  if (!kvDisponible) return res.status(500).json({ error: 'Falta configurar la base (KV_REST_API_URL / KV_REST_API_TOKEN).' });
  const t0 = Date.now();
  try {
    const hoy = ymd(new Date());
    let cursor = await getCursor();
    const desde = (req.query.desde || '').toString().trim();
    if (desde && (!cursor || desde < cursor)) cursor = addDays(desde, -1);
    if (!cursor) cursor = addDays(inicioMes(), -1); // 1ra vez: mes actual en adelante

    let procesadas = 0, clientes = 0, hayMas = false;
    while (true) {
      const ini = addDays(cursor, 1);
      if (ini > hoy) break;
      const fin = addDays(ini, VENTANA_DIAS - 1) > hoy ? hoy : addDays(ini, VENTANA_DIAS - 1);

      const headers = await obtenerNotasDePedido({
        atributos: ['Division', 'Tipo', 'Numero', 'Cliente', 'FechaDeEmision'],
        filtros: [
          { atributo: 'FechaDeEmision', comparador: 'GreaterOrEqualsThan', valor: ini },
          { atributo: 'FechaDeEmision', comparador: 'LowerOrEqualsThan', valor: fin },
        ],
      });

      // Agrupar pedidos NUEVOS por cliente.
      const porCliente = new Map();
      for (const h of headers) {
        const clave = `${h.Division}-${h.Tipo}-${h.Numero}`;
        const cli = String(h.Cliente || '');
        if (!cli || await yaProcesado(clave)) continue;
        if (!porCliente.has(cli)) porCliente.set(cli, new Map());
        porCliente.get(cli).set(clave, mesDe(h.FechaDeEmision));
      }

      let ventanaOk = true;
      for (const [cli, claves] of porCliente) {
        if (Date.now() - t0 > PRESUPUESTO_MS) { ventanaOk = false; break; }
        let lineas;
        try { lineas = await obtenerRenglonesPendientes(cli, 'Todos'); }
        catch { ventanaOk = false; continue; } // cliente lento -> se reintenta la próxima corrida
        clientes++;

        const porPedido = new Map();
        for (const l of lineas) {
          const clave = `${l.Division}-${l.Tipo}-${l.Numero}`;
          if (!claves.has(clave) || !TIPOS.has(l.ArticuloTipo)) continue;
          if (!porPedido.has(clave)) porPedido.set(clave, []);
          porPedido.get(clave).push(l);
        }
        for (const [clave, mes] of claves) {
          const ls = (porPedido.get(clave) || []).map((l) => ({
            mes, articuloId: l.ArticuloId, cantidad: toNumber(l.CantidadPedida) || 0,
            meta: { nombre: l.ArticuloNombre, tipo: l.ArticuloTipo, um: l.UnidadDeMedida, linea: l.ArticuloClasif_1 },
          }));
          await aplicarPedido(clave, ls);
          procesadas++;
        }
      }

      if (ventanaOk) { await setCursor(fin); cursor = fin; }
      else { hayMas = true; break; }
      if (Date.now() - t0 > PRESUPUESTO_MS) { hayMas = cursor < hoy; break; }
    }

    await setUpdated();
    res.status(200).json({ cursor, hoy, procesadas, clientes, hayMas: hayMas || cursor < hoy, ms: Date.now() - t0 });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
