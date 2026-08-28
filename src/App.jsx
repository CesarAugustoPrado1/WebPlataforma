import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  filtrosHabilitados, COMPARADORES_POR_TIPO, LABEL_COMPARADOR, comparadorPorDefecto,
} from '../filtros.config.js';

const fmt = (n) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(n);

function useHealth() {
  const [health, setHealth] = useState({ estado: 'cargando' });
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d.conexionOk ? { estado: 'ok', ...d } : { estado: 'error', ...d }))
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

// Un control de valor según el tipo del filtro.
function ControlValor({ def, valor, onChange }) {
  if (def.tipo === 'boolean') {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">(cualquiera)</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (def.tipo === 'date') {
    return <input type="date" value={valor} onChange={(e) => onChange(e.target.value)} />;
  }
  const tipoInput = def.tipo === 'int' || def.tipo === 'decimal' ? 'number' : 'text';
  return (
    <input
      type={tipoInput}
      step={def.tipo === 'decimal' ? 'any' : undefined}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder="valor…"
    />
  );
}

function FiltroRow({ def, estado, setEstado }) {
  const comparadores = COMPARADORES_POR_TIPO[def.tipo] || COMPARADORES_POR_TIPO.string;
  return (
    <div className="filtro-row">
      <label className="filtro-label">{def.label}</label>
      <select
        className="filtro-comp"
        value={estado.comparador}
        onChange={(e) => setEstado({ ...estado, comparador: e.target.value })}
      >
        {comparadores.map((c) => (
          <option key={c} value={c}>{LABEL_COMPARADOR[c] || c}</option>
        ))}
      </select>
      <ControlValor def={def} valor={estado.valor} onChange={(v) => setEstado({ ...estado, valor: v })} />
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
  const filtrosDef = useMemo(() => filtrosHabilitados(), []);

  // Estado por filtro: { [atributo]: { comparador, valor } }
  const [valores, setValores] = useState(() =>
    Object.fromEntries(filtrosDef.map((f) => [f.atributo, { comparador: comparadorPorDefecto(f.tipo), valor: '' }]))
  );

  const [estado, setEstado] = useState('idle');
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(null);

  // Atributos extra (de filtros habilitados que son columnas) para mostrar en resultados.
  const colsExtra = useMemo(
    () => filtrosDef.filter((f) => f.columna && !['ArticuloID', 'Nombre', 'ArticuloEmpresa'].includes(f.atributo)),
    [filtrosDef]
  );

  const setFiltro = (atributo, nuevo) =>
    setValores((prev) => ({ ...prev, [atributo]: nuevo }));

  const buscar = useCallback((e) => {
    e?.preventDefault();
    const filtros = filtrosDef
      .map((f) => ({ atributo: f.atributo, ...valores[f.atributo] }))
      .filter((f) => (f.valor ?? '').toString().trim() !== '');

    setEstado('cargando'); setError(''); setSel(null);
    const url = `/api/articulos?filtros=${encodeURIComponent(JSON.stringify(filtros))}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setArticulos(d.articulos || []);
        setEstado('ok');
      })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [filtrosDef, valores]);

  const limpiar = () => {
    setValores(Object.fromEntries(filtrosDef.map((f) => [f.atributo, { comparador: comparadorPorDefecto(f.tipo), valor: '' }])));
    setArticulos([]); setEstado('idle'); setSel(null);
  };

  return (
    <div className="app">
      <header>
        <h1>WebPlataforma</h1>
        <EstadoConexion health={health} />
      </header>

      <form className="filtros" onSubmit={buscar}>
        <div className="filtros-grid">
          {filtrosDef.map((f) => (
            <FiltroRow
              key={f.atributo}
              def={f}
              estado={valores[f.atributo]}
              setEstado={(nuevo) => setFiltro(f.atributo, nuevo)}
            />
          ))}
        </div>
        <div className="filtros-acciones">
          <button type="submit" className="btn-primario" disabled={estado === 'cargando'}>
            {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
          </button>
          <button type="button" className="btn-sec" onClick={limpiar}>Limpiar</button>
          <span className="filtros-hint">{filtrosDef.length} filtro(s) configurado(s)</span>
        </div>
      </form>

      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && <div className="resultados-count">{articulos.length} artículo(s)</div>}

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
              {colsExtra.some((c) => a[c.atributo] !== undefined && a[c.atributo] !== '') && (
                <div className="item-extra">
                  {colsExtra
                    .filter((c) => a[c.atributo] !== undefined && a[c.atributo] !== '')
                    .map((c) => (
                      <span key={c.atributo} className="chip">
                        {c.label}: {String(a[c.atributo])}
                      </span>
                    ))}
                </div>
              )}
            </button>
          ))}
          {estado === 'ok' && articulos.length === 0 && (
            <div className="muted">Sin resultados con esos filtros.</div>
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
