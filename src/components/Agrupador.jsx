import { useState, useMemo } from 'react';
import { fmtNum, parseNum } from '../lib/format.js';

// Tabla dinámica simple: agrupa `data` por una dimensión (Filas) y agrega una
// medida (Valor = conteo o suma de un campo). Ordenable, con total.
//   dimensiones: [{ key, label, get?(row) }]
//   medidas:     [{ key, label, tipo:'conteo'|'suma', get?(row) }]
export default function Agrupador({ data, dimensiones, medidas }) {
  const [dimKey, setDimKey] = useState(dimensiones[0]?.key);
  const [medKey, setMedKey] = useState(medidas[0]?.key);
  const [orden, setOrden] = useState('valor'); // 'valor' | 'nombre'

  const dim = dimensiones.find((d) => d.key === dimKey) || dimensiones[0];
  const med = medidas.find((m) => m.key === medKey) || medidas[0];

  const filas = useMemo(() => {
    const map = new Map();
    for (const row of data) {
      const raw = dim.get ? dim.get(row) : row[dim.key];
      const k = (raw ?? '').toString().trim() || '(vacío)';
      const val = med.tipo === 'conteo' ? 1 : (parseNum(med.get ? med.get(row) : row[med.key]) || 0);
      map.set(k, (map.get(k) || 0) + val);
    }
    const arr = [...map.entries()].map(([k, v]) => ({ k, v }));
    arr.sort((a, b) => orden === 'nombre' ? a.k.localeCompare(b.k, 'es') : b.v - a.v);
    return arr;
  }, [data, dim, med, orden]);

  const total = filas.reduce((s, f) => s + f.v, 0);
  const fmtVal = (v) => med.tipo === 'conteo' ? fmtNum(v) : fmtNum(v);

  return (
    <div className="agrupador">
      <div className="agr-controles">
        <label className="campo"><span>Filas (agrupar por)</span>
          <select value={dimKey} onChange={(e) => setDimKey(e.target.value)}>
            {dimensiones.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </label>
        <label className="campo"><span>Valor</span>
          <select value={medKey} onChange={(e) => setMedKey(e.target.value)}>
            {medidas.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
        <label className="campo"><span>Orden</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="valor">Mayor valor</option>
            <option value="nombre">Nombre</option>
          </select>
        </label>
        <span className="agr-info">{filas.length} grupo(s)</span>
      </div>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>{dim.label}</th><th className="num">{med.label}</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.k}><td>{f.k}</td><td className="num">{fmtVal(f.v)}</td></tr>
            ))}
            <tr className="tfoot"><td><strong>Total</strong></td><td className="num"><strong>{fmtVal(total)}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
