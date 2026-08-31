import { useState, useEffect, useMemo, useCallback } from 'react';
import Agrupador from '../components/Agrupador.jsx';
import { fmtNum, parseNum, norm } from '../lib/format.js';

const DIMS = [
  { key: 'Nombre', label: 'Artículo' },
  { key: 'TipoNombre', label: 'Tipo de artículo' },
  { key: 'LineaNombre', label: 'Línea' },
];
const MEDS = [
  { key: 'pendiente', label: 'Pedido pendiente', tipo: 'suma', get: (r) => r.pendiente },
  { key: 'fisico', label: 'Stock físico', tipo: 'suma', get: (r) => r.fisico },
  { key: 'disponible', label: 'Disponible', tipo: 'suma', get: (r) => r.disponible },
  { key: 'conteo', label: 'Cantidad de artículos', tipo: 'conteo' },
];

export default function DemandaView() {
  const [tipos, setTipos] = useState([]);          // [{valor,label}]
  const [sel, setSel] = useState(new Set(['PIE', 'PLA']));
  const [estado, setEstado] = useState('idle');    // idle|cargando|ok|error
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [refine, setRefine] = useState('');
  const [modo, setModo] = useState('agrupar');
  const [soloConDemanda, setSoloConDemanda] = useState(true);

  useEffect(() => {
    fetch('/api/valores?atributo=TipoDeArticulo').then((r) => r.json())
      .then((d) => setTipos(d.valores || [])).catch(() => setTipos([]));
  }, []);

  const toggleTipo = (v) => setSel((prev) => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });

  const generar = useCallback(() => {
    const tiposSel = [...sel];
    if (!tiposSel.length) return;
    setEstado('cargando'); setError(''); setFilas([]);
    fetch(`/api/demanda?tipos=${encodeURIComponent(tiposSel.join(','))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setFilas(d.filas || []); setEstado('ok'); })
      .catch((e) => { setError(e.message); setEstado('error'); });
  }, [sel]);

  const base = useMemo(() => soloConDemanda ? filas.filter((f) => (f.pendiente || 0) > 0) : filas, [filas, soloConDemanda]);
  const vista = useMemo(() => {
    const q = norm(refine).trim();
    const arr = q ? base.filter((f) => ['Nombre', 'ArticuloEmpresa', 'LineaNombre'].some((k) => norm(f[k]).includes(q))) : base;
    return [...arr].sort((a, b) => (b.pendiente || 0) - (a.pendiente || 0));
  }, [base, refine]);

  return (
    <div className="vista">
      <div className="buscador-bar">
        <div className="tipos-sel">
          <span className="muted-sm">Tipos de artículo:</span>
          <div className="tipos-chips">
            {tipos.map((t) => (
              <button key={t.valor} className={`chip-tipo ${sel.has(t.valor) ? 'on' : ''}`} onClick={() => toggleTipo(t.valor)}>
                {t.valor}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primario" onClick={generar} disabled={estado === 'cargando' || sel.size === 0}>
          {estado === 'cargando' ? 'Generando…' : 'Generar demanda'}
        </button>
      </div>
      <div className="hint-bar">Suma, por artículo y cruzando todos los clientes, lo comprometido en pedidos de venta pendientes (cálculo preconfigurado del ERP, depósitos de la config PF).</div>

      {estado === 'error' && <div className="error-box">{error}</div>}

      {estado === 'ok' && (
        <>
          <div className="sub-toolbar">
            <div className="vista-toggle">
              <button className={modo === 'lista' ? 'activo' : ''} onClick={() => setModo('lista')}>Lista</button>
              <button className={modo === 'agrupar' ? 'activo' : ''} onClick={() => setModo('agrupar')}>Agrupar</button>
            </div>
            <label className="check"><input type="checkbox" checked={soloConDemanda} onChange={(e) => setSoloConDemanda(e.target.checked)} /><span>solo con demanda</span></label>
            {modo === 'lista' && <input className="refine chico" value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Refinar (artículo, línea…)" />}
            <span className="resultados-count">{vista.length} artículo(s)</span>
          </div>
          {modo === 'agrupar' ? (
            <Agrupador data={base} dimensiones={DIMS} medidas={MEDS} />
          ) : (
            <div className="tabla-scroll">
              <table>
                <thead><tr><th>Artículo</th><th>Cód.</th><th>Línea</th><th className="num">Pedido pend.</th><th className="num">Físico</th><th className="num">Disponible</th></tr></thead>
                <tbody>
                  {vista.map((f) => (
                    <tr key={f.ArticuloID}>
                      <td>{f.Nombre}</td><td className="muted-sm">{f.ArticuloEmpresa}</td><td>{f.LineaNombre}</td>
                      <td className="num"><strong>{fmtNum(parseNum(f.pendiente))}</strong></td>
                      <td className="num">{fmtNum(parseNum(f.fisico))}</td>
                      <td className="num">{fmtNum(parseNum(f.disponible))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {estado === 'idle' && <div className="muted">Elegí los tipos y tocá “Generar demanda”.</div>}
    </div>
  );
}
