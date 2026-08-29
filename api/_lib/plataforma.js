// Cliente SOAP para el ERP Plataforma (Pirkastone).
// Traduce las llamadas SOAP/ASMX (XML feo, decimales con coma) a objetos JS limpios.
// Se ejecuta del lado servidor (funciones serverless de Vercel), nunca en el browser:
// así evitamos el bloqueo de "mixed content" (frontend HTTPS -> ERP HTTP).
import { XMLParser } from 'fast-xml-parser';

export const CONFIG = {
  baseUrl: process.env.PLATAFORMA_URL || 'http://wspirkastone.pypcloud.net:1881',
  ns: 'http://plataforma.net.ar/',
  timeoutMs: Number(process.env.PLATAFORMA_TIMEOUT_MS || 55000),
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
});

// Convierte a Number tolerando ambos formatos: es-AR "1.234,56" / "0,000" (coma
// decimal) y el invariante "615406.00" (punto decimal). Devuelve null si no aplica.
export function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  let s = String(v).trim();
  const tieneComa = s.includes(','), tienePunto = s.includes('.');
  if (tieneComa && tienePunto) s = s.replace(/\./g, '').replace(',', '.'); // es-AR
  else if (tieneComa) s = s.replace(',', '.');                            // coma decimal
  // solo punto o sin separador: se deja tal cual (punto decimal invariante)
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// Comparadores válidos del enum del WSDL.
export const COMPARADORES = [
  'GreaterThan', 'GreaterOrEqualsThan', 'LowerThan', 'LowerOrEqualsThan',
  'Equals', 'Distinct', 'LikeLeft', 'LikeRight', 'LikeFull', 'Null', 'In', 'NotIn',
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Namespaces por servicio (la mayoría usa plataforma.net.ar; clientes usa otro).
const NS_POR_SERVICIO = {
  ServicioCCOCliente: 'http://wsplataforma.intecsoft.com.ar/',
};
const nsDe = (service) => NS_POR_SERVICIO[service] || CONFIG.ns;

// Llamada SOAP 1.1 cruda. Devuelve el texto XML completo de la respuesta.
async function soapCall(service, action, innerBodyXml) {
  const url = `${CONFIG.baseUrl}/${service}.asmx`;
  const ns = nsDe(service);
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:plat="${ns}">` +
    `<soap:Body>${innerBodyXml}</soap:Body></soap:Envelope>`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: `"${ns}${action}"`,
      },
      body: envelope,
      signal: ctrl.signal,
    });
  } catch (e) {
    const reason = e.name === 'AbortError'
      ? `timeout tras ${CONFIG.timeoutMs}ms`
      : e.message;
    throw new Error(`No se pudo contactar el ERP (${service}.${action}): ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok || text.includes('<soap:Fault>')) {
    const m = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/);
    const detail = m ? m[1].split('\n')[0] : `HTTP ${res.status}`;
    throw new Error(`ERP rechazó ${service}.${action}: ${detail}`);
  }
  return text;
}

// Extrae el contenido de <XxxResult>...</XxxResult> y lo parsea (viene como XML escapado).
function extractResult(soapText, resultTag) {
  const re = new RegExp(`<${resultTag}>([\\s\\S]*?)</${resultTag}>`);
  const m = soapText.match(re);
  if (!m) return null;
  return parser.parse(m[1]);
}

function asArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

// ---- Salud / conexión --------------------------------------------------------
export async function verificarConexion() {
  const svc = 'ServicioSTOCArticulo';
  const connText = await soapCall(svc, 'GetConexionPorDefecto', '<plat:GetConexionPorDefecto/>');
  const okText = await soapCall(svc, 'VerificarConexionBD', '<plat:VerificarConexionBD/>');
  const conn = (connText.match(/<GetConexionPorDefectoResult>([\s\S]*?)</) || [])[1] || null;
  const ok = /<ConexionOK>\s*true\s*<\/ConexionOK>/i.test(okText);
  return { conexionOk: ok, conexion: conn };
}

// ---- Artículos ---------------------------------------------------------------
export const ATRIBUTOS_ARTICULO_DEFAULT = [
  'ArticuloID', 'Nombre', 'ArticuloEmpresa', 'ArticuloParaImpresion',
  'TipoDeArticulo', 'UnidadDeMedidaDeStock', 'SeVende', 'SeControlaStock',
];

/** Busca artículos. filtros = [{atributo, comparador, valor}] */
export async function obtenerArticulos({ atributos = ATRIBUTOS_ARTICULO_DEFAULT, filtros = [] } = {}) {
  const atribXml = atributos.map(a => `<plat:ArticuloAtributos>${esc(a)}</plat:ArticuloAtributos>`).join('');
  const filtrosXml = filtros.map(f =>
    `<plat:Filtro>` +
    `<plat:Atributo>${esc(f.atributo)}</plat:Atributo>` +
    `<plat:Comparador>${esc(f.comparador)}</plat:Comparador>` +
    `<plat:Valor>${esc(f.valor ?? '')}</plat:Valor>` +
    `</plat:Filtro>`).join('');

  const body =
    `<plat:ObtenerArticulos>` +
    `<plat:AtributosVisibles>${atribXml}</plat:AtributosVisibles>` +
    `<plat:Filtros>${filtrosXml}</plat:Filtros>` +
    `</plat:ObtenerArticulos>`;

  const soapText = await soapCall('ServicioSTOCArticulo', 'ObtenerArticulos', body);
  const parsed = extractResult(soapText, 'ObtenerArticulosResult');
  const arts = asArray(parsed?.Articulos?.Articulo);
  return arts.map(a => {
    const out = {};
    for (const [k, v] of Object.entries(a)) {
      if (k.startsWith('@_')) continue;
      out[k] = v;
    }
    out.ArticuloID = out.ArticuloID ?? a['@_ArticuloID'];
    return out;
  });
}

// ---- Tipos de artículo (tabla maestra) --------------------------------------
export async function obtenerTiposArticulos() {
  const body =
    `<plat:ObtenerTiposArticulos>` +
    `<plat:AtributosVisibles>` +
    `<plat:TiposArticulosAtributos>Codigo</plat:TiposArticulosAtributos>` +
    `<plat:TiposArticulosAtributos>Nombre</plat:TiposArticulosAtributos>` +
    `</plat:AtributosVisibles>` +
    `<plat:Filtros></plat:Filtros>` +
    `</plat:ObtenerTiposArticulos>`;
  const soapText = await soapCall('ServicioSTOCTiposArticulos', 'ObtenerTiposArticulos', body);
  const parsed = extractResult(soapText, 'ObtenerTiposArticulosResult');
  // La estructura interna varía; buscamos nodos con Codigo/Nombre.
  const root = parsed ? Object.values(parsed)[0] : null;
  let items = [];
  if (root) {
    for (const v of Object.values(root)) {
      for (const nodo of asArray(v)) {
        if (nodo && (nodo.Codigo !== undefined || nodo.Nombre !== undefined)) {
          items.push({ valor: String(nodo.Codigo ?? '').trim(), label: String(nodo.Nombre ?? '').trim() });
        }
      }
    }
  }
  return items.filter((i) => i.valor !== '');
}

/**
 * Valores distintos de un atributo, derivados del padrón de artículos.
 * Devuelve [{valor, label}] ordenados. Si hay nombreAttr, lo usa como etiqueta.
 */
export async function obtenerValoresDistintos(atributo, nombreAttr = null) {
  const atributos = ['ArticuloID', atributo];
  if (nombreAttr && nombreAttr !== '__tipos__') atributos.push(nombreAttr);
  const arts = await obtenerArticulos({ atributos, filtros: [] });
  const mapa = new Map();
  for (const a of arts) {
    const val = (a[atributo] ?? '').toString().trim();
    if (!val) continue;
    const lbl = nombreAttr && nombreAttr !== '__tipos__' ? (a[nombreAttr] ?? '').toString().trim() : '';
    if (!mapa.has(val)) mapa.set(val, lbl || val);
  }
  return [...mapa.entries()]
    .map(([valor, label]) => ({ valor, label }))
    .sort((x, y) => x.label.localeCompare(y.label, 'es'));
}

// Caché en memoria (persiste mientras la instancia serverless esté "tibia").
const _cache = new Map();
const _TTL = Number(process.env.VALORES_TTL_MS || 10 * 60 * 1000);
export async function conCache(clave, fn) {
  const hit = _cache.get(clave);
  if (hit && Date.now() - hit.t < _TTL) return hit.v;
  const v = await fn();
  _cache.set(clave, { v, t: Date.now() });
  return v;
}

// ---- Stock -------------------------------------------------------------------
export const ATRIBUTOS_STOCK_DEFAULT = [
  'StockFisicoActual', 'StockReservadoEnPedidos', 'StockEgresarPedidosVentas',
  'StockIngresarCompras', 'StockIngresarFabricacion', 'StockEgresarFabricacion',
];

/**
 * Stock por depósito de una lista de IDs de artículo.
 * Devuelve [{articuloId, articuloEmpresa, depositos:[{depositoId, ...}], total:{...}}]
 */
export async function obtenerStock({ articulosId = [], depositosId = [], atributos = ATRIBUTOS_STOCK_DEFAULT, unidadMedida = null } = {}) {
  const atribXml = atributos.map(a => `<plat:ArticuloStockAtributos>${esc(a)}</plat:ArticuloStockAtributos>`).join('');
  const idsXml = articulosId.map(id => `<plat:string>${esc(id)}</plat:string>`).join('');
  const depXml = depositosId.map(id => `<plat:string>${esc(id)}</plat:string>`).join('');

  let body =
    `<plat:ObtenerStockDeArticulos_Nuevo>` +
    `<plat:AtributosVisibles>${atribXml}</plat:AtributosVisibles>` +
    `<plat:ArticulosID>${idsXml}</plat:ArticulosID>` +
    `<plat:DepositosID>${depXml}</plat:DepositosID>`;
  if (unidadMedida) body += `<plat:UnidadMedidaExpresion>${esc(unidadMedida)}</plat:UnidadMedidaExpresion>`;
  body += `</plat:ObtenerStockDeArticulos_Nuevo>`;

  const soapText = await soapCall('ServicioSTOCArticulo', 'ObtenerStockDeArticulos_Nuevo', body);
  const parsed = extractResult(soapText, 'ObtenerStockDeArticulos_NuevoResult');
  const arts = asArray(parsed?.StockDeArticulos?.Articulo);

  return arts.map(a => {
    const depositos = asArray(a.Deposito).map(d => {
      const dep = { depositoId: d['@_DepositoID'] };
      for (const attr of atributos) dep[attr] = toNumber(d[attr]);
      return dep;
    });
    const total = {};
    for (const attr of atributos) total[attr] = depositos.reduce((s, d) => s + (d[attr] || 0), 0);
    return { articuloId: a['@_ArticuloID'], articuloEmpresa: a['@_ArticuloEmpresa'] ?? null, depositos, total };
  });
}

// ---- Helpers genéricos para entidades con AtributosVisibles + Filtros --------
function filtrosXml(filtros = []) {
  return filtros.map(f =>
    `<plat:Filtro>` +
    `<plat:Atributo>${esc(f.atributo)}</plat:Atributo>` +
    `<plat:Comparador>${esc(f.comparador)}</plat:Comparador>` +
    `<plat:Valor>${esc(f.valor ?? '')}</plat:Valor>` +
    `</plat:Filtro>`).join('');
}
function limpiarItem(obj, idAttr) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@_')) { if (idAttr && k === `@_${idAttr}`) out[idAttr] = v; continue; }
    out[k] = v;
  }
  return out;
}

// ---- Clientes ----------------------------------------------------------------
export const ATRIBUTOS_CLIENTE_LISTA = [
  'ClienteID', 'Nombre', 'NombreLegal', 'Localidad', 'Provincia',
  'CondicionAnteElIVANombre', 'Telefono', 'Email',
];
export const ATRIBUTOS_CLIENTE_DETALLE = [
  'ClienteID', 'Nombre', 'NombreLegal', 'Domicilio', 'Localidad', 'CodigoPostal',
  'Provincia', 'ProvinciaNombre', 'Pais', 'PaisNombre', 'Telefono', 'Fax', 'Email',
  'CondicionAnteElIVANombre', 'ClaveTributaria', 'IngresosBrutos',
  'CondicionPagoNombre', 'MonedaUsualCuentaCorrienteNombre', 'TipoDeClienteNombre',
  'ActividadDeClienteNombre', 'ContactoDeVenta', 'ContactoDeCobros',
  'CuentaCliente', 'Referencia', 'HorarioDeAtencion', 'HorarioDeEntrega', 'Observacion',
];

export async function obtenerClientes({ atributos = ATRIBUTOS_CLIENTE_LISTA, filtros = [] } = {}) {
  const atribXml = atributos.map(a => `<plat:ClienteAtributos>${esc(a)}</plat:ClienteAtributos>`).join('');
  const body =
    `<plat:ObtenerClientes>` +
    `<plat:AtributosVisibles>${atribXml}</plat:AtributosVisibles>` +
    `<plat:Filtros>${filtrosXml(filtros)}</plat:Filtros>` +
    `</plat:ObtenerClientes>`;
  const soapText = await soapCall('ServicioCCOCliente', 'ObtenerClientes', body);
  const parsed = extractResult(soapText, 'ObtenerClientesResult');
  return asArray(parsed?.Clientes?.Cliente).map(c => {
    const out = limpiarItem(c, 'ClienteID');
    out.ClienteID = out.ClienteID ?? c['@_ClienteID'];
    return out;
  });
}

// ---- Notas de pedido ---------------------------------------------------------
export const ATRIBUTOS_PEDIDO_LISTA = [
  'Division', 'Tipo', 'Numero', 'FechaDeEmision', 'Cliente',
  'ImporteTotalMonedaOrigen', 'EstadoDeAprobacion', 'ListaDePrecioDeVenta', 'Referencia',
];
export const ATRIBUTOS_PEDIDO_DETALLE = [
  'Division', 'Tipo', 'Numero', 'FechaDeEmision', 'FechaDeAlta', 'Cliente', 'Moneda',
  'CondicionDePago', 'ListaDePrecioDeVenta', 'Referencia', 'Observacion', 'Transporte',
  'ImporteBrutoMonedaOrigen', 'ImporteTotalMonedaOrigen', 'EstadoDeAprobacion',
  'FechaDeAprobacion', 'EsFacturable', 'DepositoBaseDeConfeccion', 'FechaDeEntregaBase',
  'DireccionDeEntregaCliente',
];

export async function obtenerNotasDePedido({ atributos = ATRIBUTOS_PEDIDO_LISTA, filtros = [] } = {}) {
  const atribXml = atributos.map(a => `<plat:NotaDePedidoAtributos>${esc(a)}</plat:NotaDePedidoAtributos>`).join('');
  const body =
    `<plat:ObtenerNotasDePedido>` +
    `<plat:AtributosVisibles>${atribXml}</plat:AtributosVisibles>` +
    `<plat:Filtros>${filtrosXml(filtros)}</plat:Filtros>` +
    `</plat:ObtenerNotasDePedido>`;
  const soapText = await soapCall('ServicioVENTNotaDePedido', 'ObtenerNotasDePedido', body);
  const parsed = extractResult(soapText, 'ObtenerNotasDePedidoResult');
  return asArray(parsed?.NotasDePedido?.NotaDePedido).map(p => {
    const out = limpiarItem(p, 'NotaDePedido');
    out.NotaDePedido = out.NotaDePedido ?? p['@_NotaDePedido'];
    return out;
  });
}
