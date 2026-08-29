import { useEffect, useState } from 'react';
import { fmtNum as fmt } from '../lib/format.js';

const COLS = [
  ['StockFisicoActual', 'Físico'], ['StockReservadoEnPedidos', 'Reservado'],
  ['StockEgresarPedidosVentas', 'A egresar (pedidos)'], ['StockIngresarCompras', 'A ingresar (compras)'],
  ['StockIngresarFabricacion', 'A ingresar (fabric.)'], ['StockEgresarFabricacion', 'A egresar (fabric.)'],
];

export default function StockPanel({ articulo, onClose }) {
  const [data, setData] = useState({ estado: 'cargando' });
  useEffect(() => {
    setData({ estado: 'cargando' });
    fetch(`/api/stock?ids=${encodeURIComponent(articulo.ArticuloID)}`).then((r) => r.json())
      .then((d) => setData({ estado: 'ok', stock: d.stock?.[0] || null }))
      .catch((e) => setData({ estado: 'error', error: e.message }));
  }, [articulo]);
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">{articulo.Nombre}</div>
          <div className="panel-sub">ID {articulo.ArticuloID} · {articulo.ArticuloEmpresa || 's/código'} · UM {articulo.UnidadDeMedidaDeStock || '—'}</div>
        </div>
        <button className="btn-x" onClick={onClose}>✕</button>
      </div>
      {data.estado === 'cargando' && <div className="muted">Consultando stock…</div>}
      {data.estado === 'error' && <div className="error-box">{data.error}</div>}
      {data.estado === 'ok' && !data.stock && <div className="muted">Sin datos de stock.</div>}
      {data.estado === 'ok' && data.stock && (
        <>
          <div className="total-row"><span>Stock físico total</span><strong>{fmt(data.stock.total.StockFisicoActual)}</strong></div>
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Depósito</th>{COLS.map(([, l]) => <th key={l} className="num">{l}</th>)}</tr></thead>
              <tbody>
                {data.stock.depositos.map((d) => (
                  <tr key={d.depositoId}><td>#{d.depositoId}</td>{COLS.map(([k]) => <td key={k} className="num">{fmt(d[k])}</td>)}</tr>
                ))}
                <tr className="tfoot"><td>Total</td>{COLS.map(([k]) => <td key={k} className="num"><strong>{fmt(data.stock.total[k])}</strong></td>)}</tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
