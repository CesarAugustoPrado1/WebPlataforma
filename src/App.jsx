import { useEffect, useState, useCallback } from 'react';

const fmt = (n) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(n);

function useHealth() {
  const [health, setHealth] = useState({ estado: 'cargando' });
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d.conexionOk
        ? { estado: 'ok', ...d }
        : { estado: 'error', ...d }))
      .catch((e) => setHealth({ estado: 'error', error: e.message }));
  }, []);
  return health;
}

function EstadoConexion({ health }) {
  const color = health.estado === 'ok' ? '#16a34a' : health.estado === 'error' ? '#dc2626' : '#a1a1aa';
  const label = health.estado === 'ok'
    ? `ERP conectado · ${health.conexion || ''}`
    : health.estado === 'error'
      ? `Sin conexión al ERP${health.error ? ` · ${health.error}` : ''}`
      : 'Verificando conexión…';
  return (
    <div className="estado">
      <span className="dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function StockPanel({ articulo, onClose }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/stock?ids=${encodeURIComponent(articulo.ArticuloID)}`)
      .then((r) => r.json())
      .then((d) => setData({ estado: 'ok', stock: d.stock?.[0] || null }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [articulo]);

  const cols = [
    ['StockFisicoActual', 'Físico'],
    ['StockReservadoEnPedidos', 'Reservado'],
    ['StockEgresarPedidosVentas', 'A egresar (pedidos)'],
    ['StockIngresarCompras', 'A ingresar (compras)'],
    ['StockIngresarFabricacion', 'A ingresar (fabric.)'],
    ['StockEgresarFabricacion', 'A egresar (fabric.)'],
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
          <div className="total-row">
            <span>Stock físico total</span>
            <strong>{fmt(data.stock.total.StockFisicoActual)}</strong>
          </div>
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Depósito</th>
                  {cols.map(([, l]) => <th key={l} className="num">{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.stock.depositos.map((d) => (
                  <tr key={d.depositoId}>
                    <td>#{d.depositoId}</td>
                    {cols.map(([k]) => <td key={k} className="num">{fmt(d[k])}</td>)}
                  </tr>
                ))}
                <tr className="tfoot">
                  <td>Total</td>
                  {cols.map(([k]) => <td key={k} className="num"><strong>{fmt(data.stock.total[k])}</strong></td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const health = useHealth();
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('idle');
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);

  const buscar = useCallback((e) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/articulos?q=${encodeURIComponent(term)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setArticulos(d.articulos || []);
        setEstado('ok');
      })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [q]);

  return (
    <div className="app">
      <header>
        <h1>WebPlataforma</h1>
        <EstadoConexion health={health} />
      </header>

      <form className="buscador" onSubmit={buscar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, código de empresa o ID…"
          autoFocus
        />
        <button type="submit" disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && (
        <div className="resultados-count">{articulos.length} artículo(s)</div>
      )}

      <div className="layout">
        <div className="lista">
          {articulos.map((a) => (
            <button
              key={a.ArticuloID}
              className={`item ${sel?.ArticuloID === a.ArticuloID ? 'activo' : ''}`}
              onClick={() => setSel(a)}
            >
              <div className="item-nombre">{a.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">
                ID {a.ArticuloID} · {a.ArticuloEmpresa || 's/código'}
                {a.SeVende === 'True' && <span className="tag">vende</span>}
              </div>
            </button>
          ))}
          {estado === 'ok' && articulos.length === 0 && (
            <div className="muted">Sin resultados para “{q}”.</div>
          )}
        </div>

        <div className="detalle">
          {sel
            ? <StockPanel articulo={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un artículo para ver su stock por depósito.</div>}
        </div>
      </div>
    </div>
  );
}
