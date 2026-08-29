import { useEffect, useState, useCallback, useMemo } from 'react';
import { COMPARADORES_POR_TIPO, LABEL_COMPARADOR, CATALOGO_FILTROS } from '../../filtros.config.js';
import {
  filtrosEfectivos, cargarOverrides, guardarOverrides, limpiarOverrides,
  overridesDesdeDraft, comparadorInicial,
} from '../settings.js';
import { fmtNum as fmt, norm } from '../lib/format.js';

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
        <option value="">(cualquiera)</option><option value="true">Sí</option><option value="false">No</option>
      </select>
    );
  }
  if (def.tipo === 'date') return <input type="date" value={valor} onChange={(e) => onChange(e.target.value)} />;
  const tipoInput = def.tipo === 'int' || def.tipo === 'decimal' ? 'number' : 'text';
  return <input type={tipoInput} step={def.tipo === 'decimal' ? 'any' : undefined}
    value={valor} onChange={(e) => onChange(e.target.value)} placeholder="valor…" />;
}

// ---- Drawer: búsqueda actual -------------------------------------------------
function PanelFiltros({ defs, valores, setFiltro, opcionesPorAttr, cargandoOpc, onAplicar, onLimpiar, onCerrar }) {
  return (
    <div className="drawer-backdrop" onClick={onCerrar}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><strong>Filtros de la búsqueda</strong><button className="btn-x" onClick={onCerrar}>✕</button></div>
        <div className="drawer-body">
          {defs.map((f) => (
            <div className="filtro-row" key={f.atributo}>
              <label className="filtro-label" title={f.atributo}>{f.label}</label>
              <select className="filtro-comp" value={valores[f.atributo].comparador}
                onChange={(e) => setFiltro(f.atributo, { ...valores[f.atributo], comparador: e.target.value })}>
                {(COMPARADORES_POR_TIPO[f.tipo] || COMPARADORES_POR_TIPO.string).map((c) => (
                  <option key={c} value={c}>{LABEL_COMPARADOR[c] || c}</option>
                ))}
              </select>
              <ControlValor def={f} valor={valores[f.atributo].valor}
                onChange={(v) => setFiltro(f.atributo, { ...valores[f.atributo], valor: v })}
                opciones={opcionesPorAttr[f.atributo]} cargando={cargandoOpc[f.atributo]} />
            </div>
          ))}
          {defs.length === 0 && <div className="muted">No hay filtros habilitados. Abrí Ajustes ⚙ para activar algunos.</div>}
        </div>
        <div className="drawer-foot">
          <button className="btn-primario" onClick={onAplicar}>Aplicar y buscar</button>
          <button className="btn-sec" onClick={onLimpiar}>Restablecer valores</button>
        </div>
      </aside>
    </div>
  );
}

// ---- Drawer: Ajustes ---------------------------------------------------------
function PanelAjustes({ draft, setDraft, opcionesPorAttr, cargandoOpc, onGuardar, onRestablecer, onCerrar }) {
  const [busca, setBusca] = useState('');
  const q = norm(busca).trim();
  const lista = q ? draft.filter((f) => norm(f.label).includes(q) || norm(f.atributo).includes(q)) : draft;
  const setRow = (atributo, patch) =>
    setDraft((prev) => prev.map((f) => (f.atributo === atributo ? { ...f, ...patch } : f)));
  const activos = draft.filter((f) => f.habilitado).length;

  return (
    <div className="drawer-backdrop" onClick={onCerrar}>
      <aside className="drawer drawer-ancho" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <strong>Ajustes de filtros</strong>
          <span className="drawer-sub">{activos} habilitado(s)</span>
          <button className="btn-x" onClick={onCerrar}>✕</button>
        </div>
        <div className="ajustes-buscador">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar filtro por nombre…" />
          <span className="muted-sm">Elegí qué filtros usar, renombralos y fijá un valor por defecto (opcional).</span>
        </div>
        <div className="drawer-body">
          {lista.map((f) => (
            <div className={`ajuste-card ${f.habilitado ? 'on' : ''}`} key={f.atributo}>
              <div className="ajuste-top">
                <label className="check">
                  <input type="checkbox" checked={f.habilitado}
                    onChange={(e) => setRow(f.atributo, { habilitado: e.target.checked })} />
                  <span>usar</span>
                </label>
                <input className="ajuste-label" value={f.label}
                  onChange={(e) => setRow(f.atributo, { label: e.target.value })} title={f.atributo} />
                <span className="ajuste-attr">{f.atributo}</span>
              </div>
              {f.habilitado && (
                <div className="ajuste-def">
                  <span className="ajuste-def-lbl">Por defecto:</span>
                  <select className="filtro-comp" value={f.comparadorDefault}
                    onChange={(e) => setRow(f.atributo, { comparadorDefault: e.target.value })}>
                    {(COMPARADORES_POR_TIPO[f.tipo] || COMPARADORES_POR_TIPO.string).map((c) => (
                      <option key={c} value={c}>{LABEL_COMPARADOR[c] || c}</option>
                    ))}
                  </select>
                  <ControlValor def={f} valor={f.valorDefault}
                    onChange={(v) => setRow(f.atributo, { valorDefault: v })}
                    opciones={opcionesPorAttr[f.atributo]} cargando={cargandoOpc[f.atributo]} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="drawer-foot">
          <button className="btn-primario" onClick={onGuardar}>Guardar ajustes</button>
          <button className="btn-sec" onClick={onRestablecer}>Restablecer todo</button>
        </div>
      </aside>
    </div>
  );
}

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
  const [overrides, setOverrides] = useState(cargarOverrides);
  const catalogoEf = useMemo(() => filtrosEfectivos(overrides), [overrides]);
  const filtrosDef = useMemo(() => catalogoEf.filter((f) => f.habilitado), [catalogoEf]);

  const seed = useCallback((defs) =>
    Object.fromEntries(defs.map((f) => [f.atributo, { comparador: f.comparadorDefault, valor: f.valorDefault ?? '' }])),
    []);

  const [valores, setValores] = useState(() => seed(filtrosDef));
  const [drawer, setDrawer] = useState(null); // 'filtros' | 'ajustes' | null
  const [draft, setDraft] = useState(catalogoEf);
  const [opcionesPorAttr, setOpcionesPorAttr] = useState({});
  const [cargandoOpc, setCargandoOpc] = useState({});

  const [estado, setEstado] = useState('idle');
  const [articulos, setArticulos] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  // Al cambiar los ajustes, resembrar los valores de búsqueda con los nuevos defaults.
  useEffect(() => { setValores(seed(filtrosDef)); }, [filtrosDef, seed]);

  const colsExtra = useMemo(
    () => filtrosDef.filter((f) => f.columna && !['ArticuloID', 'Nombre', 'ArticuloEmpresa'].includes(f.atributo)),
    [filtrosDef]
  );

  const setFiltro = (atributo, nuevo) => setValores((prev) => ({ ...prev, [atributo]: nuevo }));

  // Cargar opciones de los desplegables (filtros tipo lista) al abrir cualquier drawer.
  const cargarOpciones = useCallback((defs) => {
    defs.filter((f) => f.opciones === 'lista').forEach((f) => {
      setCargandoOpc((c) => {
        if (opcionesPorAttr[f.atributo] || c[f.atributo]) return c; // ya cargado o en curso
        fetch(`/api/valores?atributo=${encodeURIComponent(f.atributo)}`).then((r) => r.json())
          .then((d) => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: d.valores || [] })))
          .catch(() => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: [] })))
          .finally(() => setCargandoOpc((cc) => ({ ...cc, [f.atributo]: false })));
        return { ...c, [f.atributo]: true };
      });
    });
  }, [opcionesPorAttr]);

  const abrirFiltros = () => { setDrawer('filtros'); cargarOpciones(filtrosDef); };
  const abrirAjustes = () => { setDraft(filtrosEfectivos(overrides)); setDrawer('ajustes'); cargarOpciones(CATALOGO_FILTROS); };

  const guardarAjustes = () => {
    const nuevos = overridesDesdeDraft(draft);
    guardarOverrides(nuevos); setOverrides(nuevos); setDrawer(null);
  };
  const restablecerAjustes = () => {
    limpiarOverrides(); setOverrides({}); setDraft(filtrosEfectivos({}));
  };

  const filtrosActivos = useMemo(
    () => filtrosDef.map((f) => ({ atributo: f.atributo, ...valores[f.atributo] }))
      .filter((f) => (f.valor ?? '').toString().trim() !== ''),
    [filtrosDef, valores]
  );

  const buscar = useCallback(() => {
    setEstado('cargando'); setError(''); setSel(null); setDrawer(null);
    const activos = filtrosDef.map((f) => ({ atributo: f.atributo, ...valores[f.atributo] }))
      .filter((f) => (f.valor ?? '').toString().trim() !== '');
    fetch(`/api/articulos?filtros=${encodeURIComponent(JSON.stringify(activos))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setArticulos(d.articulos || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [filtrosDef, valores]);

  const restablecerValores = () => { setValores(seed(filtrosDef)); setRefine(''); };

  const articulosVista = useMemo(() => {
    const q = norm(refine).trim();
    if (!q) return articulos;
    const campos = ['Nombre', 'ArticuloEmpresa', 'ArticuloID', ...colsExtra.map((c) => c.atributo)];
    return articulos.filter((a) => campos.some((c) => norm(a[c]).includes(q)));
  }, [articulos, refine, colsExtra]);

  return (
    <div className="vista">
      <div className="toolbar">
        <input className="refine" value={refine} onChange={(e) => setRefine(e.target.value)}
          placeholder="Refinar resultados por texto (nombre, código, ID…)" />
        <button className="btn-filtros" onClick={abrirFiltros}>
          Filtros{filtrosActivos.length > 0 && <span className="badge">{filtrosActivos.length}</span>}
        </button>
        <button className="btn-icono" title="Ajustes de filtros" onClick={abrirAjustes}>⚙</button>
        <button className="btn-primario" onClick={buscar} disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {filtrosActivos.length > 0 && (
        <div className="chips-activos">
          {filtrosActivos.map((f) => {
            const def = filtrosDef.find((d) => d.atributo === f.atributo);
            return <span className="chip-filtro" key={f.atributo}>{def.label} {LABEL_COMPARADOR[f.comparador] || f.comparador} <b>{f.valor}</b></span>;
          })}
        </div>
      )}

      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && <div className="resultados-count">{articulosVista.length}{refine ? ` de ${articulos.length}` : ''} artículo(s)</div>}

      <div className="layout">
        <div className="lista">
          {articulosVista.map((a) => (
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
          {estado === 'ok' && articulosVista.length === 0 && <div className="muted">Sin resultados.</div>}
          {estado === 'idle' && <div className="muted">Configurá los filtros y tocá Buscar (o Buscar sin filtros para traer todo).</div>}
        </div>
        <div className="detalle">
          {sel ? <StockPanel articulo={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un artículo para ver su stock por depósito.</div>}
        </div>
      </div>

      {drawer === 'filtros' && (
        <PanelFiltros defs={filtrosDef} valores={valores} setFiltro={setFiltro}
          opcionesPorAttr={opcionesPorAttr} cargandoOpc={cargandoOpc}
          onAplicar={buscar} onLimpiar={restablecerValores} onCerrar={() => setDrawer(null)} />
      )}
      {drawer === 'ajustes' && (
        <PanelAjustes draft={draft} setDraft={setDraft}
          opcionesPorAttr={opcionesPorAttr} cargandoOpc={cargandoOpc}
          onGuardar={guardarAjustes} onRestablecer={restablecerAjustes} onCerrar={() => setDrawer(null)} />
      )}
    </div>
  );
}
