import { useEffect, useState } from 'react';
import ArticulosView from './views/Articulos.jsx';
import ClientesView from './views/Clientes.jsx';
import PedidosView from './views/Pedidos.jsx';

function useHealth() {
  const [health, setHealth] = useState({ estado: 'cargando' });
  useEffect(() => {
    fetch('/api/health').then((r) => r.json())
      .then((d) => setHealth(d.conexionOk ? { estado: 'ok', ...d } : { estado: 'error', ...d }))
      .catch((e) => setHealth({ estado: 'error', error: e.message }));
  }, []);
  return health;
}

function EstadoConexion({ health }) {
  const color = health.estado === 'ok' ? '#16a34a' : health.estado === 'error' ? '#dc2626' : '#a1a1aa';
  const label = health.estado === 'ok' ? `ERP conectado · ${health.conexion || ''}`
    : health.estado === 'error' ? `Sin conexión al ERP${health.error ? ` · ${health.error}` : ''}`
      : 'Verificando conexión…';
  return <div className="estado"><span className="dot" style={{ background: color }} /><span>{label}</span></div>;
}

const TABS = [
  { id: 'articulos', label: 'Artículos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'pedidos', label: 'Pedidos' },
];

export default function App() {
  const health = useHealth();
  const [tab, setTab] = useState('articulos');

  return (
    <div className="app">
      <header>
        <div className="header-izq">
          <h1>WebPlataforma</h1>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'activa' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <EstadoConexion health={health} />
      </header>

      {tab === 'articulos' && <ArticulosView />}
      {tab === 'clientes' && <ClientesView />}
      {tab === 'pedidos' && <PedidosView />}
    </div>
  );
}
