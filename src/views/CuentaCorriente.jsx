import { useState, useEffect } from 'react';
import ClientePicker from '../components/ClientePicker.jsx';
import { fmtMoneda, fmtFecha, parseNum } from '../lib/format.js';

function Detalle({ cliente }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/saldo?cliente=${encodeURIComponent(cliente.id)}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData({ estado: 'ok', ...d }); })
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [cliente]);

  if (data.estado === 'cargando') return <div className="muted">Cargando cuenta corriente…</div>;
  if (data.estado === 'error') return <div className="error-box">{data.error}</div>;
  const renglones = data.renglones || [];
  return (
    <div className="cc">
      <div className="cc-header">
        <div>
          <div className="panel-title">{cliente.nombre}</div>
          <div className="panel-sub">Cliente #{cliente.id} · {data.cantidad} comprobante(s)</div>
        </div>
        <div className="cc-total">
          <span className="muted-sm">Saldo total</span>
          <strong className={parseNum(data.total) < 0 ? 'neg' : ''}>$ {fmtMoneda(data.total)}</strong>
        </div>
      </div>
      {renglones.length === 0 ? <div className="muted">Sin movimientos con saldo.</div> : (
        <div className="tabla-scroll">
          <table>
            <thead><tr>
              <th>Fecha</th><th>Comprobante</th><th>Vencimiento</th><th className="num">Debe</th><th className="num">Haber</th><th className="num">Saldo</th>
            </tr></thead>
            <tbody>
              {renglones.map((r, i) => (
                <tr key={r.Comprobante || i}>
                  <td>{fmtFecha(r.FechaContable)}</td>
                  <td>{r.Tipo} {r.Numero}</td>
                  <td>{fmtFecha(r.FechaDeVencimiento)}</td>
                  <td className="num">{r.DebeMonedaExpresion ? fmtMoneda(r.DebeMonedaExpresion) : ''}</td>
                  <td className="num">{r.HaberMonedaExpresion ? fmtMoneda(r.HaberMonedaExpresion) : ''}</td>
                  <td className="num">{fmtMoneda(r.SaldoMonedaExpresion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CuentaCorrienteView() {
  const [cliente, setCliente] = useState(null);
  return (
    <div className="vista">
      <ClientePicker onSelect={setCliente} seleccionado={cliente?.id} />
      {cliente ? <Detalle cliente={cliente} /> : <div className="placeholder">Buscá y elegí un cliente para ver su cuenta corriente.</div>}
    </div>
  );
}
