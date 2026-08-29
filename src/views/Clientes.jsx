import { useState, useCallback, useMemo, useEffect } from 'react';
import { norm } from '../lib/format.js';

// Filtros del buscador de clientes (curados; server-side sobre el ERP).
const FILTROS = [
  { key: 'nombre', atributo: 'Nombre', comparador: 'LikeFull', tipo: 'string', label: 'Nombre', ancho: 2 },
  { key: 'id', atributo: 'ClienteID', comparador: 'Equals', tipo: 'int', label: 'ID' },
  { key: 'localidad', atributo: 'Localidad', comparador: 'LikeFull', tipo: 'string', label: 'Localidad' },
  { key: 'provincia', atributo: 'Provincia', comparador: 'LikeFull', tipo: 'string', label: 'Provincia' },
  { key: 'cuit', atributo: 'ClaveTributaria', comparador: 'LikeFull', tipo: 'string', label: 'CUIT' },
];

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
  const [vals, setVals] = useState({});
  const [estado, setEstado] = useState('idle');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [sel, setSel] = useState(null);

  const buscar = useCallback((e) => {
    e?.preventDefault();
    const filtros = FILTROS
      .filter((f) => (vals[f.key] ?? '').toString().trim() !== '')
      .map((f) => ({ atributo: f.atributo, comparador: f.comparador, tipo: f.tipo, valor: vals[f.key].trim() }));
    setEstado('cargando'); setError(''); setSel(null);
    fetch(`/api/clientes?filtros=${encodeURIComponent(JSON.stringify(filtros))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setClientes(d.clientes || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [vals]);

  const vista = useMemo(() => {
    const q = norm(refine).trim();
    if (!q) return clientes;
    return clientes.filter((c) => ['Nombre', 'NombreLegal', 'Localidad', 'Provincia', 'ClienteID', 'Email']
      .some((k) => norm(c[k]).includes(q)));
  }, [clientes, refine]);

  return (
    <div className="vista">
      <form className="buscador-bar" onSubmit={buscar}>
        {FILTROS.map((f) => (
          <label key={f.key} className={`campo ${f.ancho === 2 ? 'campo-2' : ''}`}>
            <span>{f.label}</span>
            <input type={f.tipo === 'int' ? 'number' : 'text'} value={vals[f.key] || ''}
              onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))} placeholder="…" />
          </label>
        ))}
        <button className="btn-primario" type="submit" disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {estado === 'ok' && (
        <div className="sub-toolbar">
          <input className="refine chico" value={refine} onChange={(e) => setRefine(e.target.value)}
            placeholder="Refinar resultados…" />
          <span className="resultados-count">{vista.length}{refine ? ` de ${clientes.length}` : ''} cliente(s)</span>
        </div>
      )}
      {estado === 'error' && <div className="error-box">{error}</div>}

      <div className="layout">
        <div className="lista">
          {vista.map((c) => (
            <button key={c.ClienteID} className={`item ${sel === c.ClienteID ? 'activo' : ''}`} onClick={() => setSel(c.ClienteID)}>
              <div className="item-nombre">{c.Nombre || '(sin nombre)'}</div>
              <div className="item-meta">
                ID {c.ClienteID}
                {c.Localidad ? ` · ${c.Localidad}` : ''}{c.Provincia ? `, ${c.Provincia}` : ''}
              </div>
              {c.CondicionAnteElIVANombre && <div className="item-extra"><span className="chip">{c.CondicionAnteElIVANombre}</span></div>}
            </button>
          ))}
          {estado === 'ok' && vista.length === 0 && <div className="muted">Sin resultados.</div>}
          {estado === 'idle' && <div className="muted">Buscá clientes por nombre, ID, localidad, provincia o CUIT.</div>}
        </div>
        <div className="detalle">
          {sel ? <Ficha id={sel} onClose={() => setSel(null)} />
            : <div className="placeholder">Elegí un cliente para ver su ficha.</div>}
        </div>
      </div>
    </div>
  );
}
