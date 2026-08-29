import { useState, useCallback, useMemo } from 'react';
import { CATALOGO_FILTROS } from '../../filtros.config.js';
import { useBuscador } from '../components/useBuscador.jsx';
import StockPanel from '../components/StockPanel.jsx';
import { norm } from '../lib/format.js';

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
