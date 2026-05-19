import DashboardLayout from '../layouts/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

const ESTADOS = ['Pendiente', 'En proceso', 'Completada'];

const STATUS_STYLES = {
  'Pendiente':   'bg-[#FFF3CD] text-[#7c5a00]',
  'En proceso':  'bg-[#E2E8EF] text-[#2E4460]',
  'Completada':  'bg-[#D4EDDA] text-[#1a5c2e]',
};

const getDataFromObservaciones = (observaciones) => {
  if (!observaciones) return { tipoEquipo: '-', direccion: '-' };
  if (typeof observaciones === 'object') return {
    tipoEquipo: observaciones.tipoEquipo || '-',
    direccion: observaciones.direccion || '-',
  };
  try {
    const parsed = JSON.parse(observaciones);
    return { tipoEquipo: parsed?.tipoEquipo || '-', direccion: parsed?.direccion || '-' };
  } catch {
    return { tipoEquipo: '-', direccion: '-' };
  }
};

const parseImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === 'string') {
    try { const p = JSON.parse(imagenes); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const formatMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : '—';
};

const CLIENT_ORDERS_NAV_CONTEXT_KEY = 'client_orders_nav_context';
const SCROLL_DEBUG = false;
const debugScroll = (...args) => { if (SCROLL_DEBUG) console.log('[SCROLL_DEBUG][OrdenesClientes]', ...args); };
const getDashboardScrollContainer = () => document.getElementById('dashboard-scroll-container');
const getScrollSnapshot = () => {
  const sc = getDashboardScrollContainer();
  const docY = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  const snapshot = { windowY: window.scrollY || window.pageYOffset || 0, docY, containerScrollTop: sc ? sc.scrollTop : 0 };
  debugScroll('snapshot', snapshot);
  return snapshot;
};

function OrdenesClientes() {
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const isTechnician = normalizedRole === 'tecnico';
  const isMostrador = normalizedRole === 'mostrador';
  const currentUserName = user?.nombre || user?.name || '';

  const [ordenes, setOrdenes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [fechaExacta, setFechaExacta] = useState('');
  const [highlightedFolio, setHighlightedFolio] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const focusFolioFromQuery = React.useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('focus') || '';
  }, [location.search]);

  const queryScrollSnapshot = React.useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    const ct = Number(params.get('ct')), wy = Number(params.get('wy')), dy = Number(params.get('dy'));
    return {
      containerScrollTop: Number.isFinite(ct) ? ct : null,
      windowY: Number.isFinite(wy) ? wy : null,
      docY: Number.isFinite(dy) ? dy : null,
    };
  }, [location.search]);

  const hasRestoredScrollRef = React.useRef(false);
  const restoredFromSnapshotRef = React.useRef(false);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        let clienteOrders = (Array.isArray(data) ? data : [])
          .filter(order => String(order.tipo || '').toLowerCase() === 'cliente')
          .map(order => {
            const obsData = getDataFromObservaciones(order.observaciones);
            return {
              ...order,
              presupuestoCliente: order.presupuestoCliente != null && order.presupuestoCliente !== '' ? Number(order.presupuestoCliente) : null,
              presupuestoAdmin:   order.presupuestoAdmin   != null && order.presupuestoAdmin   !== '' ? Number(order.presupuestoAdmin)   : null,
              cliente:    order.clientName || order.nombre || '-',
              direccion:  obsData.direccion,
              tipoEquipo: obsData.tipoEquipo,
              tecnico:    order.tecnico || '',
              estado:     order.status || 'Pendiente',
              descripcion: order.description || order.descripcion || '',
              imagenes:   parseImagenes(order.imagenes),
            };
          });
        if (normalizedRole === 'tecnico' && currentUserName) {
          clienteOrders = clienteOrders.filter(o => o.tecnico === currentUserName);
        }
        setOrdenes(clienteOrders);
      })
      .catch(() => { Swal.fire('Error', 'No se pudieron cargar las órdenes', 'error'); setOrdenes([]); });

    fetch('/api/users')
      .then(res => res.json())
      .then(data => setTechnicians(data.filter(u => (u.rol || '').toLowerCase() === 'técnico')))
      .catch(() => setTechnicians([]));
  }, [normalizedRole, currentUserName]);

  const handleTecnicoChange = async (idx, technicianName) => {
    const selected = technicians.find(t => (t.nombre || t.name) === technicianName);
    if (!selected) return;
    const orden = ordenes[idx];
    setOrdenes(prev => prev.map((o, i) => (i === idx ? { ...o, tecnico: technicianName } : o)));
    try {
      await fetch(`/api/orders/${orden.folio}/tecnico`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ technicianId: selected.id }) });
    } catch { Swal.fire('Error', 'No se pudo actualizar el técnico', 'error'); }
  };

  const handleEstadoChange = async (idx, newEstado) => {
    const orden = ordenes[idx];
    setOrdenes(prev => prev.map((o, i) => (i === idx ? { ...o, estado: newEstado } : o)));
    try {
      await fetch(`/api/orders/${orden.folio}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: newEstado }) });
    } catch { Swal.fire('Error', 'No se pudo actualizar el estado', 'error'); }
  };

  const handleVer = (orden) => {
    const snapshot = getScrollSnapshot();
    try {
      sessionStorage.setItem(CLIENT_ORDERS_NAV_CONTEXT_KEY, JSON.stringify({ ...snapshot, folio: orden.folio, timestamp: Date.now() }));
    } catch {}
    navigate(`/ordenes-clientes/${orden.folio}`, { state: { orden, fromList: true, returnFolio: orden.folio, returnScrollSnapshot: snapshot } });
  };

  const handleDelete = async (orden) => {
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `Se eliminará la orden ${orden.folio} de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E8500A',
      cancelButtonColor: '#2E4460',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/orders/${orden.folio}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setOrdenes(prev => prev.filter(o => o.folio !== orden.folio));
      Swal.fire('Eliminada', 'La orden fue eliminada correctamente.', 'success');
    } catch { Swal.fire('Error', 'No se pudo eliminar la orden en el servidor', 'error'); }
  };

  const ordenesFiltradas = ordenes.filter(o => {
    const clienteMatch = searchCliente.trim() === '' || (o.cliente || '').toLowerCase().includes(searchCliente.trim().toLowerCase());
    const fechaMatch = !fechaExacta || (o.fecha && o.fecha === fechaExacta);
    return clienteMatch && fechaMatch;
  });

  // ── Scroll restoration logic (intacta) ────────────────────────────────────
  useEffect(() => {
    if (focusFolioFromQuery) { setHighlightedFolio(focusFolioFromQuery); return; }
    if (location.state?.restoreFolio) { setHighlightedFolio(location.state.restoreFolio); return; }
    let navContext = null;
    try { navContext = JSON.parse(sessionStorage.getItem(CLIENT_ORDERS_NAV_CONTEXT_KEY) || 'null'); } catch {}
    if (navContext?.folio) setHighlightedFolio(navContext.folio);
  }, [location.state, focusFolioFromQuery]);

  useEffect(() => {
    if (hasRestoredScrollRef.current || ordenes.length === 0) return;
    const stateSnapshot = location.state?.restoreSnapshot || null;
    let navContext = null;
    if (stateSnapshot) {
      navContext = stateSnapshot;
    } else if (queryScrollSnapshot.containerScrollTop !== null || queryScrollSnapshot.windowY !== null || queryScrollSnapshot.docY !== null) {
      navContext = queryScrollSnapshot;
    } else {
      try { navContext = JSON.parse(sessionStorage.getItem(CLIENT_ORDERS_NAV_CONTEXT_KEY) || 'null'); } catch {}
    }
    if (!navContext) return;
    restoredFromSnapshotRef.current = Number.isFinite(Number(navContext.containerScrollTop)) || Number.isFinite(Number(navContext.windowY)) || Number.isFinite(Number(navContext.docY));
    hasRestoredScrollRef.current = true;
    const restoreScroll = () => {
      const sc = getDashboardScrollContainer();
      if (sc && Number.isFinite(Number(navContext.containerScrollTop))) sc.scrollTop = navContext.containerScrollTop;
      if (Number.isFinite(Number(navContext.windowY))) window.scrollTo({ top: navContext.windowY, behavior: 'auto' });
      if (Number.isFinite(Number(navContext.docY))) { document.documentElement.scrollTop = navContext.docY; document.body.scrollTop = navContext.docY; }
    };
    requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
    const r1 = setTimeout(restoreScroll, 80), r2 = setTimeout(restoreScroll, 220), r3 = setTimeout(restoreScroll, 450);
    const clear = setTimeout(() => { try { sessionStorage.removeItem(CLIENT_ORDERS_NAV_CONTEXT_KEY); } catch {} }, 2200);
    return () => { clearTimeout(r1); clearTimeout(r2); clearTimeout(r3); clearTimeout(clear); };
  }, [ordenes, location.state, queryScrollSnapshot]);

  useEffect(() => {
    if (!highlightedFolio) return;
    const t = setTimeout(() => setHighlightedFolio(null), 4000);
    return () => clearTimeout(t);
  }, [highlightedFolio]);

  useEffect(() => {
    if (!highlightedFolio || ordenesFiltradas.length === 0 || restoredFromSnapshotRef.current) return;
    const scrollToRow = () => {
      const row = document.querySelector(`[data-folio="${highlightedFolio}"]`);
      if (row) row.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    };
    requestAnimationFrame(() => requestAnimationFrame(scrollToRow));
    const r1 = setTimeout(scrollToRow, 180);
    return () => clearTimeout(r1);
  }, [highlightedFolio, ordenesFiltradas]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1B2A3B] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B2A3B] leading-tight">Órdenes de Clientes</h2>
            <p className="text-xs text-gray-500 leading-none mt-0.5">
              {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''} encontrada{ordenesFiltradas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide">Buscar por cliente</label>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1B2A3B] w-52 focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors bg-white"
              placeholder="Nombre del cliente..."
              value={searchCliente}
              onChange={e => setSearchCliente(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide">Fecha</label>
          <input
            type="date"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#1B2A3B] w-44 focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors bg-white"
            value={fechaExacta}
            onChange={e => setFechaExacta(e.target.value)}
          />
        </div>
        {(searchCliente || fechaExacta) && (
          <button
            onClick={() => { setSearchCliente(''); setFechaExacta(''); }}
            className="self-end inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#E8500A]" />
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {ordenesFiltradas.length} registro{ordenesFiltradas.length !== 1 ? 's' : ''} encontrado{ordenesFiltradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#1B2A3B] text-white">
                {['Folio', 'Cliente', 'Dirección', 'Fecha', 'Presupuesto', 'Técnico', 'Estado', 'Acciones'].map((col, i, arr) => (
                  <th
                    key={col}
                    className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap
                      ${i === 0 ? 'rounded-tl-xl' : ''}
                      ${i === arr.length - 1 ? 'rounded-tr-xl' : ''}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-12 text-sm">
                    No hay órdenes de clientes registradas.
                  </td>
                </tr>
              )}

              {ordenesFiltradas.map((orden, idx) => {
                const isHighlighted = highlightedFolio === orden.folio;
                return (
                  <tr
                    data-folio={orden.folio || ''}
                    key={orden.folio || orden.id}
                    className={`border-b border-gray-100 last:border-0 transition-colors duration-200
                      ${isHighlighted
                        ? 'bg-[#FFF3CD] ring-2 ring-inset ring-[#F4A63A]'
                        : 'hover:bg-[#F4F6F8]'}`}
                  >
                    {/* Folio */}
                    <td className="py-3.5 px-4 align-middle font-mono text-xs text-[#2E4460] font-semibold">
                      {orden.folio || '-'}
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#2E4460] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {(orden.cliente || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#1B2A3B] text-sm">{orden.cliente}</span>
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="py-3.5 px-4 align-middle text-gray-500 text-xs max-w-[140px] truncate">
                      {orden.direccion}
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 align-middle text-gray-600 whitespace-nowrap text-xs">
                      {orden.fecha || '-'}
                    </td>

                    {/* Presupuesto */}
                    <td className="py-3.5 px-4 align-middle min-w-[160px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-500">
                          Cliente: <span className="font-semibold text-[#1B2A3B]">{formatMoney(orden.presupuestoCliente)}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Admin: <span className="font-semibold text-[#E8500A]">{formatMoney(orden.presupuestoAdmin)}</span>
                        </span>
                      </div>
                    </td>

                    {/* Técnico */}
                    <td className="py-3.5 px-4 align-middle">
                      {isTechnician || isMostrador ? (
                        <span className="text-sm font-medium text-[#2E4460]">{orden.tecnico || 'Sin asignar'}</span>
                      ) : (
                        <select
                          value={orden.tecnico}
                          onChange={e => handleTecnicoChange(idx, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-[#1B2A3B] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors w-36"
                        >
                          <option value="">Sin asignar</option>
                          {technicians.map(t => {
                            const name = t.nombre || t.name;
                            return <option key={t.id} value={name}>{name}</option>;
                          })}
                        </select>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 align-middle">
                      {isMostrador ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[orden.estado] || STATUS_STYLES['Pendiente']}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {orden.estado}
                        </span>
                      ) : (
                        <select
                          value={orden.estado}
                          onChange={e => handleEstadoChange(idx, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-lg border-0 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 cursor-pointer ${STATUS_STYLES[orden.estado] || STATUS_STYLES['Pendiente']}`}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleVer(orden)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8500A] text-white text-xs font-medium hover:bg-[#c94208] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(orden)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8D7DA] text-[#7b1e24] text-xs font-medium hover:bg-[#f5c6cb] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrdenesClientes;