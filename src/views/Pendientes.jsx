import { useState, useEffect, useMemo } from 'react';
import ClientePicker from '../components/ClientePicker.jsx';
import { fmtNum, fmtMoneda, fmtFecha, parseNum, norm } from '../lib/format.js';

function Detalle({ cliente }) {
  const [data, setData] = useState({ estado: 'cargando' });
  const [refine, setRefine] = useState('');
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/pendientes?cliente=${encodeURIComponent(cliente.id)}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData({ estado: 'ok', ...d }); })
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [cliente]);

  const vista = useMemo(() => {
    const rs = data.renglones || [];
    const q = norm(refine).trim();
    if (!q) return rs;
    return rs.filter((r) => ['ArticuloNombre', 'ArticuloEmpresa', 'Numero', 'Tipo'].some((k) => norm(r[k]).includes(q)));
  }, [data, refine]);

  if (data.estado === 'cargando') return <div className="muted">Cargando renglones pendientes…</div>;
  if (data.estado === 'error') return <div className="error-box">{data.error}</div>;

  return (
    <div className="cc">
      <div className="cc-header">
        <div>
          <div className="panel-title">{cliente.nombre}</div>
          <div className="panel-sub">Cliente #{cliente.id} · {data.cantidad} renglón(es) pendiente(s) a remitir</div>
        </div>
        <div className="cc-total">
          <span className="muted-sm">Importe pendiente</span>
          <strong>$ {fmtMoneda(data.totalImporte)}</strong>
        </div>
      </div>
      {(data.renglones || []).length === 0 ? <div className="muted">Este cliente no tiene renglones pendientes.</div> : (
        <>
          <div className="sub-toolbar">
            <input className="refine chico" value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Refinar (artículo, pedido…)" />
            <span className="resultados-count">{vista.length}{refine ? ` de ${data.renglones.length}` : ''} renglón(es)</span>
          </div>
          <div className="tabla-scroll">
            <table>
              <thead><tr>
                <th>Entrega</th><th>Pedido</th><th>Artículo</th><th>UM</th>
                <th className="num">Pedida</th><th className="num">Entregada</th><th className="num">Pendiente</th><th className="num">Importe pend.</th>
              </tr></thead>
              <tbody>
                {vista.map((r, i) => (
                  <tr key={i}>
                    <td>{fmtFecha(r.FechaEntrega)}</td>
                    <td>{r.Division}-{r.Tipo}-{r.Numero}<span className="muted-sm"> /{r.Renglon}</span></td>
                    <td title={r.ArticuloEmpresa}>{r.ArticuloNombre}</td>
                    <td>{r.UnidadDeMedida}</td>
                    <td className="num">{fmtNum(parseNum(r.CantidadPedida))}</td>
                    <td className="num">{fmtNum(parseNum(r.CantidadEntregada))}</td>
                    <td className="num"><strong>{fmtNum(parseNum(r.CantidadPendienteRemitir))}</strong></td>
                    <td className="num">{fmtMoneda(r.ImportePendienteRemitir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function PendientesView() {
  const [cliente, setCliente] = useState(null);
  return (
    <div className="vista">
      <ClientePicker onSelect={setCliente} seleccionado={cliente?.id} />
      {cliente ? <Detalle cliente={cliente} /> : <div className="placeholder">Buscá y elegí un cliente para ver sus renglones pendientes de entrega.</div>}
    </div>
  );
}
