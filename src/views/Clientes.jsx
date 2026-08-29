import { useState, useEffect } from 'react';
import ListaClientes from '../components/ListaClientes.jsx';

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

function Ficha({ cliente }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/clientes?id=${encodeURIComponent(cliente.id)}`).then((r) => r.json())
      .then((d) => setData({ estado: 'ok', cliente: d.cliente }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [cliente]);
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{data.cliente?.Nombre || cliente.nombre}</div>
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
  return (
    <ListaClientes
      storageKey="webplataforma.settings.clientes.v1"
      renderDetalle={(c) => <Ficha cliente={c} />}
      placeholder="Elegí un cliente para ver su ficha."
    />
  );
}
