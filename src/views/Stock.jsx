import { useState, useCallback, useMemo } from 'react';
import { CATALOGO_FILTROS } from '../../filtros.config.js';
import { useBuscador } from '../components/useBuscador.jsx';
import StockPanel from '../components/StockPanel.jsx';
import Agrupador from '../components/Agrupador.jsx';
import { fmtNum as fmt, parseNum, norm } from '../lib/format.js';

const TOPE = 150; // máximo de artículos a los que traemos stock en lote

const DIMS_STOCK = [
  { key: 'UnidadDeMedidaDeStock', label: 'Unidad de medida' },
];
const MEDS_STOCK = [
  { key: 'fisico', label: 'Stock físico', tipo: 'suma', get: (r) => r.fisico },
  { key: 'reservado', label: 'Reservado', tipo: 'suma', get: (r) => r.reservado },
  { key: 'conteo', label: 'Cantidad de artículos', tipo: 'conteo' },
];

export default function StockView() {
  const [estado, setEstado] = useState('idle');
  const [filas, setFilas] = useState([]);   // {ArticuloID, Nombre, ArticuloEmpresa, UM, fisico, reservado}
  const [truncado, setTruncado] = useState(0);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);
  const [orden, setOrden] = useState('fisico'); // 'fisico' | 'nombre'
  const [modo, setModo] = useState('lista');

  const onBuscar = useCallback((filtros) => {
    setEstado('cargando'); setError(''); setSel(null); setTruncado(0);
    fetch(`/api/articulos?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        const arts = d.articulos || [];
        const usar = arts.slice(0, TOPE);
        if (arts.length > TOPE) setTruncado(arts.length);
        if (!usar.length) { setFilas([]); setEstado('ok'); return; }
        const ids = usar.map((a) => a.ArticuloID).join(',');
        return fetch(`/api/stock?ids=${encodeURIComponent(ids)}`).then((r) => r.json()).then((s) => {
          if (s.error) throw new Error(s.error);
          const porId = Object.fromEntries((s.stock || []).map((x) => [String(x.articuloId), x.total]));
          setFilas(usar.map((a) => {
            const t = porId[String(a.ArticuloID)] || {};
            return {
              ArticuloID: a.ArticuloID, Nombre: a.Nombre, ArticuloEmpresa: a.ArticuloEmpresa,
              UnidadDeMedidaDeStock: a.UnidadDeMedidaDeStock,
              fisico: t.StockFisicoActual ?? 0, reservado: t.StockReservadoEnPedidos ?? 0,
            };
          }));
          setEstado('ok');
        });
      })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, []);

  const { toolbar, chips, drawers } = useBuscador({
    catalogo: CATALOGO_FILTROS,
    storageKey: 'webplataforma.settings.v1', // comparte filtros/nombres con Artículos
    valoresUrl: (a) => `/api/valores?atributo=${encodeURIComponent(a)}`,
    onBuscar, buscando: estado === 'cargando',
    refine, setRefine, refinePlaceholder: 'Refinar (nombre, código, ID…)',
  });

  const vista = useMemo(() => {
    const q = norm(refine).trim();
    let arr = q ? filas.filter((f) => ['Nombre', 'ArticuloEmpresa', 'ArticuloID'].some((k) => norm(f[k]).includes(q))) : filas;
    arr = [...arr].sort((a, b) => orden === 'nombre'
      ? String(a.Nombre).localeCompare(String(b.Nombre), 'es')
      : (parseNum(b.fisico) || 0) - (parseNum(a.fisico) || 0));
    return arr;
  }, [filas, refine, orden]);

  return (
    <div className="vista">
      {toolbar}
      {chips}
      {estado === 'error' && <div className="error-box">{error}</div>}
      {truncado > 0 && <div className="hint-bar">Mostrando stock de los primeros {TOPE} de {truncado} artículos. Afiná los filtros para ver otros.</div>}
      {estado === 'ok' && (
        <div className="sub-toolbar">
          <div className="vista-toggle">
            <button className={modo === 'lista' ? 'activo' : ''} onClick={() => setModo('lista')}>Lista</button>
            <button className={modo === 'agrupar' ? 'activo' : ''} onClick={() => setModo('agrupar')}>Agrupar</button>
          </div>
          <span className="resultados-count">{vista.length} artículo(s)</span>
          {modo === 'lista' && (
            <label className="muted-sm">Orden:&nbsp;
              <select value={orden} onChange={(e) => setOrden(e.target.value)} className="filtro-comp">
                <option value="fisico">Más stock primero</option>
                <option value="nombre">Nombre</option>
              </select>
            </label>
          )}
        </div>
      )}
      {estado === 'ok' && modo === 'agrupar' ? (
        <Agrupador data={filas} dimensiones={DIMS_STOCK} medidas={MEDS_STOCK} />
      ) : (
      <div className="layout">
        <div className="lista">
          {vista.map((f) => (
            <button key={f.ArticuloID} className={`item ${sel?.ArticuloID === f.ArticuloID ? 'activo' : ''}`} onClick={() => setSel(f)}>
              <div className="item-nombre">{f.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">
                ID {f.ArticuloID} · {f.ArticuloEmpresa || 's/código'} · {f.UnidadDeMedidaDeStock || '—'}
                <span className="importe">{fmt(parseNum(f.fisico))} <span className="muted-sm">{f.UnidadDeMedidaDeStock}</span></span>
              </div>
            </button>
          ))}
          {estado === 'ok' && vista.length === 0 && <div className="muted">Sin artículos.</div>}
          {estado === 'idle' && <div className="muted">Filtrá artículos y tocá Buscar para ver su stock.</div>}
        </div>
        <div className="detalle">
          {sel ? <StockPanel articulo={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un artículo para ver el stock por depósito.</div>}
        </div>
      </div>
      )}
      {drawers}
    </div>
  );
}
