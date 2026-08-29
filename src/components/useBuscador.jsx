import { useEffect, useState, useCallback, useMemo } from 'react';
import { COMPARADORES_POR_TIPO, LABEL_COMPARADOR } from '../../filtros.comunes.js';
import {
  filtrosEfectivos, cargarOverrides, guardarOverrides, limpiarOverrides, overridesDesdeDraft,
} from '../lib/settings.js';
import { norm } from '../lib/format.js';

export function ControlValor({ def, valor, onChange, opciones, cargando }) {
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

function PanelAjustes({ draft, setDraft, opcionesPorAttr, cargandoOpc, onGuardar, onRestablecer, onCerrar }) {
  const [busca, setBusca] = useState('');
  const q = norm(busca).trim();
  const lista = q ? draft.filter((f) => norm(f.label).includes(q) || norm(f.atributo).includes(q)) : draft;
  const setRow = (atributo, patch) => setDraft((prev) => prev.map((f) => (f.atributo === atributo ? { ...f, ...patch } : f)));
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
                  <input type="checkbox" checked={f.habilitado} onChange={(e) => setRow(f.atributo, { habilitado: e.target.checked })} />
                  <span>usar</span>
                </label>
                <input className="ajuste-label" value={f.label} onChange={(e) => setRow(f.atributo, { label: e.target.value })} title={f.atributo} />
                <span className="ajuste-attr">{f.atributo}</span>
              </div>
              {f.habilitado && (
                <div className="ajuste-def">
                  <span className="ajuste-def-lbl">Por defecto:</span>
                  <select className="filtro-comp" value={f.comparadorDefault} onChange={(e) => setRow(f.atributo, { comparadorDefault: e.target.value })}>
                    {(COMPARADORES_POR_TIPO[f.tipo] || COMPARADORES_POR_TIPO.string).map((c) => (
                      <option key={c} value={c}>{LABEL_COMPARADOR[c] || c}</option>
                    ))}
                  </select>
                  <ControlValor def={f} valor={f.valorDefault} onChange={(v) => setRow(f.atributo, { valorDefault: v })}
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

/**
 * Motor de búsqueda configurable (filtros + ajustes) reutilizable por entidad.
 * Devuelve { filtrosDef, filtrosActivos, toolbar, chips, drawers } para componer la vista.
 */
export function useBuscador({ catalogo, storageKey, valoresUrl, onBuscar, buscando, refine, setRefine, refinePlaceholder, seedExtra }) {
  const [overrides, setOverrides] = useState(() => cargarOverrides(storageKey));
  const catalogoEf = useMemo(() => filtrosEfectivos(catalogo, overrides), [catalogo, overrides]);
  const filtrosDef = useMemo(() => catalogoEf.filter((f) => f.habilitado), [catalogoEf]);

  const seed = useCallback((defs) => {
    const base = Object.fromEntries(defs.map((f) => [f.atributo, { comparador: f.comparadorDefault, valor: f.valorDefault ?? '' }]));
    if (seedExtra) for (const [a, v] of Object.entries(seedExtra)) if (base[a]) base[a] = { ...base[a], ...v };
    return base;
  }, [seedExtra]);

  const [valores, setValores] = useState(() => seed(filtrosDef));
  const [drawer, setDrawer] = useState(null);
  const [draft, setDraft] = useState(catalogoEf);
  const [opcionesPorAttr, setOpcionesPorAttr] = useState({});
  const [cargandoOpc, setCargandoOpc] = useState({});

  useEffect(() => { setValores(seed(filtrosDef)); }, [filtrosDef, seed]);

  const setFiltro = (atributo, nuevo) => setValores((prev) => ({ ...prev, [atributo]: nuevo }));

  const cargarOpciones = useCallback((defs) => {
    if (!valoresUrl) return;
    defs.filter((f) => f.opciones === 'lista').forEach((f) => {
      setCargandoOpc((c) => {
        if (opcionesPorAttr[f.atributo] || c[f.atributo]) return c;
        fetch(valoresUrl(f.atributo)).then((r) => r.json())
          .then((d) => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: d.valores || [] })))
          .catch(() => setOpcionesPorAttr((o) => ({ ...o, [f.atributo]: [] })))
          .finally(() => setCargandoOpc((cc) => ({ ...cc, [f.atributo]: false })));
        return { ...c, [f.atributo]: true };
      });
    });
  }, [opcionesPorAttr, valoresUrl]);

  const abrirFiltros = () => { setDrawer('filtros'); cargarOpciones(filtrosDef); };
  const abrirAjustes = () => { setDraft(filtrosEfectivos(catalogo, overrides)); setDrawer('ajustes'); cargarOpciones(catalogo); };

  const guardarAjustes = () => {
    const nuevos = overridesDesdeDraft(catalogo, draft);
    guardarOverrides(storageKey, nuevos); setOverrides(nuevos); setDrawer(null);
  };
  const restablecerAjustes = () => { limpiarOverrides(storageKey); setOverrides({}); setDraft(filtrosEfectivos(catalogo, {})); };

  const filtrosActivos = useMemo(
    () => filtrosDef.map((f) => ({ atributo: f.atributo, tipo: f.tipo, ...valores[f.atributo] }))
      .filter((f) => (f.valor ?? '').toString().trim() !== ''),
    [filtrosDef, valores]
  );

  const disparar = useCallback(() => { setDrawer(null); onBuscar(filtrosActivos); }, [onBuscar, filtrosActivos]);
  const restablecerValores = () => { setValores(seed(filtrosDef)); setRefine?.(''); };

  const toolbar = (
    <div className="toolbar">
      <input className="refine" value={refine} onChange={(e) => setRefine(e.target.value)} placeholder={refinePlaceholder || 'Refinar resultados por texto…'} />
      <button className="btn-filtros" onClick={abrirFiltros}>
        Filtros{filtrosActivos.length > 0 && <span className="badge">{filtrosActivos.length}</span>}
      </button>
      <button className="btn-icono" title="Ajustes de filtros" onClick={abrirAjustes}>⚙</button>
      <button className="btn-primario" onClick={disparar} disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar'}</button>
    </div>
  );

  const chips = filtrosActivos.length > 0 ? (
    <div className="chips-activos">
      {filtrosActivos.map((f) => {
        const def = filtrosDef.find((d) => d.atributo === f.atributo);
        return <span className="chip-filtro" key={f.atributo}>{def.label} {LABEL_COMPARADOR[f.comparador] || f.comparador} <b>{f.valor}</b></span>;
      })}
    </div>
  ) : null;

  const drawers = (
    <>
      {drawer === 'filtros' && (
        <PanelFiltros defs={filtrosDef} valores={valores} setFiltro={setFiltro}
          opcionesPorAttr={opcionesPorAttr} cargandoOpc={cargandoOpc}
          onAplicar={disparar} onLimpiar={restablecerValores} onCerrar={() => setDrawer(null)} />
      )}
      {drawer === 'ajustes' && (
        <PanelAjustes draft={draft} setDraft={setDraft}
          opcionesPorAttr={opcionesPorAttr} cargandoOpc={cargandoOpc}
          onGuardar={guardarAjustes} onRestablecer={restablecerAjustes} onCerrar={() => setDrawer(null)} />
      )}
    </>
  );

  return { filtrosDef, filtrosActivos, toolbar, chips, drawers };
}
