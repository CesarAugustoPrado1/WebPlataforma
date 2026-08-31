// Capa de persistencia (Upstash Redis / Vercel KV) para el acumulado de pedidos.
// En Vercel las variables KV_REST_API_URL/TOKEN se inyectan solas; en local vienen del .env.
import 'dotenv/config';
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvDisponible = !!(url && token);
export const redis = kvDisponible ? new Redis({ url, token }) : null;

const K = {
  cursor: 'wp:ped:cursor',           // última fecha (YYYY-MM-DD) totalmente colectada
  procesados: 'wp:ped:procesados',   // SET de claves de pedido "Div-Tipo-Num"
  meses: 'wp:ped:meses',             // SET de "YYYY-MM" con datos
  updated: 'wp:ped:updated',         // timestamp ISO de última corrida
  cant: (m) => `wp:ped:cant:${m}`,   // HASH articuloId -> cantidad pedida (float)
  meta: (m) => `wp:ped:meta:${m}`,   // HASH articuloId -> JSON {nombre,tipo,um,linea}
};

export async function getCursor() { return (await redis.get(K.cursor)) || null; }
export async function setCursor(fecha) { await redis.set(K.cursor, fecha); }
export async function getUpdated() { return (await redis.get(K.updated)) || null; }
export async function setUpdated() { await redis.set(K.updated, new Date().toISOString()); }
export async function getMeses() { return (await redis.smembers(K.meses)) || []; }

/** ¿Ya procesamos este pedido? */
export async function yaProcesado(clave) { return !!(await redis.sismember(K.procesados, clave)); }

/**
 * Aplica las contribuciones de un pedido (idempotente por la clave):
 * lineas = [{ mes, articuloId, cantidad, meta:{nombre,tipo,um,linea} }]
 */
export async function aplicarPedido(clave, lineas) {
  if (!lineas.length) { await redis.sadd(K.procesados, clave); return; }
  const p = redis.pipeline();
  const meses = new Set();
  for (const l of lineas) {
    p.hincrbyfloat(K.cant(l.mes), String(l.articuloId), l.cantidad);
    p.hset(K.meta(l.mes), { [String(l.articuloId)]: JSON.stringify(l.meta) });
    meses.add(l.mes);
  }
  for (const m of meses) p.sadd(K.meses, m);
  p.sadd(K.procesados, clave);
  await p.exec();
}

/** Devuelve el acumulado de un mes: [{articuloId, nombre, tipo, um, linea, cantidad}] */
export async function getMes(mes) {
  const [cant, meta] = await Promise.all([redis.hgetall(K.cant(mes)), redis.hgetall(K.meta(mes))]);
  const out = [];
  for (const [aid, c] of Object.entries(cant || {})) {
    let m = {};
    try { const raw = meta?.[aid]; m = typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch { m = {}; }
    out.push({ articuloId: aid, cantidad: Number(c) || 0, nombre: m.nombre, tipo: m.tipo, um: m.um, linea: m.linea });
  }
  return out;
}

/** Estado general para la UI. */
export async function estado() {
  const [cursor, updated, meses] = await Promise.all([getCursor(), getUpdated(), getMeses()]);
  return { cursor, updated, meses: (meses || []).sort().reverse() };
}
