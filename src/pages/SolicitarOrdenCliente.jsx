import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { generateOrderPdfDoc } from '../utils/orderPdf';
import { getMockApiState } from '../services/mockApi';

function SolicitarOrdenCliente() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [mostrarPresupuesto, setMostrarPresupuesto] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [clienteOrdenes, setClienteOrdenes] = useState([]);
  const [tab, setTab] = useState('levantar'); // 'levantar' | 'ordenes'
  const [detalleOrden, setDetalleOrden] = useState(null);
  const [detallePdfUrl, setDetallePdfUrl] = useState('');
  const [detallePdfLoading, setDetallePdfLoading] = useState(false);

  const sharedStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Share+Tech+Mono&family=Source+Sans+3:wght@400;500;600;700&display=swap');

      .client-root { min-height: 100vh; background: #0e1117 !important; position: relative; overflow: hidden; color: #e8edf2; font-family: 'Source Sans 3', sans-serif; }
      .client-root::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 42px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 42px); pointer-events: none; }
      .client-root::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(14,17,23,0.96) 100%); pointer-events: none; }

      .scanline { position: absolute; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, rgba(232,80,10,0.18), transparent); animation: scanline 6s linear infinite; pointer-events: none; z-index: 1; }
      .ticker-wrap { position: fixed; bottom: 0; left: 0; right: 0; height: 32px; background: #1B2A3B; border-top: 1px solid rgba(232,80,10,0.4); overflow: hidden; z-index: 10; display: flex; align-items: center; }
      .ticker-inner { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; font-family: 'Share Tech Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; }
      .ticker-sep { color: #E8500A; margin: 0 18px; }

      .client-card { position: relative; z-index: 1; backdrop-filter: blur(16px); border: 1px solid rgba(232,80,10,0.18); box-shadow: 0 20px 60px rgba(0,0,0,0.32); background: rgba(20,25,32,0.96) !important; color: #e8edf2; }
      .client-auth-card { max-width: 430px; border-radius: 24px; }
      .client-auth-card .header-title { font-family: 'Rajdhani', sans-serif; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 1px; line-height: 1; margin-bottom: 6px; text-align: center; }
      .client-auth-card .header-title span { color: #E8500A; }

      .btn-submit { display: inline-block; padding: 13px; border-radius: 8px; border: none; background: #E8500A; color: #fff; font-family: 'Rajdhani', sans-serif; font-size: 17px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; position: relative; overflow: hidden; transition: background 0.2s, transform 0.1s; animation: pulse-border 3s ease infinite; margin-top: 0.5rem; }
      .btn-submit:hover:not(:disabled) { background: #c94308; } .btn-submit:active:not(:disabled) { transform: scale(0.98); } .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

      .client-dashboard-shell { width: min(1200px, calc(100% - 1rem)); border-radius: 28px; }
      .client-dashboard-shell--wide { max-width: 1200px; }
      .client-dashboard-shell--narrow { max-width: 760px; }

      .client-auth-card input, .client-dashboard-shell input, .client-dashboard-shell textarea { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; box-shadow: none !important; }
      .client-auth-card input::placeholder, .client-dashboard-shell input::placeholder, .client-dashboard-shell textarea::placeholder { color: rgba(255,255,255,0.28) !important; }

      .client-info-strip, .client-tabs, .client-form-panel, .client-upload-panel, .client-table-panel, .client-modal { background: rgba(255,255,255,0.035) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #e8edf2; }
      .client-table-panel table thead { background: linear-gradient(135deg, #1b2a3b, #23374c) !important; color: #fff; }
      .client-table-panel table tbody { background: rgba(20,25,32,0.88) !important; }
      .client-table-panel table tbody tr:hover { background: rgba(232,80,10,0.06) !important; }

      .client-modal { border-radius: 24px !important; overflow: hidden; }
      .client-frame-bg { background: linear-gradient(180deg, rgba(14,17,23,0.92), rgba(20,25,32,0.85)) !important; border: 1px solid rgba(232,80,10,0.06) !important; border-radius: 14px; padding: 10px; box-shadow: 0 12px 48px rgba(2,6,23,0.6); }

      .center-panel { margin: 0 auto; max-width: 760px; border-radius: 16px; background: rgba(9,11,13,0.6); padding: 14px; box-shadow: 0 20px 60px rgba(2,6,23,0.7); border: 1px solid rgba(255,255,255,0.03); }
      .client-card { max-width: 680px; margin: 0 auto; }

      @media (max-width: 1024px) { .client-dashboard-shell { width: min(760px, calc(100% - 1rem)); } }
    `}</style>
  );

  useEffect(() => {
    const savedCliente = localStorage.getItem('clienteData');
    if (savedCliente) {
      const cliente = JSON.parse(savedCliente);
      setClienteData(cliente);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Force dark body background while on this page to avoid global light background leaking through
    const prevBackground = document.body.style.background;
    const prevBackgroundImage = document.body.style.backgroundImage;
    document.body.style.background = '#0e1117';
    document.body.style.backgroundImage = 'none';
    return () => {
      document.body.style.background = prevBackground;
      document.body.style.backgroundImage = prevBackgroundImage;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && clienteData?.id) {
      fetch(`/api/orders?clienteId=${clienteData.id}`)
        .then(res => res.json())
        .then(data => setClienteOrdenes(Array.isArray(data) ? data.map(orden => ({
          ...orden,
          presupuestoCliente: orden.presupuestoCliente !== null && orden.presupuestoCliente !== undefined && orden.presupuestoCliente !== ''
            ? Number(orden.presupuestoCliente)
            : null,
          presupuestoAdmin: orden.presupuestoAdmin !== null && orden.presupuestoAdmin !== undefined && orden.presupuestoAdmin !== ''
            ? Number(orden.presupuestoAdmin)
            : null,
        })) : []))
        .catch(() => {});
    }
  }, [isAuthenticated, clienteData]);

  useEffect(() => () => {
    if (detallePdfUrl) {
      URL.revokeObjectURL(detallePdfUrl);
    }
  }, [detallePdfUrl]);

  useEffect(() => {
    if (!detalleOrden) return undefined;

    const blockShortcuts = (event) => {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (!isCtrlOrMeta) return;

      const key = String(event.key || '').toLowerCase();
      if (key === 'p' || key === 's') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', blockShortcuts, true);
    return () => {
      window.removeEventListener('keydown', blockShortcuts, true);
    };
  }, [detalleOrden]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      Swal.fire({ icon: 'error', title: 'Campos obligatorios', text: 'Por favor ingresa usuario y contraseña.' });
      return;
    }
    try {
      const mock = (typeof getMockApiState === 'function') ? getMockApiState() : null;
      const normalize = (s) => String(s || '').trim().toLowerCase();
      console.log('Mock login attempt', { inputUsuario: usuario, mockClients: mock?.clients?.length, mockUsers: mock?.users?.length });
      if (!mock) console.log('getMockApiState() returned null or is unavailable. window.__MOCK_API__ present:', typeof window !== 'undefined' && Boolean(window.__MOCK_API__));
      if (mock) {
        try {
          const usersSummary = Array.isArray(mock.users) ? mock.users.map(u => ({ id: u.id, correo: u.correo, usuario: u.usuario, contrasenaLen: String(u.contrasena || '').length })) : [];
          const clientsSummary = Array.isArray(mock.clients) ? mock.clients.map(c => ({ id: c.id, correo: c.correo, usuario: c.usuario, contrasenaLen: String(c.contrasena || '').length })) : [];
          console.log('Mock state summary - users:', usersSummary, 'clients:', clientsSummary);
        } catch (__) {
          console.log('Could not summarize mock state.');
        }
      }

      // Allow special-case: user types admin@gmail.com / admin -> map to any mock user with usuario 'admin'
      if (mock && Array.isArray(mock.users) && normalize(usuario) === 'admin@gmail.com' && String(contrasena || '') === 'admin') {
        const adminUser = mock.users.find((u) => normalize(u.usuario) === 'admin' || (String(u.correo || '').includes('admin') && normalize(u.correo).includes('admin')));
        if (adminUser) {
          console.log('Special-case admin login matched to user', adminUser);
          const derivedClient = {
            id: `c-from-${adminUser.id}`,
            nombre: adminUser.nombre || adminUser.usuario || adminUser.correo || 'Admin',
            correo: adminUser.correo || '',
            telefono: adminUser.telefono || '',
            usuario: adminUser.usuario || adminUser.correo || usuario,
            contrasena: adminUser.contrasena || contrasena,
          };
          setClienteData(derivedClient);
          setIsAuthenticated(true);
          localStorage.setItem('clienteData', JSON.stringify(derivedClient));
          Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: `Hola ${derivedClient.nombre}`, timer: 1200, showConfirmButton: false });
          setUsuario('');
          setContrasena('');
          return;
        }
      }

      // Try to match a client first (by usuario or correo)
      if (mock && Array.isArray(mock.clients)) {
        const foundClient = mock.clients.find((c) => (normalize(c.usuario) === normalize(usuario) || normalize(c.correo) === normalize(usuario)) && String((c.contrasena || '')).trim() === String(contrasena || '').trim());
        if (foundClient) {
          console.log('Found client match', foundClient);
          setClienteData(foundClient);
          setIsAuthenticated(true);
          localStorage.setItem('clienteData', JSON.stringify(foundClient));
          Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: `Hola ${foundClient.nombre}`, timer: 1200, showConfirmButton: false });
          setUsuario('');
          setContrasena('');
          return;
        }
      }

      // Try matching a user (admin/demo) and derive a client object locally
      if (mock && Array.isArray(mock.users)) {
        const foundUser = mock.users.find((u) => (normalize(u.correo) === normalize(usuario) || normalize(u.usuario) === normalize(usuario)) && String((u.contrasena || '')).trim() === String(contrasena || '').trim());
        if (foundUser) {
          console.log('Found user match', foundUser);
          const derivedClient = {
            id: `c-from-${foundUser.id}`,
            nombre: foundUser.nombre || foundUser.usuario || foundUser.correo || 'Usuario',
            correo: foundUser.correo || '',
            telefono: foundUser.telefono || '',
            usuario: foundUser.usuario || foundUser.correo || usuario,
            contrasena: foundUser.contrasena || contrasena,
          };
          setClienteData(derivedClient);
          setIsAuthenticated(true);
          localStorage.setItem('clienteData', JSON.stringify(derivedClient));
          Swal.fire({ icon: 'success', title: '¡Bienvenido!', text: `Hola ${derivedClient.nombre}`, timer: 1200, showConfirmButton: false });
          setUsuario('');
          setContrasena('');
          return;
        }
      }

      console.log('No match found in mock state');
      Swal.fire({ icon: 'error', title: 'Error de autenticación', text: 'Usuario o contraseña incorrectos' });
    } catch (err) {
      console.error('Login local error', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar el login localmente.' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClienteData(null);
    localStorage.removeItem('clienteData');
  };

  const closeDetalleModal = () => {
    if (detallePdfUrl) {
      URL.revokeObjectURL(detallePdfUrl);
    }
    setDetalleOrden(null);
    setDetallePdfUrl('');
    setDetallePdfLoading(false);
  };

  const buildClientePdfOrder = (orden) => {
    let observaciones = orden.observaciones;
    let accesorios = orden.accesorios;
    try {
      if (typeof observaciones === 'string') {
        observaciones = JSON.parse(observaciones);
      }
    } catch (_) {
      observaciones = {};
    }

    try {
      if (typeof accesorios === 'string') {
        const parsedAccesorios = JSON.parse(accesorios);
        accesorios = Array.isArray(parsedAccesorios) ? parsedAccesorios : accesorios;
      }
    } catch (_) {
      accesorios = orden.accesorios;
    }

    const fechaOrden = orden.fecha || new Date().toISOString().slice(0, 10);
    const tipoEquipoOrden = observaciones?.tipoEquipo || orden.tipo || '—';
    const direccionOrden = observaciones?.direccion || '—';

    return {
      ...orden,
      clientName: orden.clientName || clienteData?.nombre || '—',
      nombre: orden.clientName || clienteData?.nombre || '—',
      clienteId: clienteData?.id || orden.clienteId || '',
      usuario: clienteData?.usuario || clienteData?.username || orden.usuario || '',
      telefono: orden.telefono || clienteData?.telefono || '—',
      correo: orden.correo || clienteData?.correo || '—',
      fecha: fechaOrden,
      folio: orden.folio || '—',
      tipo: tipoEquipoOrden,
      tipoOrden: orden.tipo || 'cliente',
      marca: orden.marca || tipoEquipoOrden,
      modelo: orden.modelo || '—',
      serie: orden.serie || '—',
      accesorios: Array.isArray(accesorios) ? accesorios : [],
      otrosAccesorios: orden.otrosAccesorios || '',
      seguridad: orden.seguridad || '—',
      description: orden.description || orden.descripcion || '—',
      problema: orden.description || orden.descripcion || '—',
      detalleSolicitud: {
        tipoEquipo: tipoEquipoOrden,
        direccion: direccionOrden,
      },
      observaciones: `Tipo de equipo/servicio: ${tipoEquipoOrden}\nDirección: ${direccionOrden}`,
      tecnico: orden.tecnico || 'Sin asignar',
      firma: orden.firma || null,
    };
  };

  const handleVerDetalles = async (orden) => {
    if (detallePdfUrl) {
      URL.revokeObjectURL(detallePdfUrl);
    }
    setDetalleOrden(orden);
    setDetallePdfLoading(true);
    setDetallePdfUrl('');

    try {
      const doc = await generateOrderPdfDoc(buildClientePdfOrder(orden), {
        logoSrc: '/images/SIEEGNEW.png',
        clientView: true,
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setDetallePdfUrl(url);
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el PDF de la orden.', 'error');
      closeDetalleModal();
      return;
    } finally {
      setDetallePdfLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoEquipo || !direccion || !descripcion) {
      Swal.fire({ icon: 'error', title: 'Campos obligatorios', text: 'Por favor completa todos los campos.' });
      return;
    }
    try {
      const presupuestoNormalizado = presupuesto !== null && presupuesto !== undefined && String(presupuesto).trim() !== ''
        ? Number(String(presupuesto).replace(',', '.'))
        : null;

      // Convertir imágenes a base64
      const imagenesBase64 = [];
      for (let file of selectedImages) {
        const reader = new FileReader();
        imagenesBase64.push(new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        }));
      }
      const imagenes = await Promise.all(imagenesBase64);

      const folio = 'S' + new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 11);
      const fecha = new Date().toISOString().slice(0, 10);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio,
          fecha,
          clientName: clienteData?.nombre || '',
          telefono: clienteData?.telefono || '',
          correo: clienteData?.correo || '',
          tipo: 'cliente',
          clienteId: clienteData?.id,
          marca: '',
          modelo: '',
          serie: '',
          accesorios: JSON.stringify([]),
          otrosAccesorios: '',
          seguridad: '',
          patron: JSON.stringify([]),
          description: descripcion,
          diagnostico: '',
          observaciones: JSON.stringify({ tipoEquipo, direccion }),
          firma: null,
          nombreRecibe: '',
          status: 'Pendiente',
          technicianId: null,
          trabajos: JSON.stringify([]),
          resumen: JSON.stringify({ total: 0 }),
          imagenes: JSON.stringify(imagenes),
          presupuestoCliente: Number.isFinite(presupuestoNormalizado) ? presupuestoNormalizado : null,
          presupuesto: Number.isFinite(presupuestoNormalizado) ? presupuestoNormalizado : null,
          presupuestoAdmin: null,
          estadoPresupuesto: Number.isFinite(presupuestoNormalizado) ? 'pendiente_aprobacion' : 'sin_presupuesto',
          notaPresupuesto: ''
        })
      });
      const data = await res.json();
      if (res.ok || data.folio) {
        Swal.fire({ icon: 'success', title: '¡Solicitud enviada!', text: `Tu solicitud ha sido enviada correctamente. Folio: ${data.folio}`, timer: 2000, showConfirmButton: false });
        setTipoEquipo('');
        setDireccion('');
        setDescripcion('');
        setPresupuesto('');
        setMostrarPresupuesto(false);
        setSelectedImages([]);
        setImagePreviews([]);
        // Recargar órdenes
        if (clienteData?.id) {
          fetch(`/api/orders?clienteId=${clienteData.id}`)
            .then(res => res.json())
            .then(data => setClienteOrdenes(Array.isArray(data) ? data.map(orden => ({
              ...orden,
              presupuestoCliente: orden.presupuestoCliente !== null && orden.presupuestoCliente !== undefined && orden.presupuestoCliente !== ''
                ? Number(orden.presupuestoCliente)
                : null,
              presupuestoAdmin: orden.presupuestoAdmin !== null && orden.presupuestoAdmin !== undefined && orden.presupuestoAdmin !== ''
                ? Number(orden.presupuestoAdmin)
                : null,
            })) : []))
            .catch(() => {});
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || data.error || 'No se pudo enviar la solicitud.' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor. Intenta de nuevo.' });
    }
  };

  // Función para manejar el cambio de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    setSelectedImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  // Función para eliminar una imagen seleccionada
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Función para aceptar presupuesto
  const handlePresupuestoClienteAcepta = async (folio) => {
    const result = await Swal.fire({
      title: '¿Aceptar presupuesto?',
      text: 'Confirmas que aceptas el presupuesto propuesto por el administrador.',
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Sí, aceptar', cancelButtonText: 'Cancelar', confirmButtonColor: '#16a34a',
    });
    if (!result.isConfirmed) return;
    try {
      await fetch(`/api/orders/${folio}/presupuesto-cliente-acepta`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
      setClienteOrdenes(prev => prev.map(o => o.folio === folio ? { ...o, estadoPresupuesto: 'aceptado' } : o));
      Swal.fire({ icon: 'success', title: 'Presupuesto aceptado', timer: 1500, showConfirmButton: false });
    } catch { Swal.fire('Error', 'No se pudo procesar la respuesta', 'error'); }
  };

  // Función para rechazar presupuesto
  const handlePresupuestoClienteRechaza = (folio) => {
    Swal.fire({
      text: 'Se le notificará al administrador que rechazas el presupuesto propuesto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await fetch(`/api/orders/${folio}/presupuesto-cliente-rechaza`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
        setClienteOrdenes(prev => prev.map(o => o.folio === folio ? { ...o, estadoPresupuesto: 'rechazado' } : o));
        Swal.fire({ icon: 'info', title: 'Presupuesto rechazado', timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire('Error', 'No se pudo procesar la respuesta', 'error');
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div>
        {sharedStyles}
      <div className="client-root flex flex-col items-center justify-center px-3 py-6 md:py-8">
        <div className="client-card client-auth-card max-w-md w-full mx-auto p-8 animate-fade-in">
            <h2 className="text-2xl font-extrabold text-white mb-2 text-center">Iniciar Sesión</h2>
            <p className="mb-6 text-white/55 text-center text-sm">Solicitar Orden de Servicio</p>
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
                <label className="block text-white/70 font-semibold mb-2 text-sm">Usuario</label>
              <input
                  className="w-full px-4 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-action-500/30 focus:border-action-500 outline-none"
                placeholder="Ingresa tu usuario" value={usuario} onChange={e => setUsuario(e.target.value)} autoComplete="username"
              />
            </div>
            <div>
                <label className="block text-white/70 font-semibold mb-2 text-sm">Contraseña</label>
              <input
                type="password"
                  className="w-full px-4 py-3 rounded-xl shadow-sm focus:ring-2 focus:ring-action-500/30 focus:border-action-500 outline-none"
                placeholder="Ingresa tu contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} autoComplete="current-password"
              />
            </div>
              <button type="submit" className="btn-submit" aria-label="Iniciar sesión">
                <span className="header-title">Iniciar <span>Sesión</span></span>
              </button>
            
          </form>
            <p className="text-center text-white/40 text-xs mt-6">Si no tienes usuario, contacta al administrador</p>
        </div>
      <div className="ticker-wrap">
        <div className="ticker-inner">
          <span className="ticker-sep">||</span>
          <span>Bienvenido al sistema Mecanica • Solicitudes locales activas</span>
          <span className="ticker-sep">||</span>
          <span>Soporte: admin@demo.com • Demo Mode</span>
        </div>
      </div>
    </div>
      </div>
    );
  }

  return (
    <div className="client-root flex flex-col items-center justify-center px-3 md:px-6 py-6 md:py-8">
      {sharedStyles}
      <div className="scanline" />

      <div className="center-panel w-full max-w-3xl mx-auto p-4">
        <div className="client-content w-full client-frame-bg p-3">
          <div className={`client-card client-dashboard-shell animate-fade-in p-4 ${tab === 'ordenes' ? 'client-dashboard-shell--wide' : 'client-dashboard-shell--narrow'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white">Ordenes de Clientes</h2>
                <p className="text-white/60 text-sm">Bienvenido, <span className="font-semibold text-white">{clienteData?.nombre}</span></p>
              </div>
              <div>
                <button onClick={handleLogout} className="text-sm text-alert font-semibold underline">Cerrar Sesión</button>
              </div>
            </div>

            <div className="client-info-strip rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-white/75"><strong className="text-white">Correo:</strong> {clienteData?.correo}</p>
              <p className="text-sm text-white/75"><strong className="text-white">Teléfono:</strong> {clienteData?.telefono}</p>
            </div>

            <div className="client-tabs flex flex-wrap gap-2 mb-6 justify-center">
              <button className={`px-4 py-2 rounded-xl font-bold ${tab === 'levantar' ? 'bg-gradient-to-r from-action-500 to-alert-500 text-white' : 'bg-white/5 text-white/70'}`} onClick={() => setTab('levantar')}>Levantar orden</button>
              <button className={`px-4 py-2 rounded-xl font-bold ${tab === 'ordenes' ? 'bg-gradient-to-r from-action-500 to-alert-500 text-white' : 'bg-white/5 text-white/70'}`} onClick={() => setTab('ordenes')}>Mis órdenes</button>
            </div>

            {tab === 'levantar' && (
              <div className="max-w-md mx-auto w-full">
                {clienteOrdenes.some(o => o.estadoPresupuesto === 'pendiente_aprobacion') && (
                  <div className="mb-4 rounded-xl p-4 flex items-center gap-3 client-form-panel">
                    <svg className="w-6 h-6 text-alert flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    <span className="text-white/80 font-semibold text-sm">⚠️ Tienes un presupuesto pendiente de aprobación. Revísalo en "Mis Órdenes".</span>
                  </div>
                )}

                <p className="mb-4 text-white/70">Completa el formulario para generar tu solicitud.</p>
                <form className="flex flex-col gap-4 client-form-panel rounded-2xl p-5" onSubmit={handleSubmit}>
                  <input className="px-4 py-3 rounded-xl" placeholder="Tipo de Equipo/Servicio" value={tipoEquipo} onChange={e => setTipoEquipo(e.target.value)} />
                  <input className="px-4 py-3 rounded-xl" placeholder="Dirección" value={direccion} onChange={e => setDireccion(e.target.value)} />
                  <textarea className="px-4 py-3 rounded-xl min-h-[100px]" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />

                  <div className="client-upload-panel border-2 border-dashed rounded-xl p-4">
                    <label className="block text-sm font-semibold text-white/80 mb-2">Evidencia Fotográfica <span className="text-white/40 font-normal">(máximo 2 archivos)</span></label>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="block w-full" />
                    <p className="text-xs text-white/40 mt-1">Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB por imagen.</p>
                  </div>

                  <div className="flex justify-center mt-2">
                    <button type="submit" className="btn-submit w-56">Enviar Solicitud</button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'ordenes' && (
              <div>
                {clienteOrdenes.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Mis Órdenes</h3>
                    <div className="client-table-panel overflow-x-auto shadow-sm rounded-lg">
                      <table className="w-full text-xs md:text-sm">
                        <thead className="text-white">
                          <tr>
                            <th className="px-4 py-3 text-left">Folio</th>
                            <th className="px-4 py-3 text-left">Fecha</th>
                            <th className="px-4 py-3 text-left">Equipo/Servicio</th>
                            <th className="px-4 py-3 text-left">Estado</th>
                            <th className="px-4 py-3 text-left">Presupuesto</th>
                            <th className="px-4 py-3 text-left">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-transparent">
                          {clienteOrdenes.map((orden) => {
                            const obs = (() => { try { return JSON.parse(orden.observaciones || '{}'); } catch { return {}; } })();
                            return (
                              <tr key={orden.id || orden.folio} className={`hover:bg-white/5 ${orden.estadoPresupuesto === 'pendiente_aprobacion' ? 'bg-alert-500/10' : ''}`}>
                                <td className="px-4 py-3 font-semibold text-white">{orden.folio || '-'}</td>
                                <td className="px-4 py-3">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3">{obs.tipoEquipo || orden.tipo || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${orden.status === 'Pendiente' ? 'bg-alert-500/20 text-alert' : 'bg-primary-500/20 text-primary-200'}`}>
                                    {orden.status || 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 w-[260px]">
                                  {orden.presupuestoCliente ? <div className="text-xs text-white/70 mb-1">Tu estimado: ${Number(orden.presupuestoCliente).toFixed(2)}</div> : <span className="text-white/35 text-xs">Sin presupuesto aún</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-action-500 to-alert-500 text-white text-xs font-bold" onClick={() => handleVerDetalles(orden)}>Ver detalles</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/50 text-center py-8">No tienes órdenes registradas.</div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {detalleOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-6">
          <div className="client-modal w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#1b2a3b] to-[#0f1720] text-white">
              <div>
                <h3 className="text-lg md:text-xl font-extrabold">Detalles de la orden</h3>
                <p className="text-xs md:text-sm text-white/80">Folio {detalleOrden.folio || '-'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-xl bg-white/10 text-white/90 text-xs md:text-sm font-semibold">Solo visualizacion</span>
                <button type="button" onClick={closeDetalleModal} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold">Cerrar</button>
              </div>
            </div>
            <div className="flex-1 bg-[#0f141a] p-3 md:p-5">
              {!detallePdfLoading && detallePdfUrl && (
                <iframe title={`PDF orden ${detalleOrden.folio || ''}`} src={`${detallePdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} className="w-full h-full rounded-xl bg-white shadow-lg" />
              )}
              {!detallePdfLoading && !detallePdfUrl && (
                <div className="h-full flex items-center justify-center text-white/50 font-medium">No se pudo mostrar el PDF.</div>
              )}
              {detallePdfLoading && (<div className="h-full flex items-center justify-center text-white/70 font-semibold">Generando PDF...</div>)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SolicitarOrdenCliente;
