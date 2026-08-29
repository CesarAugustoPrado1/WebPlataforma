import { useState, useCallback, useMemo, useEffect } from 'react';
import { norm, fmtMoneda, fmtFecha } from '../lib/format.js';

const DETALLE = [
  ['ClienteNombre', 'Cliente'], ['Cliente', 'Cliente ID'], ['FechaDeEmision', 'Emisión', 'fecha'],
  ['FechaDeAlta', 'Alta', 'fecha'], ['Moneda', 'Moneda'], ['CondicionDePago', 'Cond. pago'],
  ['ListaDePrecioDeVenta', 'Lista precio'], ['ImporteBrutoMonedaOrigen', 'Importe bruto', 'moneda'],
  ['ImporteTotalMonedaOrigen', 'Importe total', 'moneda'], ['EstadoDeAprobacion', 'Estado aprob.'],
  ['FechaDeAprobacion', 'Fecha aprob.', 'fecha'], ['EsFacturable', 'Facturable'],
  ['Transporte', 'Transporte'], ['DepositoBaseDeConfeccion', 'Depósito'],
  ['FechaDeEntregaBase', 'Entrega', 'fecha'], ['DireccionDeEntregaCliente', 'Dir. entrega'],
  ['Referencia', 'Referencia'], ['Observacion', 'Observación'],
];

const val = (v, fmt) => fmt === 'fecha' ? fmtFecha(v) : fmt === 'moneda' ? fmtMoneda(v) : String(v);

function Cabecera({ pedido, onClose }) {
  const { Division, Tipo, Numero } = pedido;
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/pedidos?div=${encodeURIComponent(Division)}&tipo=${encodeURIComponent(Tipo)}&num=${encodeURIComponent(Numero)}`)
      .then((r) => r.json())
      .then((d) => setData({ estado: 'ok', pedido: d.pedido }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [Division, Tipo, Numero]);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">Pedido {Division}-{Tipo}-{Numero}</div>
          {data.pedido?.ClienteNombre && <div className="panel-sub">{data.pedido.ClienteNombre}</div>}
        </div>
        <button className="btn-x" onClick={onClose}>✕</button>
      </div>
      {data.estado === 'cargando' && <div className="muted">Cargando pedido…</div>}
      {data.estado === 'error' && <div className="error-box">{data.error}</div>}
      {data.estado === 'ok' && data.pedido && (
        <div className="ficha">
          {DETALLE.filter(([k]) => (data.pedido[k] ?? '') !== '').map(([k, l, f]) => (
            <div className="ficha-row" key={k}><span className="ficha-k">{l}</span><span className="ficha-v">{val(data.pedido[k], f)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PedidosView() {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hace7);
  const [hasta, setHasta] = useState(hoy);
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState('');
  const [numero, setNumero] = useState('');

  const [estado, setEstado] = useState('idle');
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  const buscar = useCallback((e) => {
    e?.preventDefault();
    const filtros = [];
    // Si se busca por Número (camino rápido), no restringimos por fecha.
    if (numero.trim()) {
      filtros.push({ atributo: 'Numero', comparador: 'Equals', tipo: 'int', valor: numero.trim() });
      if (tipo.trim()) filtros.push({ atributo: 'Tipo', comparador: 'Equals', tipo: 'string', valor: tipo.trim() });
    } else {
      if (desde) filtros.push({ atributo: 'FechaDeEmision', comparador: 'GreaterOrEqualsThan', tipo: 'date', valor: desde });
      if (hasta) filtros.push({ atributo: 'FechaDeEmision', comparador: 'LowerOrEqualsThan', tipo: 'date', valor: hasta });
      if (cliente.trim()) filtros.push({ atributo: 'Cliente', comparador: 'Equals', tipo: 'int', valor: cliente.trim() });
      if (tipo.trim()) filtros.push({ atributo: 'Tipo', comparador: 'Equals', tipo: 'string', valor: tipo.trim() });
    }
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/pedidos?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setPedidos(d.pedidos || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [desde, hasta, cliente, tipo, numero]);

  const vista = useMemo(() => {
    const q = norm(refine).trim();
    const arr = q
      ? pedidos.filter((p) => ['NotaDePedido', 'Cliente', 'Referencia', 'Tipo'].some((k) => norm(p[k]).includes(q)))
      : pedidos;
    return [...arr].sort((a, b) => (b.FechaDeEmision || '').localeCompare(a.FechaDeEmision || ''));
  }, [pedidos, refine]);

  return (
    <div className="vista">
      <form className="buscador-bar" onSubmit={buscar}>
        <label className="campo"><span>Desde</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label className="campo"><span>Hasta</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        <label className="campo"><span>Cliente ID</span><input type="number" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="…" /></label>
        <label className="campo"><span>Tipo</span><input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="NPV…" /></label>
        <label className="campo"><span>Número</span><input type="number" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="…" /></label>
        <button className="btn-primario" type="submit" disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      <div className="hint-bar">Por <b>Número</b> es instantáneo. Los rangos de fecha amplios o por cliente son lentos en el ERP (pueden tardar 20-60s); usá rangos cortos.</div>

      {estado === 'ok' && (
        <div className="sub-toolbar">
          <input className="refine chico" value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Refinar resultados…" />
          <span className="resultados-count">{vista.length}{refine ? ` de ${pedidos.length}` : ''} pedido(s)</span>
        </div>
      )}
      {estado === 'error' && <div className="error-box">{error}</div>}

      <div className="layout">
        <div className="lista">
          {vista.map((p) => (
            <button key={p.NotaDePedido} className={`item ${sel?.NotaDePedido === p.NotaDePedido ? 'activo' : ''}`} onClick={() => setSel(p)}>
              <div className="item-nombre">{p.Division}-{p.Tipo}-{p.Numero}</div>
              <div className="item-meta">
                {fmtFecha(p.FechaDeEmision)} · Cliente {p.Cliente}
                {p.ImporteTotalMonedaOrigen ? <span className="importe">$ {fmtMoneda(p.ImporteTotalMonedaOrigen)}</span> : null}
              </div>
            </button>
          ))}
          {estado === 'ok' && vista.length === 0 && <div className="muted">Sin pedidos en ese criterio.</div>}
          {estado === 'idle' && <div className="muted">Elegí un rango de fechas y tocá Buscar.</div>}
        </div>
        <div className="detalle">
          {sel ? <Cabecera pedido={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un pedido para ver su cabecera.</div>}
        </div>
      </div>
    </div>
  );
}
