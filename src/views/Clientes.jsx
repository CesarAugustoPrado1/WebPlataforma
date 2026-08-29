import { useState, useCallback, useMemo, useEffect } from 'react';
import { CATALOGO_CLIENTES } from '../../clientes.config.js';
import { useBuscador } from '../components/useBuscador.jsx';
import { norm } from '../lib/format.js';

const FICHA = [
  ['NombreLegal', 'Razón social'], ['ClaveTributaria', 'CUIT'], ['CondicionAnteElIVANombre', 'Cond. IVA'],
  ['IngresosBrutos', 'Ing. Brutos'], ['Domicilio', 'Domicilio'], ['Localidad', 'Localidad'],
  ['CodigoPostal', 'CP'], ['ProvinciaNombre', 'Provincia'], ['PaisNombre', 'País'],
  ['Telefono', 'Teléfono'], ['Fax', 'Fax'], ['Email', 'Email'],
  ['CondicionPagoNombre', 'Cond. pago'], ['MonedaUsualCuentaCorrienteNombre', 'Moneda cta. cte.'],
  ['TipoDeClienteNombre', 'Tipo de cliente'], ['ActividadDeClienteNombre', 'Actividad'],
  ['ContactoDeVenta', 'Contacto ventas'], ['ContactoDeCobros', 'Contacto cobros'],
  ['CuentaCliente', 'Cuenta'], ['Referencia', 'Referencia'],
  ['HorarioDeAtencion', 'Horario atención'], ['HorarioDeEntrega', 'Horario entrega'],
  ['Observacion', 'Observación'],
];

function Ficha({ id, onClose }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/clientes?id=${encodeURIComponent(id)}`).then((r) => r.json())
      .then((d) => setData({ estado: 'ok', cliente: d.cliente }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [id]);
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{data.cliente?.Nombre || `Cliente ${id}`}</div>
        <button className="btn-x" onClick={onClose}>✕</button>
      </div>
      {data.estado === 'cargando' && <div className="muted">Cargando ficha…</div>}
      {data.estado === 'error' && <div className="error-box">{data.error}</div>}
      {data.estado === 'ok' && !data.cliente && <div className="muted">Cliente no encontrado.</div>}
      {data.estado === 'ok' && data.cliente && (
        <div className="ficha">
          <div className="ficha-row"><span className="ficha-k">ID</span><span className="ficha-v">{data.cliente.ClienteID}</span></div>
          {FICHA.filter(([k]) => (data.cliente[k] ?? '') !== '').map(([k, l]) => (
            <div className="ficha-row" key={k}><span className="ficha-k">{l}</span><span className="ficha-v">{String(data.cliente[k])}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientesView() {
  const [estado, setEstado] = useState('idle');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  const onBuscar = useCallback((filtros) => {
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/clientes?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setClientes(d.clientes || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, []);

  const { filtrosDef, toolbar, chips, drawers } = useBuscador({
    catalogo: CATALOGO_CLIENTES,
    storageKey: 'webplataforma.settings.clientes.v1',
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
            <button key={c.ClienteID} className={`item ${sel === c.ClienteID ? 'activo' : ''}`} onClick={() => setSel(c.ClienteID)}>
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
          {sel ? <Ficha id={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un cliente para ver su ficha.</div>}
        </div>
      </div>
      {drawers}
    </div>
  );
}
