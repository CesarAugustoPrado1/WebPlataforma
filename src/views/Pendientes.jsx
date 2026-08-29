import { useState, useEffect, useMemo } from 'react';
import ListaClientes from '../components/ListaClientes.jsx';
import { fmtNum, fmtMoneda, fmtFecha, parseNum, norm } from '../lib/format.js';

const ESTADOS = ['Pendiente', 'Parcial', 'Total', 'Todos'];

function PendientesDetalle({ cliente }) {
  const [estadoRem, setEstadoRem] = useState('Pendiente');
  const [data, setData] = useState({ estado: 'cargando' });
  const [refine, setRefine] = useState('');

  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/pendientes?cliente=${encodeURIComponent(cliente.id)}&estado=${encodeURIComponent(estadoRem)}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData({ estado: 'ok', ...d }); })
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [cliente, estadoRem]);

  const vista = useMemo(() => {
    const rs = data.renglones || [];
    const q = norm(refine).trim();
    if (!q) return rs;
    return rs.filter((r) => ['ArticuloNombre', 'ArticuloEmpresa', 'Numero', 'Tipo'].some((k) => norm(r[k]).includes(q)));
  }, [data, refine]);

  return (
    <div className="cc">
      <div className="cc-header">
        <div>
          <div className="panel-title">{cliente.nombre}</div>
          <div className="panel-sub">
            Cliente #{cliente.id} ·&nbsp;
            <select className="filtro-comp" value={estadoRem} onChange={(e) => setEstadoRem(e.target.value)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="cc-total">
          <span className="muted-sm">Importe pendiente</span>
          <strong>$ {fmtMoneda(data.totalImporte || 0)}</strong>
        </div>
      </div>
      {data.estado === 'cargando' && <div className="muted">Cargando renglones…</div>}
      {data.estado === 'error' && <div className="error-box">{data.error}</div>}
      {data.estado === 'ok' && (data.renglones || []).length === 0 && <div className="muted">Sin renglones en estado “{estadoRem}”.</div>}
      {data.estado === 'ok' && (data.renglones || []).length > 0 && (
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
  return (
    <ListaClientes
      storageKey="webplataforma.settings.pendientes.v1"
      renderDetalle={(c) => <PendientesDetalle cliente={c} />}
      placeholder="Filtrá y elegí un cliente para ver sus renglones pendientes de entrega."
    />
  );
}
