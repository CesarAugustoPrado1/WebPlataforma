import { useState, useEffect, useCallback } from 'react';
import { fmtNum, parseNum } from '../lib/format.js';

const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const nombreMes = (m) => {
  if (!m) return '';
  const [y, mm] = m.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[Number(mm) - 1]} ${y}`;
};

export default function PedidosMesView() {
  const [mes, setMes] = useState(mesActual());
  const [data, setData] = useState(null);
  const [estadoCarga, setEstadoCarga] = useState('cargando'); // cargando|ok|error
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);       // tipo desplegado
  const [sync, setSync] = useState(null);             // texto de progreso de sincronización

  const cargar = useCallback((m) => {
    setEstadoCarga('cargando'); setError('');
    fetch(`/api/pedidos-mes?mes=${encodeURIComponent(m)}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); setEstadoCarga('ok'); })
      .catch((e) => { setError(e.message); setEstadoCarga('error'); });
  }, []);

  useEffect(() => { cargar(mes); }, [mes, cargar]);

  // Sincroniza (junta pedidos nuevos) llamando al colector hasta ponerse al día.
  const sincronizar = useCallback(async (desde) => {
    setSync('Sincronizando…');
    try {
      for (let i = 0; i < 40; i++) {
        const url = `/api/colectar${desde ? `?desde=${desde}` : ''}`;
        const d = await fetch(url).then((r) => r.json());
        if (d.error) throw new Error(d.error);
        setSync(`Sincronizando… hasta ${d.cursor} (${d.procesadas} pedidos nuevos)`);
        desde = undefined; // sólo la 1ra vez arranca de "desde"
        if (!d.hayMas) break;
      }
      setSync(null);
      cargar(mes);
    } catch (e) { setSync(null); setError(e.message); }
  }, [mes, cargar]);

  const est = data?.estado;
  const tipos = data?.tipos || [];
  const totalMes = tipos.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="vista">
      <div className="pm-top">
        <label className="campo"><span>Mes</span>
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} max={mesActual()} />
        </label>
        <div className="pm-acc">
          <button className="btn-primario" onClick={() => sincronizar()} disabled={!!sync}>
            {sync ? 'Sincronizando…' : 'Actualizar'}
          </button>
          <button className="btn-sec" onClick={() => sincronizar(`${mes}-01`)} disabled={!!sync} title="Vuelve a juntar todo el mes desde el día 1">
            Recolectar este mes
          </button>
          {est?.updated && <span className="muted-sm">Últ. actualización: {new Date(est.updated).toLocaleString('es-AR')}</span>}
        </div>
      </div>
      {sync && <div className="progreso"><div className="progreso-barra" style={{ width: '100%' }} /></div>}
      {sync && <div className="hint-bar">{sync}</div>}

      {estadoCarga === 'error' && <div className="error-box">{error}</div>}
      {estadoCarga === 'cargando' && <div className="muted">Cargando…</div>}

      {estadoCarga === 'ok' && (
        <>
          <div className="pm-resumen">
            <div className="pm-titulo">Pedidos de {nombreMes(mes)}</div>
            <div className="pm-total">Total pedido: <strong>{fmtNum(totalMes)}</strong></div>
          </div>

          {tipos.length === 0 ? (
            <div className="pm-vacio">
              <div className="muted">No hay datos colectados de {nombreMes(mes)} todavía.</div>
              <button className="btn-sec" onClick={() => sincronizar(`${mes}-01`)} disabled={!!sync}>Traer este mes</button>
            </div>
          ) : (
            <div className="pm-tipos">
              {tipos.map((t) => (
                <div className="pm-tipo" key={t.tipo}>
                  <button className="pm-tipo-head" onClick={() => setAbierto(abierto === t.tipo ? null : t.tipo)}>
                    <span className="pm-flecha">{abierto === t.tipo ? '▾' : '▸'}</span>
                    <span className="pm-tipo-nombre">{t.nombre}</span>
                    <span className="pm-tipo-total">{fmtNum(t.total)}</span>
                  </button>
                  {abierto === t.tipo && (
                    <div className="tabla-scroll">
                      <table>
                        <thead><tr><th>Artículo</th><th>UM</th><th className="num">Pedido</th></tr></thead>
                        <tbody>
                          {t.articulos.map((a) => (
                            <tr key={a.articuloId}>
                              <td>{a.nombre}</td><td className="muted-sm">{a.um}</td>
                              <td className="num"><strong>{fmtNum(parseNum(a.cantidad))}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
