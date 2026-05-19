import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { useAuthStore } from '../store/authStore';
import SignaturePadCanvas from '../components/SignaturePadCanvas';

const STATUS_OPTIONS = [
  { value: 'pendiente',  label: 'Pendiente' },
  { value: 'revision',   label: 'En revisión' },
  { value: 'reparacion', label: 'En reparación' },
  { value: 'lista',      label: 'Lista' },
  { value: 'cancelada',  label: 'Cancelada' },
];

const STATUS_STYLES = {
  pendiente:  'bg-[#FFF3CD] text-[#7c5a00]',
  revision:   'bg-[#E2E8EF] text-[#2E4460]',
  reparacion: 'bg-[#FFF3CD] text-[#7c5a00]',
  lista:      'bg-[#D4EDDA] text-[#1a5c2e]',
  cancelada:  'bg-[#F8D7DA] text-[#7b1e24]',
};

const normalizeStatus = (status) => {
  const raw = String(status || '').trim().toLowerCase();
  const map = {
    pendiente: 'pendiente',
    'en proceso': 'revision',
    'en revisión': 'revision',
    revision: 'revision',
    reparacion: 'reparacion',
    'en reparación': 'reparacion',
    lista: 'lista',
    entregada: 'entregada',
    cancelada: 'cancelada',
  };
  return map[raw] || 'pendiente';
};

const getAddressFromObservaciones = (observaciones) => {
  if (!observaciones) return '-';
  if (typeof observaciones === 'object') return observaciones.direccion || '-';
  try {
    return JSON.parse(observaciones)?.direccion || '-';
  } catch {
    return '-';
  }
};

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#1B2A3B] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors';

export default function ForeignServices() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isTechnician = normalizedRole === 'tecnico';
  const isAdmin = normalizedRole === 'administrador' || normalizedRole === 'admin';
  const isMostrador = normalizedRole === 'mostrador';
  const currentUserName = user?.nombre || user?.name || '';

  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [pendingReceive, setPendingReceive] = useState(null);
  const [nombreRecibe, setNombreRecibe] = useState('');
  const signaturePadRef = useRef();

  useEffect(() => {
    fetch('/api/orders?foraneo=true')
      .then(res => res.json())
      .then(data => {
        let mapped = (Array.isArray(data) ? data : [])
          .filter(order => String(order.tipo || '').toLowerCase() === 'foraneo')
          .map(order => ({
            ...order,
            status: normalizeStatus(order.status || order.estado),
            direccion: getAddressFromObservaciones(order.observaciones),
          }));
        if (normalizedRole === 'tecnico' && currentUserName) {
          mapped = mapped.filter(order => order.tecnico === currentUserName);
        }
        setServices(mapped);
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudieron cargar los servicios externos', 'error');
        setServices([]);
      });

    fetch('/api/technicians')
      .then(res => res.json())
      .then(data => setTechnicians(Array.isArray(data) ? data : []))
      .catch(() => setTechnicians([]));
  }, [normalizedRole, currentUserName]);

  const handleTecnicoChange = async (idx, technicianName) => {
    const selected = technicians.find(t => (t.nombre || t.name) === technicianName);
    if (!selected) return;
    const service = services[idx];
    setServices(prev => prev.map((s, i) => (i === idx ? { ...s, tecnico: technicianName } : s)));
    try {
      await fetch(`/api/orders/${service.folio}/tecnico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selected.id }),
      });
    } catch {
      Swal.fire('Error', 'No se pudo actualizar el técnico', 'error');
    }
  };

  const updateStatusWithReceipt = async (idx, newEstado, receiptData = {}) => {
    const service = services[idx];
    const previous = service.status;
    setServices(prev => prev.map((s, i) => (i === idx ? { ...s, status: newEstado, ...receiptData } : s)));
    try {
      const res = await fetch(`/api/orders/${service.folio}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado, ...receiptData }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setServices(prev => prev.map((s, i) => (i === idx ? { ...s, status: previous } : s)));
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const handleEstadoChange = async (idx, newEstado) => {
    const service = services[idx];
    const hasTech = Boolean(String(service.tecnico || '').trim() || service.technicianId);

    if (!hasTech && newEstado !== 'pendiente') {
      await Swal.fire({ icon: 'warning', title: 'Asigna un técnico primero', text: 'Debes asignar un técnico para poder cambiar el estado.', confirmButtonText: 'Entendido' });
      setServices(prev => prev.map((s, i) => (i === idx ? { ...s, status: 'pendiente' } : s)));
      return;
    }

    if (newEstado === 'lista') {
      const decision = await Swal.fire({
        title: '¿Van a firmar de recibido?',
        text: 'Si firmas de recibido, se agregará nombre y firma en el PDF.',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Sí, firmar',
        denyButtonText: 'No, sin firma',
        cancelButtonText: 'Cancelar',
      });
      if (decision.isConfirmed) {
        setPendingReceive({ idx, newEstado });
        setNombreRecibe(service.nombreRecibe || '');
        setShowReceiveModal(true);
        setTimeout(() => signaturePadRef.current?.clear?.(), 0);
        return;
      }
      if (decision.isDenied) await updateStatusWithReceipt(idx, newEstado, { firma: null, nombreRecibe: null });
      return;
    }

    await updateStatusWithReceipt(idx, newEstado);
  };

  const handleDeleteOrder = async (idx) => {
    const service = services[idx];
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `La orden ${service.folio} será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E8500A',
      cancelButtonColor: '#2E4460',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/orders/${service.folio}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error();
      setServices(prev => prev.filter((_, i) => i !== idx));
      Swal.fire('Eliminada', 'La orden ha sido eliminada correctamente.', 'success');
    } catch {
      Swal.fire('Error', 'No se pudo eliminar la orden', 'error');
    }
  };

  // ── PDF generation (lógica intacta, colores actualizados a la paleta) ──────
  const generatePDFFromOrder = async (service) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const C = {
      navy:      '#1B2A3B',
      accent:    '#E8500A',
      bg:        '#F4F6F8',
      white:     '#FFFFFF',
      divider:   '#DDE3EC',
      labelText: '#6B7A99',
      bodyText:  '#1B2A3B',
      footerText:'#9099B2',
    };

    const rgb = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const setFill   = (hex) => doc.setFillColor(...rgb(hex));
    const setStroke = (hex) => doc.setDrawColor(...rgb(hex));
    const setTxt    = (hex) => doc.setTextColor(...rgb(hex));
    const filledRR  = (x,y,w,h,r,color) => { setFill(color); doc.roundedRect(x,y,w,h,r,r,'F'); };

    const getLogoBase64 = (src) => new Promise(resolve => {
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = function() {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img,0,0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const logoBase64 = await getLogoBase64('/images/logo.ico');

    const sectionHeader = (label, x, y, w) => {
      filledRR(x, y, w, 22, 4, C.navy);
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); setTxt(C.white);
      doc.text(label.toUpperCase(), x + 10, y + 14.5);
      return y + 22;
    };

    const fieldCell = (label, value, x, y, w, h = 30) => {
      filledRR(x,y,w,h,3,C.bg); setStroke(C.divider); doc.setLineWidth(0.4);
      doc.roundedRect(x,y,w,h,3,3,'S');
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelText);
      doc.text(label.toUpperCase(), x+6, y+9);
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
      const txt = doc.splitTextToSize(String(value||'—'), w-12);
      doc.text(txt[0], x+6, y+21);
    };

    const drawPageBg = () => {
      setFill(C.bg); doc.rect(0,0,W,H,'F');
      filledRR(20,20,W-40,H-40,8,C.white);
    };

    const drawHeader = () => {
      setFill(C.bg); doc.rect(0,0,W,90,'F');
      const logoH=40, logoW=100;
      if (logoBase64) doc.addImage(logoBase64,'PNG',40,22,logoW,logoH);
      const tX=40+logoW+22, tY=22+14;
      doc.setFont('helvetica','bold'); doc.setFontSize(13); setTxt(C.navy);
      doc.text('Ingeniería y Telecomunicaciones', tX, tY);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); setTxt(C.navy);
      doc.text('Mecánica', tX, tY+16);
      const bW=130, bH=28, bX=W-bW-50, bY=22+6;
      filledRR(bX,bY,bW,bH,7,C.navy);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); setTxt(C.white);
      doc.text('SERVICIO FORÁNEO', bX+bW/2, bY+bH/2+3, {align:'center'});
    };

    const drawFooter = (pageNum) => {
      setStroke(C.divider); doc.setLineWidth(0.5); doc.line(34,H-38,W-34,H-38);
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); setTxt(C.footerText);
      doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', 34, H-26);
      doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529', 34, H-16);
      doc.text(`Página ${pageNum} de 1`, W-34, H-16, {align:'right'});
    };

    drawPageBg(); drawHeader();
    const mx=40, cw=W-80;
    let y=110;

    y = sectionHeader('Información del Cliente', mx, y, cw); y+=8;
    const col3=(cw-16)/3;
    fieldCell('Cliente', service.clientName, mx, y, col3);
    fieldCell('Dirección', service.direccion, mx+col3+8, y, col3);
    fieldCell('Teléfono', service.telefono, mx+col3*2+16, y, col3);
    y+=44;
    fieldCell('Folio', service.folio, mx, y, col3);
    fieldCell('Fecha', service.fecha, mx+col3+8, y, col3);
    y+=44;

    y = sectionHeader('Checklist de Mantenimiento', mx, y, cw); y+=8;
    let rows=[];
    if (service.observaciones) {
      try { const p=JSON.parse(service.observaciones); if(p.rows&&Array.isArray(p.rows)) rows=p.rows; } catch {}
    }

    const headers=['Área','Filtros','Condensadora','PSI','Evaporadora','Eléctrica','Observaciones'];
    const colWidths=[cw*0.20,cw*0.11,cw*0.13,cw*0.08,cw*0.13,cw*0.11,cw*0.24];
    const headerH=16;
    let xPos=mx;
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    headers.forEach((header,i)=>{
      setFill(C.navy); doc.rect(xPos,y,colWidths[i],headerH,'F');
      setStroke(C.divider); doc.setLineWidth(0.5); doc.rect(xPos,y,colWidths[i],headerH,'S');
      setTxt(C.white);
      doc.text(doc.splitTextToSize(header,colWidths[i]-4), xPos+3, y+11);
      xPos+=colWidths[i];
    });
    y+=headerH;

    rows.forEach((row,i)=>{
      if(y>H-90){ drawFooter(1); doc.addPage(); drawPageBg(); drawHeader(); y=110; }
      const rowH=14; xPos=mx;
      const bgColor=i%2===0?C.white:'#F9FAFB';
      const cellValues=[row.area,row.filtros,row.condensadora,row.psi,row.evaporadora,row.electrica,row.observaciones];
      cellValues.forEach((val,ci)=>{
        setFill(bgColor); doc.rect(xPos,y,colWidths[ci],rowH,'F');
        setStroke(C.divider); doc.setLineWidth(0.4); doc.rect(xPos,y,colWidths[ci],rowH,'S');
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5); setTxt(C.bodyText);
        doc.text(doc.splitTextToSize(String(val||'—'),colWidths[ci]-4), xPos+3, y+9);
        xPos+=colWidths[ci];
      });
      y+=rowH;
    });

    if (service.firma || service.nombreRecibe) {
      if(y>H-220){ drawFooter(1); doc.addPage(); drawPageBg(); drawHeader(); y=110; }
      y+=20;
      filledRR(mx,y,cw,32,6,C.navy);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); setTxt(C.white);
      doc.text('FIRMAS Y ACEPTACIÓN', mx+cw/2, y+20, {align:'center'});
      y+=46;
      const sigBoxW=250, sigBoxH=100, sigBoxX=mx+(cw-sigBoxW)/2;
      filledRR(sigBoxX,y,sigBoxW,sigBoxH+40,8,C.white);
      setStroke(C.navy); doc.setLineWidth(1.5); doc.roundedRect(sigBoxX,y,sigBoxW,sigBoxH+40,8,8,'S');
      const sigAreaY=y+8;
      filledRR(sigBoxX+10,sigAreaY,sigBoxW-20,sigBoxH,4,'#f0f4f8');
      setStroke(C.divider); doc.setLineWidth(0.5); doc.roundedRect(sigBoxX+10,sigAreaY,sigBoxW-20,sigBoxH,4,4,'S');
      if (service.firma) {
        try {
          let img=service.firma;
          if(!img.startsWith('data:')) img='data:image/png;base64,'+img;
          doc.addImage(img,'PNG',sigBoxX+15,sigAreaY+5,sigBoxW-30,sigBoxH-10);
        } catch {
          setStroke(C.divider); doc.setLineWidth(1);
          doc.line(sigBoxX+30,sigAreaY+sigBoxH/2,sigBoxX+sigBoxW-30,sigAreaY+sigBoxH/2);
        }
      } else {
        setStroke(C.divider); doc.setLineWidth(1);
        doc.line(sigBoxX+30,sigAreaY+sigBoxH/2,sigBoxX+sigBoxW-30,sigAreaY+sigBoxH/2);
      }
      const labelY=sigAreaY+sigBoxH+8;
      doc.setFont('helvetica','bold'); doc.setFontSize(8); setTxt(C.navy);
      doc.text('FIRMA DEL CLIENTE', sigBoxX+sigBoxW/2, labelY, {align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(8); setTxt(C.bodyText);
      doc.text(service.nombreRecibe||'___________________________', sigBoxX+sigBoxW/2, labelY+12, {align:'center'});
    }

    drawFooter(1);
    return doc.output('blob');
  };

  const handleViewDetail = async (service) => {
    try {
      const blob = await generatePDFFromOrder(service);
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1B2A3B] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B2A3B] leading-tight">Servicios Externos</h2>
            <p className="text-xs text-gray-500 leading-none mt-0.5">
              {services.length} orden{services.length !== 1 ? 'es' : ''} registrada{services.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate('/servicios-externos/crear')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Crear orden foránea
          </button>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#E8500A]" />
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {services.length} registro{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#1B2A3B] text-white">
                {['Folio', 'Cliente', 'Dirección', 'Fecha', 'Técnico', 'Estado', 'Acciones'].map((col, i, arr) => (
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
              {services.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                    No hay servicios externos registrados.
                  </td>
                </tr>
              )}

              {services.map((service, idx) => (
                <tr
                  key={service.folio || service.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-[#F4F6F8] transition-colors"
                >
                  {/* Folio */}
                  <td className="py-3.5 px-4 align-middle font-mono text-xs text-[#2E4460] font-semibold">
                    {service.folio || '-'}
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2E4460] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {(service.clientName || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#1B2A3B] text-sm">{service.clientName || '-'}</span>
                    </div>
                  </td>

                  {/* Dirección */}
                  <td className="py-3.5 px-4 align-middle text-gray-500 text-xs max-w-[160px] truncate">
                    {service.direccion}
                  </td>

                  {/* Fecha */}
                  <td className="py-3.5 px-4 align-middle text-gray-600 whitespace-nowrap text-xs">
                    {service.fecha || '-'}
                  </td>

                  {/* Técnico */}
                  <td className="py-3.5 px-4 align-middle">
                    {isTechnician || isMostrador ? (
                      <span className="text-sm font-medium text-[#2E4460]">{service.tecnico || 'Sin asignar'}</span>
                    ) : (
                      <select
                        value={service.tecnico || ''}
                        onChange={e => handleTecnicoChange(idx, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-[#1B2A3B] font-medium focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors"
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[service.status] || STATUS_STYLES['pendiente']}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_OPTIONS.find(o => o.value === service.status)?.label || service.status}
                      </span>
                    ) : (
                      <select
                        value={service.status}
                        onChange={e => handleEstadoChange(idx, e.target.value)}
                        className={`px-2.5 py-1.5 rounded-lg border-0 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 cursor-pointer ${STATUS_STYLES[service.status] || STATUS_STYLES['pendiente']}`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleViewDetail(service)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8500A] text-white text-xs font-medium hover:bg-[#c94208] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver detalle
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => navigate('/servicios-externos/crear', { state: { order: service } })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E2E8EF] text-[#2E4460] text-xs font-medium hover:bg-[#d0d8e4] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                      )}

                      {service.status === 'cancelada' && !isTechnician && (
                        <button
                          onClick={() => handleDeleteOrder(idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8D7DA] text-[#7b1e24] text-xs font-medium hover:bg-[#f5c6cb] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal firma de recibido */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-[#1B2A3B]">
              <h3 className="text-base font-semibold text-white">Firma de recibido</h3>
              <p className="text-xs text-white/60 mt-0.5">Captura el nombre de quien recibe y su firma para incluirlo en el PDF.</p>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide mb-1">
                  Nombre de quien recibe
                </label>
                <input
                  className={inputCls}
                  placeholder="Nombre completo"
                  value={nombreRecibe}
                  onChange={e => setNombreRecibe(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide mb-1">
                  Firma
                </label>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-[#F4F6F8]">
                  <SignaturePadCanvas ref={signaturePadRef} width={420} height={170} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => signaturePadRef.current?.clear?.()}
                className="w-full px-3 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar firma
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowReceiveModal(false); setPendingReceive(null); setNombreRecibe(''); signaturePadRef.current?.clear?.(); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!nombreRecibe.trim()) { Swal.fire('Campo obligatorio', 'Captura el nombre de quien recibe.', 'warning'); return; }
                    if (signaturePadRef.current?.isEmpty?.()) { Swal.fire('Firma requerida', 'Captura la firma para continuar.', 'warning'); return; }
                    try {
                      const canvas = signaturePadRef.current?.getTrimmedCanvas?.() || signaturePadRef.current?.toDataURL?.();
                      const signatureImage = typeof canvas === 'string' ? canvas : canvas?.toDataURL?.();
                      if (!signatureImage) throw new Error();
                      const current = pendingReceive;
                      setShowReceiveModal(false); setPendingReceive(null); signaturePadRef.current?.clear?.();
                      if (current) await updateStatusWithReceipt(current.idx, current.newEstado, { nombreRecibe: nombreRecibe.trim(), firma: signatureImage });
                      setNombreRecibe('');
                    } catch { Swal.fire('Error', 'No se pudo capturar la firma.', 'error'); }
                  }}
                  className="flex-[2] px-4 py-2.5 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
                >
                  Guardar recibido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}