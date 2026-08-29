import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  filtrosHabilitados, COMPARADORES_POR_TIPO, LABEL_COMPARADOR, comparadorPorDefecto,
} from '../filtros.config.js';

const fmt = (n) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(n);

const norm = (s) =>
  (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
    <div className="estado"><span className="dot" style={{ background: color }} /><span>{label}</span></div>
  );
}

// Control de valor de un filtro dentro del panel.
function ControlValor({ def, valor, onChange, opciones, cargando }) {
  if (def.opciones === 'lista') {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">{cargando ? 'cargando…' : '(todos)'}</option>
        {(opciones || []).map((o) => (
          <option key={o.valor} value={o.valor}>{o.label !== o.valor ? `${o.valor} · ${o.label}` : o.valor}</option>
        ))}
      </select>
    );
  }
  if (def.tipo === 'boolean') {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">(cualquiera)</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (def.tipo === 'date') return <input type="date" value={valor} onChange={(e) => onChange(e.target.value)} />;
  const tipoInput = def.tipo === 'int' || def.tipo === 'decimal' ? 'number' : 'text';
  return (
    <input type={tipoInput} step={def.tipo === 'decimal' ? 'any' : undefined}
      value={valor} onChange={(e) => onChange(e.target.value)} placeholder="valor…" />
  );
}

function PanelFiltros({ defs, valores, setFiltro, opcionesPorAttr, cargandoOpc, onAplicar, onLimpiar, onCerrar }) {
  return (
    <div className="drawer-backdrop" onClick={onCerrar}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <strong>Filtros</strong>
          <button className="btn-x" onClick={onCerrar}>✕</button>
        </div>
        <div className="drawer-body">
          {defs.map((f) => (
            <div className="filtro-row" key={f.atributo}>
              <label className="filtro-label" title={f.atributo}>{f.label}</label>
              <select
                className="filtro-comp"
                value={valores[f.atributo].comparador}
                onChange={(e) => setFiltro(f.atributo, { ...valores[f.atributo], comparador: e.target.value })}
              >
                {(COMPARADORES_POR_TIPO[f.tipo] || COMPARADORES_POR_TIPO.string).map((c) => (
                  <option key={c} value={c}>{LABEL_COMPARADOR[c] || c}</option>
                ))}
              </select>
              <ControlValor
                def={f}
                valor={valores[f.atributo].valor}
                onChange={(v) => setFiltro(f.atributo, { ...valores[f.atributo], valor: v })}
                opciones={opcionesPorAttr[f.atributo]}
                cargando={cargandoOpc[f.atributo]}
              />
            </div>
          ))}
          {defs.length === 0 && <div className="muted">No hay filtros habilitados en la configuración.</div>}
        </div>
        <div className="drawer-foot">
          <button className="btn-primario" onClick={onAplicar}>Aplicar y buscar</button>
          <button className="btn-sec" onClick={onLimpiar}>Limpiar</button>
        </div>
      </aside>
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

export default function App() {
  const health = useHealth();
  const filtrosDef = useMemo(() => filtrosHabilitados(), []);
  // Para filtros de lista (valor elegible) el comparador por defecto es "igual a".
  const compDefault = (f) => (f.opciones === 'lista' ? 'Equals' : comparadorPorDefecto(f.tipo));
  const nuevoEstadoValores = () =>
    Object.fromEntries(filtrosDef.map((f) => [f.atributo, { comparador: compDefault(f), valor: '' }]));

  const [valores, setValores] = useState(nuevoEstadoValores);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [opcionesPorAttr, setOpcionesPorAttr] = useState({});
  const [cargandoOpc, setCargandoOpc] = useState({});

  const [estado, setEstado] = useState('idle');
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  const colsExtra = useMemo(
    () => filtrosDef.filter((f) => f.columna && !['ArticuloID', 'Nombre', 'ArticuloEmpresa'].includes(f.atributo)),
    [filtrosDef]
  );

  const setFiltro = (atributo, nuevo) => setValores((prev) => ({ ...prev, [atributo]: nuevo }));

  // Cargar opciones (desplegables) de los filtros tipo "lista" al abrir el panel.
  useEffect(() => {
    if (!drawerOpen) return;
    filtrosDef.filter((f) => f.opciones === 'lista').forEach((f) => {
      if (opcionesPorAttr[f.atributo] || cargandoOpc[f.atributo]) return;
      setCargandoOpc((c) => ({ ...c, [f.atributo]: true }));
      fetch(`/api/valores?atributo=${encodeURIComponent(f.atributo)}`)
        .then((r) => r.json())
        .then((d) => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: d.valores || [] })))
        .catch(() => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: [] })))
        .finally(() => setCargandoOpc((c) => ({ ...c, [f.atributo]: false })));
    });
  }, [drawerOpen]); // eslint-disable-line

  const filtrosActivos = useMemo(
    () => filtrosDef.map((f) => ({ atributo: f.atributo, ...valores[f.atributo] }))
      .filter((f) => (f.valor ?? '').toString().trim() !== ''),
    [filtrosDef, valores]
  );

  const buscar = useCallback(() => {
    setEstado('cargando'); setError(''); setSel(null); setDrawerOpen(false);
    const url = `/api/articulos?filtros=${encodeURIComponent(JSON.stringify(filtrosActivos))}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setArticulos(d.articulos || []);
        setEstado('ok');
      })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [filtrosActivos]);

  const limpiarFiltros = () => { setValores(nuevoEstadoValores()); setRefine(''); };

  // Refinado por texto (cliente) sobre los resultados ya traídos del ERP.
  const articulosVista = useMemo(() => {
    const q = norm(refine).trim();
    if (!q) return articulos;
    const campos = ['Nombre', 'ArticuloEmpresa', 'ArticuloID', ...colsExtra.map((c) => c.atributo)];
    return articulos.filter((a) => campos.some((c) => norm(a[c]).includes(q)));
  }, [articulos, refine, colsExtra]);

  return (
    <div className="app">
      <header>
        <h1>WebPlataforma</h1>
        <EstadoConexion health={health} />
      </header>

      <div className="toolbar">
        <input
          className="refine"
          value={refine}
          onChange={(e) => setRefine(e.target.value)}
          placeholder="Refinar resultados por texto (nombre, código, ID…)"
        />
        <button className="btn-filtros" onClick={() => setDrawerOpen(true)}>
          Filtros{filtrosActivos.length > 0 && <span className="badge">{filtrosActivos.length}</span>}
        </button>
        <button className="btn-primario" onClick={buscar} disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {filtrosActivos.length > 0 && (
        <div className="chips-activos">
          {filtrosActivos.map((f) => {
            const def = filtrosDef.find((d) => d.atributo === f.atributo);
            return (
              <span className="chip-filtro" key={f.atributo}>
                {def.label} {LABEL_COMPARADOR[f.comparador] || f.comparador} <b>{f.valor}</b>
              </span>
            );
          })}
        </div>
      )}

      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && (
        <div className="resultados-count">
          {articulosVista.length}{refine ? ` de ${articulos.length}` : ''} artículo(s)
        </div>
      )}

      <div className="layout">
        <div className="lista">
          {articulosVista.map((a) => (
            <button key={a.ArticuloID} className={`item ${sel?.ArticuloID === a.ArticuloID ? 'activo' : ''}`} onClick={() => setSel(a)}>
              <div className="item-nombre">{a.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">
                ID {a.ArticuloID} · {a.ArticuloEmpresa || 's/código'}
                {a.SeVende === 'True' && <span className="tag">vende</span>}
              </div>
              {colsExtra.some((c) => a[c.atributo] !== undefined && a[c.atributo] !== '') && (
                <div className="item-extra">
                  {colsExtra.filter((c) => a[c.atributo] !== undefined && a[c.atributo] !== '').map((c) => (
                    <span key={c.atributo} className="chip">{c.label}: {String(a[c.atributo])}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {estado === 'ok' && articulosVista.length === 0 && <div className="muted">Sin resultados.</div>}
          {estado === 'idle' && <div className="muted">Configurá los filtros y tocá Buscar (o Buscar sin filtros para traer todo).</div>}
        </div>

        <div className="detalle">
          {sel ? <StockPanel articulo={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un artículo para ver su stock por depósito.</div>}
        </div>
      </div>

      {drawerOpen && (
        <PanelFiltros
          defs={filtrosDef}
          valores={valores}
          setFiltro={setFiltro}
          opcionesPorAttr={opcionesPorAttr}
          cargandoOpc={cargandoOpc}
          onAplicar={buscar}
          onLimpiar={limpiarFiltros}
          onCerrar={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
