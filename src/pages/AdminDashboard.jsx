import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Utilidad: total real de una orden ──────────────────────────────────────
function getTotalOrden(o) {
  if (o.resumen && typeof o.resumen.total === 'number' && o.resumen.total > 0) return o.resumen.total;
  if (o.total && Number(o.total) > 0) return Number(o.total);
  if (o.presupuestoAdmin && Number(o.presupuestoAdmin) > 0) return Number(o.presupuestoAdmin);
  if (o.presupuestoCliente && Number(o.presupuestoCliente) > 0) return Number(o.presupuestoCliente);
  return 0;
}

// ─── Config de estados con paleta mecánica ───────────────────────────────────
const ESTADOS = ['pendiente', 'revision', 'reparacion', 'lista', 'entregada', 'cancelada'];

const ESTADO_CFG = {
  pendiente:  { label: 'Pendientes',    accent: '#F4A63A', soft: '#FFF3CD', txt: '#7A4E00', chartColor: '#F4A63A' },
  revision:   { label: 'En revisión',   accent: '#378ADD', soft: '#E6F1FB', txt: '#0C447C', chartColor: '#378ADD' },
  reparacion: { label: 'En reparación', accent: '#E8500A', soft: '#FAECE7', txt: '#712B13', chartColor: '#E8500A' },
  lista:      { label: 'Listas',        accent: '#27C93F', soft: '#D4EDDA', txt: '#155724', chartColor: '#27C93F' },
  entregada:  { label: 'Entregadas',    accent: '#2E4460', soft: '#E2E8EF', txt: '#1B2A3B', chartColor: '#2E4460' },
  cancelada:  { label: 'Canceladas',    accent: '#A32D2D', soft: '#F8D7DA', txt: '#721C24', chartColor: '#A32D2D' },
};

// ─── Íconos SVG inline ───────────────────────────────────────────────────────
const IconClock  = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IconSearch = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconWrench = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IconCheck  = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>;
const IconBox    = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
const IconX      = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>;
const IconMoney  = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>;
const IconTrend  = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const IconGear   = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;

const ICONS = { pendiente: IconClock, revision: IconSearch, reparacion: IconWrench, lista: IconCheck, entregada: IconBox, cancelada: IconX };

// ─── Pill de estado ──────────────────────────────────────────────────────────
const PillEstado = ({ status }) => {
  const key = (status || '').toLowerCase();
  const cfg = ESTADO_CFG[key] || { soft: '#E2E8EF', txt: '#2E4460', accent: '#2E4460', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
      background: cfg.soft, color: cfg.txt,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.accent, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label || status}
    </span>
  );
};

// ─── Tarjeta de métrica ──────────────────────────────────────────────────────
const StatCard = ({ estado, count }) => {
  const cfg = ESTADO_CFG[estado];
  const Icon = ICONS[estado];
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '18px 16px',
        border: '1px solid #E2E8EF',
        borderTop: `3px solid ${cfg.accent}`,
        display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(27,42,59,0.12)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7F93', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          {cfg.label}
        </span>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: cfg.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={cfg.accent} size={15} />
        </div>
      </div>
      <div style={{ fontSize: '30px', fontWeight: 800, color: '#1B2A3B', lineHeight: 1 }}>
        {count}
      </div>
    </div>
  );
};

// ─── Tarjeta hero (ingresos) ─────────────────────────────────────────────────
const HeroCard = ({ label, value, icon: Icon, sub, variant = 'primary' }) => {
  const isPrimary = variant === 'primary';
  return (
    <div
      style={{
        background: isPrimary ? '#E8500A' : '#1B2A3B',
        borderRadius: '12px',
        padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isPrimary ? '0 10px 28px rgba(232,80,10,0.35)' : '0 10px 28px rgba(27,42,59,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Círculos decorativos */}
      <div style={{ position: 'absolute', right: -16, top: -16, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 18, bottom: -24, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color="#fff" size={15} />
        </div>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: 1, position: 'relative' }}>
        ${Number(value).toFixed(2)}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', position: 'relative' }}>{sub}</div>}
    </div>
  );
};

// ─── Dashboard principal ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
        else { console.error('Data is not an array:', data); setOrders([]); }
      })
      .catch(err => { console.error('Error fetching orders:', err); setOrders([]); });
  }, []);

  // ── Estadísticas ─────────────────────────────────────────────────────────
  const stats = ESTADOS.reduce((acc, estado) => {
    acc[estado] = orders.filter(o => (o.status || '').toLowerCase() === estado).length;
    return acc;
  }, {});

  const entregadasDebug = orders.filter(o => (o.status || '').toLowerCase() === 'entregada');
  console.log('Órdenes entregadas para ingresos:', entregadasDebug.map(o => ({ folio: o.folio, status: o.status, total: getTotalOrden(o) })));
  const ingresos = entregadasDebug.reduce((sum, o) => sum + getTotalOrden(o), 0);
  const totalGeneral = orders.reduce((sum, o) => sum + getTotalOrden(o), 0);
  const ultimas = orders.slice(-5).reverse();

  // ── Gráfica ───────────────────────────────────────────────────────────────
  const chartData = {
    labels: ESTADOS.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
    datasets: [{
      label: 'Órdenes',
      data: ESTADOS.map(e => stats[e]),
      backgroundColor: ESTADOS.map(e => ESTADO_CFG[e].chartColor),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1B2A3B',
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6B7F93', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#6B7F93', font: { size: 11 } },
        grid: { color: '#F4F6F8' },
      },
    },
  };

  // ── Estilos compartidos ───────────────────────────────────────────────────
  const panelStyle = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #E2E8EF',
    padding: '20px 18px',
  };

  return (
    <DashboardLayout>
      <style>{`
        .dash-root {
          background: #F4F6F8;
          min-height: 100vh;
          padding: 28px 32px 40px;
          font-family: sans-serif;
          box-sizing: border-box;
        }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          color: #6B7F93;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E2E8EF;
        }
      `}</style>

      <div className="dash-root">

        {/* Header removed: title, subtitle, gear icon and 'Nueva orden' button omitted */}

        {/* Ingresos */}
        <p className="section-label">Ingresos</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '32px' }}>
          <HeroCard label="Ingresos totales (entregadas)" value={ingresos}     icon={IconTrend} sub="Suma de órdenes entregadas" variant="primary" />
          <HeroCard label="Total general (todas)"         value={totalGeneral} icon={IconMoney} sub="Incluye todas las órdenes con valor" variant="secondary" />
        </div>

        {/* Métricas por estado */}
        <p className="section-label">Estado de órdenes</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '32px' }}>
          {ESTADOS.map(estado => (
            <StatCard key={estado} estado={estado} count={stats[estado]} />
          ))}
        </div>

        {/* Gráfica + Tabla */}
        <p className="section-label" style={{ marginTop: '4px' }}>Actividad</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>

          {/* Gráfica */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1B2A3B', margin: 0 }}>Órdenes por estado</h2>
                <p style={{ fontSize: '12px', color: '#6B7F93', margin: '3px 0 0' }}>Distribución actual</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #E2E8EF', fontSize: '12px', color: '#2E4460', background: '#F4F6F8', outline: 'none', cursor: 'pointer' }}>
                  <option>Este mes</option>
                  <option>Este año</option>
                </select>
                <select style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #E2E8EF', fontSize: '12px', color: '#2E4460', background: '#F4F6F8', outline: 'none', cursor: 'pointer' }}>
                  <option>Todos los técnicos</option>
                </select>
              </div>
            </div>
            <div style={{ height: '240px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Últimas órdenes */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1B2A3B', margin: 0 }}>Últimas órdenes</h2>
                <p style={{ fontSize: '12px', color: '#6B7F93', margin: '3px 0 0' }}>Las 5 más recientes</p>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                style={{
                  fontSize: '12px', color: '#E8500A', background: 'transparent',
                  border: '1px solid rgba(232,80,10,0.35)', borderRadius: '7px',
                  padding: '5px 12px', cursor: 'pointer', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,80,10,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Ver todas
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ultimas.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6B7F93', padding: '32px 0', fontSize: '13px' }}>
                  Sin órdenes recientes
                </div>
              )}
              {ultimas.map((o, idx) => {
                const total = getTotalOrden(o);
                return (
                  <div
                    key={o.id || idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 10px', borderRadius: '8px',
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F4F6F8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/ordenes/${o.folio || o.id}`)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B2A3B', fontFamily: 'monospace' }}>
                          #{o.folio || o.id}
                        </span>
                        <PillEstado status={o.status} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#6B7F93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.clientName || o.cliente || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B2A3B' }}>
                        ${total.toFixed(2)}
                      </span>
                      <div style={{
                        width: 26, height: 26, borderRadius: '7px',
                        background: 'rgba(232,80,10,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="13" height="13" fill="none" stroke="#E8500A" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;