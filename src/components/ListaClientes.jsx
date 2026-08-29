import { useState, useCallback, useMemo } from 'react';
import { CATALOGO_CLIENTES } from '../../clientes.config.js';
import { useBuscador } from './useBuscador.jsx';
import { norm } from '../lib/format.js';

// Lista de clientes filtrable (motor de Filtros + Ajustes), con un panel de
// detalle configurable por la vista que la usa (ficha, cuenta corriente, pendientes).
export default function ListaClientes({ storageKey, renderDetalle, placeholder }) {
  const [estado, setEstado] = useState('idle');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null); // {id, nombre}

  const onBuscar = useCallback((filtros) => {
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/clientes?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setClientes(d.clientes || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, []);

  const { filtrosDef, toolbar, chips, drawers } = useBuscador({
    catalogo: CATALOGO_CLIENTES,
    storageKey,
    valoresUrl: (a) => `/api/valores?entidad=clientes&atributo=${encodeURIComponent(a)}`,
    onBuscar, buscando: estado === 'cargando',
    refine, setRefine, refinePlaceholder: 'Refinar resultados (nombre, localidad, ID…)',
  });

  const colsExtra = useMemo(
    () => filtrosDef.filter((f) => f.columna && !['ClienteID', 'Nombre', 'Localidad', 'Provincia'].includes(f.atributo)),
    [filtrosDef]
  );

  const vista = useMemo(() => {
    const q = norm(refine).trim();
    if (!q) return clientes;
    const campos = ['Nombre', 'NombreLegal', 'Localidad', 'Provincia', 'ClienteID', 'Email', ...colsExtra.map((c) => c.atributo)];
    return clientes.filter((c) => campos.some((k) => norm(c[k]).includes(q)));
  }, [clientes, refine, colsExtra]);

  return (
    <div className="vista">
      {toolbar}
      {chips}
      {estado === 'error' && <div className="error-box">{error}</div>}
      {estado === 'ok' && <div className="resultados-count">{vista.length}{refine ? ` de ${clientes.length}` : ''} cliente(s)</div>}
      <div className="layout">
        <div className="lista">
          {vista.map((c) => (
            <button key={c.ClienteID} className={`item ${sel?.id === c.ClienteID ? 'activo' : ''}`}
              onClick={() => setSel({ id: c.ClienteID, nombre: c.Nombre })}>
              <div className="item-nombre">{c.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">ID {c.ClienteID}{c.Localidad ? ` · ${c.Localidad}` : ''}{c.Provincia ? `, ${c.Provincia}` : ''}</div>
              {(c.CondicionAnteElIVANombre || colsExtra.some((x) => (c[x.atributo] ?? '') !== '')) && (
                <div className="item-extra">
                  {c.CondicionAnteElIVANombre && <span className="chip">{c.CondicionAnteElIVANombre}</span>}
                  {colsExtra.filter((x) => (c[x.atributo] ?? '') !== '').map((x) => (
                    <span key={x.atributo} className="chip">{x.label}: {String(c[x.atributo])}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {estado === 'ok' && vista.length === 0 && <div className="muted">Sin resultados.</div>}
          {estado === 'idle' && <div className="muted">Configurá los filtros y tocá Buscar.</div>}
        </div>
        <div className="detalle">
          {sel ? renderDetalle(sel) : <div className="placeholder">{placeholder}</div>}
        </div>
      </div>
      {drawers}
    </div>
  );
}
