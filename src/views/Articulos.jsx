import { useState, useCallback, useMemo, useEffect } from 'react';
import { CATALOGO_FILTROS } from '../../filtros.config.js';
import { useBuscador } from '../components/useBuscador.jsx';
import { fmtNum as fmt, norm } from '../lib/format.js';

function StockPanel({ articulo, onClose }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/stock?ids=${encodeURIComponent(articulo.ArticuloID)}`).then((r) => r.json())
      .then((d) => setData({ estado: 'ok', stock: d.stock?.[0] || null }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [articulo]);
  const cols = [
    ['StockFisicoActual', 'Físico'], ['StockReservadoEnPedidos', 'Reservado'],
    ['StockEgresarPedidosVentas', 'A egresar (pedidos)'], ['StockIngresarCompras', 'A ingresar (compras)'],
    ['StockIngresarFabricacion', 'A ingresar (fabric.)'], ['StockEgresarFabricacion', 'A egresar (fabric.)'],
  ];
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{articulo.Nombre}</div>
          <div className="panel-sub">ID {articulo.ArticuloID} · {articulo.ArticuloEmpresa || 's/código'} · UM {articulo.UnidadDeMedidaDeStock || '—'}</div>
        </div>
        <button className="btn-x" onClick={onClose}>✕</button>
      </div>
      {data.estado === 'cargando' && <div className="muted">Consultando stock…</div>}
      {data.estado === 'error' && <div className="error-box">{data.error}</div>}
      {data.estado === 'ok' && !data.stock && <div className="muted">Sin datos de stock.</div>}
      {data.estado === 'ok' && data.stock && (
        <>
          <div className="total-row"><span>Stock físico total</span><strong>{fmt(data.stock.total.StockFisicoActual)}</strong></div>
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Depósito</th>{cols.map(([, l]) => <th key={l} className="num">{l}</th>)}</tr></thead>
              <tbody>
                {data.stock.depositos.map((d) => (
                  <tr key={d.depositoId}><td>#{d.depositoId}</td>{cols.map(([k]) => <td key={k} className="num">{fmt(d[k])}</td>)}</tr>
                ))}
                <tr className="tfoot"><td>Total</td>{cols.map(([k]) => <td key={k} className="num"><strong>{fmt(data.stock.total[k])}</strong></td>)}</tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function ArticulosView() {
  const [estado, setEstado] = useState('idle');
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  const onBuscar = useCallback((filtros) => {
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/articulos?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setArticulos(d.articulos || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, []);

  const { filtrosDef, toolbar, chips, drawers } = useBuscador({
    catalogo: CATALOGO_FILTROS,
    storageKey: 'webplataforma.settings.v1',
    valoresUrl: (a) => `/api/valores?atributo=${encodeURIComponent(a)}`,
    onBuscar, buscando: estado === 'cargando',
    refine, setRefine, refinePlaceholder: 'Refinar resultados por texto (nombre, código, ID…)',
  });

  const colsExtra = useMemo(
    () => filtrosDef.filter((f) => f.columna && !['ArticuloID', 'Nombre', 'ArticuloEmpresa'].includes(f.atributo)),
    [filtrosDef]
  );

  const vista = useMemo(() => {
    const q = norm(refine).trim();
    if (!q) return articulos;
    const campos = ['Nombre', 'ArticuloEmpresa', 'ArticuloID', ...colsExtra.map((c) => c.atributo)];
    return articulos.filter((a) => campos.some((c) => norm(a[c]).includes(q)));
  }, [articulos, refine, colsExtra]);

  return (
    <div className="vista">
      {toolbar}
      {chips}
      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && <div className="resultados-count">{vista.length}{refine ? ` de ${articulos.length}` : ''} artículo(s)</div>}
      <div className="layout">
        <div className="lista">
          {vista.map((a) => (
            <button key={a.ArticuloID} className={`item ${sel?.ArticuloID === a.ArticuloID ? 'activo' : ''}`} onClick={() => setSel(a)}>
              <div className="item-nombre">{a.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">ID {a.ArticuloID} · {a.ArticuloEmpresa || 's/código'}{a.SeVende === 'True' && <span className="tag">vende</span>}</div>
              {colsExtra.some((c) => a[c.atributo] !== undefined && a[c.atributo] !== '') && (
                <div className="item-extra">
                  {colsExtra.filter((c) => a[c.atributo] !== undefined && a[c.atributo] !== '').map((c) => (
                    <span key={c.atributo} className="chip">{c.label}: {String(a[c.atributo])}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {estado === 'ok' && vista.length === 0 && <div className="muted">Sin resultados.</div>}
          {estado === 'idle' && <div className="muted">Configurá los filtros y tocá Buscar (o Buscar sin filtros para traer todo).</div>}
        </div>
        <div className="detalle">
          {sel ? <StockPanel articulo={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un artículo para ver su stock por depósito.</div>}
        </div>
      </div>
      {drawers}
    </div>
  );
}
