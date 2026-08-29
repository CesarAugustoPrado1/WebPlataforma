import { useState, useCallback } from 'react';

// Buscador simple de cliente por nombre o ID. Llama onSelect({id, nombre}).
export default function ClientePicker({ onSelect, seleccionado }) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('idle');
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');

  const buscar = useCallback((e) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    const filtro = /^\d+$/.test(term)
      ? [{ atributo: 'ClienteID', comparador: 'Equals', tipo: 'int', valor: term }]
      : [{ atributo: 'Nombre', comparador: 'LikeFull', tipo: 'string', valor: term }];
    setEstado('cargando'); setError('');
    fetch(`/api/clientes?filtros=${encodeURIComponent(JSON.stringify(filtro))}`).then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setClientes(d.clientes || []); setEstado('ok'); })
      .catch((err) => { setError(err.message); setEstado('error'); });
  }, [q]);

  return (
    <div className="cliente-picker">
      <form className="buscador-bar" onSubmit={buscar}>
        <label className="campo campo-2"><span>Cliente (nombre o ID)</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" autoFocus />
        </label>
        <button className="btn-primario" type="submit" disabled={estado === 'cargando'}>
          {estado === 'cargando' ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {error && <div className="error-box">{error}</div>}
      {estado === 'ok' && (
        <div className="picker-lista">
          {clientes.slice(0, 30).map((c) => (
            <button key={c.ClienteID} className={`picker-item ${seleccionado === c.ClienteID ? 'activo' : ''}`}
              onClick={() => onSelect({ id: c.ClienteID, nombre: c.Nombre })}>
              <b>{c.Nombre}</b> <span className="muted-sm">#{c.ClienteID}{c.Localidad ? ` · ${c.Localidad}` : ''}</span>
            </button>
          ))}
          {clientes.length === 0 && <div className="muted">Sin clientes.</div>}
          {clientes.length > 30 && <div className="muted-sm">Mostrando 30 de {clientes.length}. Afiná la búsqueda.</div>}
        </div>
      )}
    </div>
  );
}
