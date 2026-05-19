import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import React, { useState } from 'react';
import SignaturePadCanvas from '../components/SignaturePadCanvas';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { generateOrderPdfDoc as sharedGenerateOrderPdfDoc } from '../utils/orderPdf';


const ESTADOS = {
  pendiente: { label: 'Pendiente', bg: 'bg-state-pending/30', text: 'text-state-pending' },
  'Pendiente': { label: 'Pendiente', bg: 'bg-state-pending/30', text: 'text-state-pending' },
  revision: { label: 'En revisión', bg: 'bg-state-review/30', text: 'text-state-review' },
  'Revision': { label: 'En revisión', bg: 'bg-state-review/30', text: 'text-state-review' },
  diagnostico: { label: 'Diagnóstico generado', bg: 'bg-blue-200/20', text: 'text-blue-800' },
  'Diagnostico': { label: 'Diagnóstico generado', bg: 'bg-blue-200/20', text: 'text-blue-800' },
  espera_aprobacion: { label: 'En espera de aprobación', bg: 'bg-yellow-100/20', text: 'text-yellow-700' },
  'Espera_Aprobacion': { label: 'En espera de aprobación', bg: 'bg-yellow-100/20', text: 'text-yellow-700' },
  reparacion: { label: 'En reparación', bg: 'bg-state-repair/30', text: 'text-state-repair' },
  'Reparacion': { label: 'En reparación', bg: 'bg-state-repair/30', text: 'text-state-repair' },
  lista: { label: 'Lista', bg: 'bg-green-500/20', text: 'text-green-600' },
  'Lista': { label: 'Lista', bg: 'bg-green-500/20', text: 'text-green-600' },
  entregada: { label: 'Entregada', bg: 'bg-blue-400/20', text: 'text-blue-500' },
  'Entregada': { label: 'Entregada', bg: 'bg-blue-400/20', text: 'text-blue-500' },
  cancelada: { label: 'Cancelada', bg: 'bg-state-cancelled/30', text: 'text-state-cancelled' },
  'Cancelada': { label: 'Cancelada', bg: 'bg-state-cancelled/30', text: 'text-state-cancelled' },
  eliminada: { label: 'Eliminada', bg: 'bg-gray-300/30', text: 'text-gray-500' },
  'Eliminada': { label: 'Eliminada', bg: 'bg-gray-300/30', text: 'text-gray-500' },
};

const getEstado = (status) => {
  if (!status) return ESTADOS.pendiente;
  const lower = String(status).toLowerCase().trim();
  for (const [key, value] of Object.entries(ESTADOS)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
};

const parseImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === 'string') {
    try {
      const parsed = JSON.parse(imagenes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }
  return [];
};

const ORDERS_NAV_CONTEXT_KEY = 'orders_nav_context';
const getDashboardScrollContainer = () => document.getElementById('dashboard-scroll-container');
const getScrollSnapshot = () => {
  const scrollContainer = getDashboardScrollContainer();
  const docY = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  return {
    windowY: window.scrollY || window.pageYOffset || 0,
    docY,
    containerScrollTop: scrollContainer ? scrollContainer.scrollTop : 0,
  };
};

// ── Pill de estado inline (sin Tailwind, usa paleta mecánica) ─────────────────
const PILL_CFG = {
  pendiente:         { bg: '#FFF3CD', color: '#7A4E00', dot: '#F4A63A' },
  revision:          { bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  diagnostico:       { bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  espera_aprobacion: { bg: '#FFF3CD', color: '#7A4E00', dot: '#F4A63A' },
  reparacion:        { bg: '#FAECE7', color: '#712B13', dot: '#E8500A' },
  lista:             { bg: '#D4EDDA', color: '#155724', dot: '#27C93F' },
  entregada:         { bg: '#E2E8EF', color: '#1B2A3B', dot: '#2E4460' },
  cancelada:         { bg: '#F8D7DA', color: '#721C24', dot: '#A32D2D' },
  eliminada:         { bg: '#F4F6F8', color: '#6B7F93', dot: '#B4B2A9' },
};

const PillEstado = ({ status }) => {
  const key = String(status || '').toLowerCase().trim();
  const cfg = PILL_CFG[key] || { bg: '#E2E8EF', color: '#2E4460', dot: '#2E4460' };
  const label = getEstado(status)?.label || status || 'Desconocido';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.3px',
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
};


const Orders = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isTechnician = normalizedRole === 'tecnico';
  const isAdmin = normalizedRole === 'administrador' || normalizedRole === 'admin';
  const isMostrador = normalizedRole === 'mostrador';
  const currentUserName = user?.nombre || user?.name || '';
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [orders, setOrders] = useState([]);
  const [allTechnicians, setAllTechnicians] = useState([]);
  const [cancelOrderFolio, setCancelOrderFolio] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [entregaOrderFolio, setEntregaOrderFolio] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [signatureData, setSignatureData] = useState(null);
  const [imageOrder, setImageOrder] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [savingImages, setSavingImages] = useState(false);
  const [highlightedFolio, setHighlightedFolio] = useState(null);
  const signaturePadRef = React.useRef();
  const hasRestoredScrollRef = React.useRef(false);

  const handleOpenOrderDetail = (folio) => {
    const snapshot = getScrollSnapshot();
    try {
      sessionStorage.setItem(ORDERS_NAV_CONTEXT_KEY, JSON.stringify({ ...snapshot, folio, timestamp: Date.now() }));
    } catch (_) {}
    navigate(`/admin/orders/${folio}`);
  };

  const openImagesModal = (order) => {
    setImageOrder(order);
    setExistingImages(parseImagenes(order.imagenes));
    setNewImageFiles([]);
    setNewImagePreviews([]);
  };

  const closeImagesModal = () => {
    setImageOrder(null);
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setSavingImages(false);
  };

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const usedSlots = existingImages.length + newImageFiles.length;
    const remaining = Math.max(0, 2 - usedSlots);
    if (remaining <= 0) {
      Swal.fire('Límite alcanzado', 'Solo puedes guardar máximo 2 imágenes por orden.', 'warning');
      event.target.value = '';
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      Swal.fire('Límite de imágenes', `Solo se agregaron ${remaining} imagen(es). Máximo 2 por orden.`, 'warning');
    }
    setNewImageFiles(prev => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNewImage = (idx) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveImages = async () => {
    if (!imageOrder) return;
    setSavingImages(true);
    try {
      let uploadedPaths = [];
      if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => formData.append('images', file));
        const uploadRes = await fetch('/api/orders/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('No se pudieron subir las imágenes');
        const uploadData = await uploadRes.json();
        uploadedPaths = Array.isArray(uploadData.imagenes) ? uploadData.imagenes : [];
      }
      const finalImages = [...existingImages, ...uploadedPaths].slice(0, 2);
      const saveRes = await fetch(`/api/orders/${imageOrder.folio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenes: finalImages }),
      });
      if (!saveRes.ok) throw new Error('No se pudieron guardar las imágenes en la orden');
      setOrders(prev => prev.map(ord => ord.folio === imageOrder.folio ? { ...ord, imagenes: finalImages } : ord));
      Swal.fire('Guardado', 'Las imágenes se guardaron correctamente.', 'success');
      closeImagesModal();
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudieron guardar las imágenes.', 'error');
    } finally {
      setSavingImages(false);
    }
  };

  const generateOrderPdfDoc = async (order) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const terminos = [
      '1) Mecanica no se responsabiliza en caso el equipo presente daños por mal uso de terceros o a nivel software y/o hardware antes de su ingreso a reparación.',
      '2) El cliente acepta pagar todas las piezas y mano de obra al finalizar la reparación.',
      '3) La fecha estimada de finalización está sujeta a cambios según la disponibilidad de piezas.',
      '4) El taller de reparación no es responsable de ninguna pérdida de datos en equipos electrónicos.',
      '5) Si la reparación requiere trabajos y/o piezas que no se hayan especificado anteriormente, Mecanica indicará un presupuesto actualizado.',
      '6) Una vez notificado, el equipo se almacena sin coste 10 días hábiles. Después, aplica cargo por almacenamiento.',
      '7) De considerarse abandonado, Mecanica podrá tomar propiedad del equipo en compensación de costos de almacenamiento.',
      '8) La garantía sobre reparaciones es válida solo en mano de obra a partir de la fecha de finalización.',
    ];

    const statusKey = order.status || order.estado || 'pendiente';
    const statusLabel = getEstado(statusKey)?.label || statusKey;
    const details = order.description || order.detalles || order.observaciones || 'No especificado';
    const total = typeof order.resumen?.total === 'number' ? `$${order.resumen.total.toFixed(2)}` : '$0.00';

    const C = {
      primary: '#1a3a5e', primaryMid: '#162f50', primaryDark: '#0f2440',
      primaryLight: '#2e5f9e', accent: '#4a90d9', white: '#FFFFFF',
      offWhite: '#F7FAFC', border: '#CBD5E0', labelGray: '#6b7a99',
      bodyText: '#1A202C', mutedText: '#a8c4e0', mutedText2: '#6a8faf', subtleBlue: '#eef2f7',
    };

    const rgb = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const setFill   = (hex) => doc.setFillColor(...rgb(hex));
    const setStroke = (hex) => doc.setDrawColor(...rgb(hex));
    const setTxt    = (hex) => doc.setTextColor(...rgb(hex));
    const fillRect  = (x,y,w,h,c) => { setFill(c); doc.rect(x,y,w,h,'F'); };
    const fillRR    = (x,y,w,h,r,c) => { setFill(c); doc.roundedRect(x,y,w,h,r,r,'F'); };
    const strokeRR  = (x,y,w,h,r,c,lw=0.5) => { setStroke(c); doc.setLineWidth(lw); doc.roundedRect(x,y,w,h,r,r,'S'); };

    const getLogoBase64 = (src) => new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const logoBase64 = await getLogoBase64('/images/logo.ico');

    fillRect(0, 0, W, H, C.offWhite);
    const hdrH = 100;
    fillRect(0, 0, W, hdrH, C.primary);
    fillRect(0, 0, W, 3, C.primaryLight);
    fillRect(0, 0, 88, hdrH, C.primaryMid);
    fillRect(88, 0, 1.5, hdrH, C.primaryLight);
    fillRect(0, hdrH - 4, W, 4, C.primaryDark);
    fillRect(0, hdrH - 2, W, 2, C.primaryLight);
    if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 20, 58, 58);

    const txtX = 104;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setTxt(C.white);
    doc.text('Ingeniería y Telecomunicaciones', txtX, 42);
    fillRect(txtX, 46, 248, 1.5, C.accent);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setTxt(C.mutedText);
    doc.text('Mecanica  ·  Soluciones Tecnológicas Integrales', txtX, 60);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setTxt(C.mutedText2);
    doc.text('Blvd. Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chis.', txtX, 74);
    doc.text('Tel: 961 118 0157   ·   WhatsApp: 961 333 6529', txtX, 85);

    const tagW = 148, tagH = 64, tagX = W - tagW - 24, tagY = 17;
    fillRR(tagX, tagY, tagW, tagH, 5, C.primary);
    setStroke(C.primaryLight); doc.setLineWidth(1.1);
    doc.roundedRect(tagX, tagY, tagW, tagH, 5, 5, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setTxt(C.white);
    doc.text('ORDEN DE SERVICIO', tagX + tagW / 2, tagY + 15, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(19); setTxt(C.white);
    doc.text(String(order.folio || '—'), tagX + tagW / 2, tagY + 50, { align: 'center' });
    setStroke(C.primaryLight); doc.setLineWidth(0.5);
    doc.line(tagX + 16, tagY + 57, tagX + tagW - 16, tagY + 57);

    const subY = hdrH + 8, subH = 46;
    fillRR(18, subY, W - 36, subH, 5, C.white);
    strokeRR(18, subY, W - 36, subH, 5, C.border, 0.5);
    const fechaFmt = String(order.fecha || '').includes('-') ? String(order.fecha).split('-').reverse().join('/') : (order.fecha || '—');

    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
    doc.text('FOLIO', 34, subY + 15);
    doc.setFont('helvetica','bold'); doc.setFontSize(14); setTxt(C.primary);
    doc.text(String(order.folio || '—'), 34, subY + 34);
    setStroke(C.border); doc.setLineWidth(0.5);
    doc.line(132, subY + 9, 132, subY + subH - 9);
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
    doc.text('FECHA DE INGRESO', 146, subY + 15);
    doc.setFont('helvetica','normal'); doc.setFontSize(10.5); setTxt(C.bodyText);
    doc.text(fechaFmt, 146, subY + 33);
    doc.line(W / 2 + 10, subY + 9, W / 2 + 10, subY + subH - 9);
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.labelGray);
    doc.text('ESTADO DE LA ORDEN', W / 2 + 24, subY + 15);
    const pillX = W / 2 + 24, pillY = subY + 20, pillW = 120, pillH = 18;
    fillRR(pillX, pillY, pillW, pillH, 9, C.subtleBlue);
    strokeRR(pillX, pillY, pillW, pillH, 9, C.primary, 0.7);
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); setTxt(C.primary);
    doc.text(statusLabel.toUpperCase(), pillX + pillW / 2, pillY + 12, { align: 'center' });

    const mx = 18, cw = W - mx * 2;
    let y = subY + subH + 14;
    const gap = 6;

    const sectionHeader = (label, sx, sy, sw) => {
      fillRR(sx, sy, sw, 21, 4, C.primary);
      fillRR(sx, sy, 5, 21, 2, C.accent);
      doc.setFont('helvetica','bold'); doc.setFontSize(8); setTxt(C.white);
      doc.text(label.toUpperCase(), sx + 15, sy + 14);
      return sy + 21;
    };

    const fieldCell = (label, value, fx, fy, fw, fh = 33) => {
      fillRR(fx, fy, fw, fh, 4, C.white);
      strokeRR(fx, fy, fw, fh, 4, C.border, 0.4);
      fillRR(fx, fy, fw, 2.5, 1, C.accent + '55');
      doc.setFont('helvetica','bold'); doc.setFontSize(6); setTxt(C.labelGray);
      doc.text(label.toUpperCase(), fx + 8, fy + 12);
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
      const lines = doc.splitTextToSize(String(value || '—'), fw - 16);
      doc.text(lines[0] || '—', fx + 8, fy + 25);
    };

    const drawFooter = (pageNum, totalPages) => {
      fillRect(0, H - 42, W, 42, C.primary);
      fillRect(0, H - 42, W, 2, C.primaryLight);
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); setTxt(C.mutedText);
      doc.text('Boulevard Belisario Domínguez #4213 L5, Fracc. La Gloria, Tuxtla Gutiérrez, Chiapas', W / 2, H - 22, { align: 'center' });
      doc.text('Tel: 961 118 0157  ·  WhatsApp: 961 333 6529  ·  Mecanica Ingeniería y Telecomunicaciones', W / 2, H - 10, { align: 'center' });
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setTxt(C.mutedText);
      doc.text(`Pág. ${pageNum} / ${totalPages}`, W - 28, H - 14, { align: 'right' });
    };

    const drawSignatures = (yStart) => {
      const bW = 220, bH = 78, gapSig = 18, leftX = 34, rightX = leftX + bW + gapSig;
      setStroke(C.border); doc.setLineWidth(0.6);
      fillRR(leftX, yStart, bW, bH, 6, C.offWhite);
      doc.roundedRect(leftX, yStart, bW, bH, 6, 6, 'S');
      if (order.firma) {
        try { doc.addImage(order.firma, 'PNG', leftX + 10, yStart + 8, bW - 20, 36); } catch (_) {}
      }
      setStroke(C.primary); doc.line(leftX + 12, yStart + 50, leftX + bW - 12, yStart + 50);
      doc.setFont('helvetica','bold'); doc.setFontSize(7); setTxt(C.primary);
      doc.text('FIRMA DEL CLIENTE', leftX + bW / 2, yStart + 60, { align: 'center' });
      doc.setFont('helvetica','normal'); doc.setFontSize(7); setTxt(C.bodyText);
      doc.text(order.clientName || '', leftX + bW / 2, yStart + 69, { align: 'center' });
      fillRR(rightX, yStart, bW, bH, 6, C.offWhite);
      setStroke(C.border); doc.roundedRect(rightX, yStart, bW, bH, 6, 6, 'S');
      setStroke(C.primary); doc.line(rightX + 12, yStart + 50, rightX + bW - 12, yStart + 50);
      doc.setFont('helvetica','bold'); doc.setFontSize(7); setTxt(C.primary);
      doc.text('FIRMA DEL TÉCNICO', rightX + bW / 2, yStart + 60, { align: 'center' });
      doc.setFont('helvetica','normal'); doc.setFontSize(7); setTxt(C.bodyText);
      doc.text(order.tecnico || '', rightX + bW / 2, yStart + 69, { align: 'center' });
    };

    y = sectionHeader('Información del Cliente', mx, y, cw); y += 7;
    const col3 = (cw - gap * 2) / 3;
    fieldCell('Nombre Completo', order.clientName || '—', mx, y, col3);
    fieldCell('Teléfono', order.telefono || '—', mx + col3 + gap, y, col3);
    fieldCell('Correo Electrónico', order.correo || '—', mx + col3 * 2 + gap * 2, y, col3);
    y += 44;

    y = sectionHeader('Información del Equipo', mx, y, cw); y += 7;
    const col4 = (cw - gap * 3) / 4;
    fieldCell('Tipo de Equipo', order.tipo || '—', mx, y, col4);
    fieldCell('Marca', order.marca || '—', mx + col4 + gap, y, col4);
    fieldCell('Modelo', order.modelo || '—', mx + col4 * 2 + gap * 2, y, col4);
    fieldCell('Núm. de Serie', order.serie || '—', mx + col4 * 3 + gap * 3, y, col4);
    y += 44;

    y = sectionHeader('Accesorios y Seguridad', mx, y, cw); y += 7;
    const half = (cw - gap) / 2;
    const accs = [order.accesorios, order.otrosAccesorios].filter(Boolean).join(', ') || 'Sin accesorios marcados';
    fieldCell('Accesorios Incluidos', accs, mx, y, half);
    fieldCell('Contraseña / PIN', order.seguridad || '—', mx + half + gap, y, half);
    y += 44;

    y = sectionHeader('Descripción del Problema Reportado', mx, y, cw); y += 7;
    const probLines = doc.splitTextToSize(String(details), cw - 24);
    const probH = Math.max(50, probLines.length * 13 + 24);
    fillRR(mx, y, cw, probH, 4, C.white);
    strokeRR(mx, y, cw, probH, 4, C.border, 0.4);
    fillRR(mx, y, cw, 2.5, 1, C.accent + '55');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setTxt(C.bodyText);
    doc.text(probLines, mx + 10, y + 17);
    y += probH + 14;

    y = sectionHeader('Asignación y Resumen Económico', mx, y, cw); y += 7;
    const col3b = (cw - gap * 2) / 3;
    fieldCell('Técnico Responsable', order.tecnico || '—', mx, y, col3b);
    fieldCell('Estado de la Orden', statusLabel || '—', mx + col3b + gap, y, col3b);
    const totX = mx + col3b * 2 + gap * 2, totW = col3b;
    fillRR(totX, y, totW, 33, 4, C.primary);
    strokeRR(totX, y, totW, 33, 4, C.primaryLight, 0.8);
    doc.setFont('helvetica','bold'); doc.setFontSize(6); setTxt(C.mutedText);
    doc.text('TOTAL', totX + 8, y + 12);
    doc.setFont('helvetica','bold'); doc.setFontSize(14); setTxt(C.white);
    doc.text(total, totX + totW / 2, y + 27, { align: 'center' });

    drawFooter(1, 2);
    doc.addPage();
    fillRect(0, 0, W, H, C.offWhite);
    fillRR(20, 20, W - 40, H - 40, 8, C.white);

    let ty = 40;
    ty = sectionHeader('Términos y Condiciones del Servicio', 34, ty, W - 68);
    ty += 10;
    doc.setFont('helvetica','italic'); doc.setFontSize(8); setTxt(C.labelGray);
    doc.text('Por favor lea cuidadosamente los siguientes términos antes de firmar la orden de servicio.', 38, ty);
    ty += 16;

    terminos.forEach((t, i) => {
      const lines = doc.splitTextToSize(t, W - 100);
      const rowH = lines.length * 11 + 10;
      fillRR(34, ty, W - 68, rowH, 3, i % 2 === 0 ? C.offWhite : C.white);
      setFill(C.primary); doc.rect(34, ty, 3, rowH, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(8); setTxt(C.bodyText);
      doc.text(lines, 46, ty + 9);
      ty += rowH + 4;
    });

    ty += 14;
    setStroke(C.border); doc.setLineWidth(0.6);
    doc.line(34, ty, W - 34, ty);
    ty += 16;
    ty = sectionHeader('Firmas y Aceptación', 34, ty, W - 68);
    ty += 12;
    drawSignatures(ty);
    drawFooter(2, 2);

    return doc;
  };

  const handlePreviewPdf = async (order) => {
    const doc = await sharedGenerateOrderPdfDoc(order);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async (order) => {
    const doc = await sharedGenerateOrderPdfDoc(order);
    doc.save(`Orden_${order.folio || 'servicio'}.pdf`);
  };

  React.useEffect(() => {
    let navContext = null;
    try { navContext = JSON.parse(sessionStorage.getItem(ORDERS_NAV_CONTEXT_KEY) || 'null'); } catch (_) {}
    if (navContext?.folio) setHighlightedFolio(navContext.folio);

    fetch('/api/orders?excludeForeign=true')
      .then(res => res.json())
      .then(data => {
        const parsed = data.map(o => {
          let resumen = o.resumen;
          if (typeof resumen === 'string') { try { resumen = JSON.parse(resumen); } catch (e) { resumen = {}; } }
          return { ...o, resumen, imagenes: parseImagenes(o.imagenes) };
        });
        let filtered = parsed.filter(o => {
          const tipo = String(o.tipo || '').toLowerCase();
          return tipo !== 'foraneo' && tipo !== 'cliente';
        });
        if (normalizedRole === 'tecnico' && currentUserName) {
          filtered = filtered.filter(o => o.tecnico === currentUserName);
        }
        setOrders(filtered);
      })
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las órdenes', 'error'));

    fetch('/api/technicians')
      .then(res => res.json())
      .then(data => setAllTechnicians(data))
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los técnicos', 'error'));
  }, [normalizedRole, currentUserName]);

  React.useEffect(() => {
    if (hasRestoredScrollRef.current || orders.length === 0) return;
    let navContext = null;
    try { navContext = JSON.parse(sessionStorage.getItem(ORDERS_NAV_CONTEXT_KEY) || 'null'); } catch (_) {}
    if (!navContext) return;
    hasRestoredScrollRef.current = true;
    const restoreScroll = () => {
      const scrollContainer = getDashboardScrollContainer();
      if (scrollContainer && typeof navContext.containerScrollTop === 'number') scrollContainer.scrollTop = navContext.containerScrollTop;
      if (typeof navContext.windowY === 'number') window.scrollTo({ top: navContext.windowY, behavior: 'auto' });
      if (typeof navContext.docY === 'number') { document.documentElement.scrollTop = navContext.docY; document.body.scrollTop = navContext.docY; }
    };
    requestAnimationFrame(() => requestAnimationFrame(() => restoreScroll()));
    const retry1 = setTimeout(restoreScroll, 80);
    const retry2 = setTimeout(restoreScroll, 220);
    const retry3 = setTimeout(restoreScroll, 450);
    const clearContextTimer = setTimeout(() => { try { sessionStorage.removeItem(ORDERS_NAV_CONTEXT_KEY); } catch (_) {} }, 2200);
    return () => { clearTimeout(retry1); clearTimeout(retry2); clearTimeout(retry3); clearTimeout(clearContextTimer); };
  }, [orders]);

  React.useEffect(() => {
    if (!highlightedFolio) return;
    const timer = setTimeout(() => setHighlightedFolio(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightedFolio]);

  const tecnicos = Array.from(new Set(orders.map(o => o.tecnico)));

  const filtered = orders
    .filter(o => {
      const equipoStr = [o.marca, o.modelo, o.serie].filter(Boolean).join(' ').toLowerCase();
      const matchSearch =
        !search ||
        o.folio?.toLowerCase().includes(search.toLowerCase()) ||
        o.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        equipoStr.includes(search.toLowerCase());
      let estadoKey = '';
      for (const [key, value] of Object.entries(ESTADOS)) {
        if (key === key.toLowerCase() && value.label === (getEstado(o.status || o.estado)?.label)) { estadoKey = key; break; }
      }
      const matchEstado = !estado || estadoKey === estado;
      const matchTecnico = !tecnico || o.tecnico === tecnico;
      if (normalizedRole === 'tecnico') return matchSearch && matchEstado && o.tecnico === currentUserName;
      return matchSearch && matchEstado && matchTecnico;
    })
    .sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });

  // ── Estilos de la tabla y controles ──────────────────────────────────────
  const inputStyle = {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #E2E8EF',
    background: '#fff',
    fontSize: 14,
    color: '#1B2A3B',
    outline: 'none',
    fontFamily: 'sans-serif',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <DashboardLayout>
      <style>{`
        .orders-root { font-family: sans-serif; }
        .orders-title { font-size: 22px; font-weight: 800; color: #1B2A3B; margin: 0; letter-spacing: -0.2px; }
        .orders-sub { font-size: 13px; color: #6B7F93; margin: 4px 0 0; }
        .btn-nueva-orden {
          padding: 10px 22px; border-radius: 8px;
          background: #E8500A; color: #fff;
          font-size: 14px; font-weight: 700; border: none;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          white-space: nowrap; letter-spacing: 0.3px;
        }
        .btn-nueva-orden:hover { background: #c94308; transform: translateY(-1px); }

        /* Tabla */
        .orders-table-wrap {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #E2E8EF;
          overflow-x: auto;
        }
        .orders-table { min-width: 100%; border-collapse: collapse; font-size: 13px; }
        .orders-table thead tr {
          background: #1B2A3B;
        }
        .orders-table thead th {
          padding: 13px 14px;
          color: #fff;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.5px;
          text-align: left;
          white-space: nowrap;
          border: none;
        }
        .orders-table thead th:first-child { border-radius: 11px 0 0 0; }
        .orders-table thead th:last-child  { border-radius: 0 11px 0 0; }

        .orders-table tbody tr {
          border-bottom: 1px solid #F4F6F8;
          transition: background 0.15s;
        }
        .orders-table tbody tr:last-child { border-bottom: none; }
        .orders-table tbody tr:hover { background: #F4F6F8; }
        .orders-table tbody tr.highlighted { outline: 2px solid #F4A63A; outline-offset: -2px; }

        .orders-table td { padding: 13px 14px; color: #1B2A3B; vertical-align: middle; }

        .td-folio { font-family: monospace; font-weight: 700; color: #E8500A; font-size: 14px; }
        .td-fecha { color: #6B7F93; display: flex; align-items: center; gap: 6px; }
        .td-cliente { font-weight: 600; }
        .td-total  { font-weight: 700; }
        .td-empty  { text-align: center; color: #6B7F93; padding: 40px 0; }

        /* Botones de acción */
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          border: none; cursor: pointer;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .action-btn svg { width: 16px; height: 16px; }

        .btn-ver    { background: rgba(27,42,59,0.08);  color: #1B2A3B; }
        .btn-ver:hover    { background: #1B2A3B; color: #fff; }
        .btn-pdf    { background: rgba(232,80,10,0.1);  color: #E8500A; }
        .btn-pdf:hover    { background: #E8500A; color: #fff; }
        .btn-img    { background: rgba(39,201,63,0.1);  color: #155724; }
        .btn-img:hover    { background: #27C93F; color: #fff; }
        .btn-cancel { background: rgba(163,45,45,0.1);  color: #A32D2D; }
        .btn-cancel:hover { background: #A32D2D; color: #fff; }
        .btn-del    { background: rgba(107,127,147,0.1);color: #6B7F93; }
        .btn-del:hover    { background: #6B7F93; color: #fff; }

        /* Selects dentro de tabla */
        .table-select {
          padding: 4px 10px; border-radius: 20px;
          border: 1px solid #E2E8EF;
          font-size: 11px; font-weight: 600;
          background: #F4F6F8; color: #1B2A3B;
          outline: none; cursor: pointer;
        }
        .table-select:focus { border-color: #E8500A; }

        /* Modales */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(27,42,59,0.55);
        }
        .modal-box {
          background: #fff; border-radius: 14px;
          padding: 28px 28px 24px;
          width: 100%; box-shadow: 0 20px 60px rgba(27,42,59,0.25);
        }
        .modal-title { font-size: 18px; font-weight: 800; margin: 0 0 6px; }
        .modal-sub   { font-size: 13px; color: #6B7F93; margin: 0 0 18px; }
        .modal-textarea {
          width: 100%; min-height: 80px; border-radius: 8px;
          border: 1px solid #E2E8EF; padding: 12px;
          font-size: 14px; outline: none; resize: vertical;
          font-family: sans-serif; box-sizing: border-box;
        }
        .modal-textarea:focus { border-color: #E8500A; }
        .modal-input {
          width: 100%; border-radius: 8px;
          border: 1px solid #E2E8EF; padding: 11px 14px;
          font-size: 15px; outline: none;
          font-family: sans-serif; box-sizing: border-box;
          margin-bottom: 16px;
        }
        .modal-input:focus { border-color: #2E4460; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
        .btn-modal-cancel {
          padding: 9px 18px; border-radius: 8px;
          background: #F4F6F8; color: #6B7F93;
          font-weight: 600; font-size: 14px; border: none; cursor: pointer;
        }
        .btn-modal-cancel:hover { background: #E2E8EF; }
        .btn-modal-confirm {
          padding: 9px 18px; border-radius: 8px;
          font-weight: 700; font-size: 14px; border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="orders-root">
        {/* Cabecera */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="orders-title">Órdenes de Servicio</h2>
              <p className="orders-sub">Gestiona todas las reparaciones</p>
            </div>
            {(isAdmin || isMostrador) && (
              <button className="btn-nueva-orden" onClick={() => navigate('/admin/orders/create')} type="button">
                + Nueva Orden
              </button>
            )}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <input
              style={{ ...inputStyle, flex: 1, minWidth: 220 }}
              placeholder="Buscar por folio, cliente, equipo o marca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={selectStyle} value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS)
                .filter(([key]) => key === key.toLowerCase())
                .map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
            </select>
            {!isTechnician && (
              <select style={selectStyle} value={tecnico} onChange={e => setTecnico(e.target.value)}>
                <option value="">Todos los técnicos</option>
                {allTechnicians.map(t => <option key={t.id} value={t.nombre || t.name}>{t.nombre || t.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="td-empty">No hay órdenes que coincidan.</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.folio} className={highlightedFolio === o.folio ? 'highlighted' : ''}>

                  <td className="td-folio">{o.folio}</td>

                  <td>
                    <span className="td-fecha">
                      <svg width="14" height="14" fill="none" stroke="#6B7F93" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {o.fecha}
                    </span>
                  </td>

                  <td className="td-cliente">{o.clientName}</td>

                  <td style={{ color: '#2E4460' }}>{[o.marca, o.modelo, o.serie].filter(Boolean).join(' ')}</td>

                  <td>
                    {!isAdmin || ['cancelada', 'eliminada'].includes(o.status || o.estado) ? (
                      <span style={{ color: '#2E4460', fontWeight: 600 }}>{o.tecnico}</span>
                    ) : (
                      <select
                        className="table-select"
                        value={o.tecnico}
                        onChange={async e => {
                          const newTecnico = e.target.value;
                          const selected = allTechnicians.find(t => (t.nombre || t.name) === newTecnico);
                          if (!selected) return;
                          setOrders(prev => prev.map(ord => ord.folio === o.folio ? { ...ord, tecnico: newTecnico } : ord));
                          try {
                            await fetch(`/api/orders/${o.folio}/tecnico`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ technicianId: selected.id })
                            });
                          } catch (err) {
                            Swal.fire('Error', 'No se pudo actualizar el técnico en el servidor', 'error');
                          }
                        }}
                      >
                        {allTechnicians.map(t => <option key={t.id} value={t.nombre || t.name}>{t.nombre || t.name}</option>)}
                      </select>
                    )}
                  </td>

                  <td>
                    {!isAdmin ? (
                      getEstado(o.status || o.estado)
                        ? <PillEstado status={o.status || o.estado} />
                        : <PillEstado status="desconocido" />
                    ) : ['cancelada', 'eliminada'].includes(o.status || o.estado) ? (
                      getEstado(o.status || o.estado)
                        ? <PillEstado status={o.status || o.estado} />
                        : <PillEstado status="desconocido" />
                    ) : (
                      <select
                        className="table-select"
                        value={o.status || o.estado}
                        style={{
                          background: PILL_CFG[String(o.status || o.estado).toLowerCase()]?.bg || '#E2E8EF',
                          color: PILL_CFG[String(o.status || o.estado).toLowerCase()]?.color || '#1B2A3B',
                        }}
                        onChange={async e => {
                          const newEstado = e.target.value;
                          if (newEstado === 'entregada') {
                            setEntregaOrderFolio(o.folio);
                          } else {
                            setOrders(prev => prev.map(ord => ord.folio === o.folio ? { ...ord, status: newEstado, estado: newEstado } : ord));
                            try {
                              await fetch(`/api/orders/${o.folio}/estado`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ estado: newEstado })
                              });
                            } catch (err) {
                              Swal.fire('Error', 'No se pudo guardar el estado en el servidor', 'error');
                            }
                          }
                        }}
                      >
                        {Object.entries(ESTADOS)
                          .filter(([key]) => key === key.toLowerCase())
                          .filter(([key]) => key !== 'cancelada' && key !== 'eliminada')
                          .map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                      </select>
                    )}
                  </td>

                  <td className="td-total">
                    {typeof o.resumen?.total === 'number' ? `$${o.resumen.total.toFixed(2)}` : '$0.00'}
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="action-btn btn-ver"
                        title={isAdmin || isMostrador ? 'Ver detalle' : 'Ver PDF'}
                        onClick={() => (isAdmin || isMostrador ? handleOpenOrderDetail(o.folio) : handlePreviewPdf(o))}
                      >
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="action-btn btn-pdf" title="Descargar PDF" onClick={() => handleDownloadPdf(o)}>
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12" />
                        </svg>
                      </button>
                      <button className="action-btn btn-img" title="Subir/Tomar imágenes" onClick={() => openImagesModal(o)}>
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3l1.2-1.4A2 2 0 0110.7 3h2.6a2 2 0 011.5.6L16 5h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <>
                          {(o.status || o.estado) === 'cancelada' ? (
                            <button className="action-btn btn-del" title="Eliminar" onClick={() => {
                              Swal.fire({
                                title: '¿Estás seguro?',
                                text: 'Esta acción eliminará la orden de forma permanente.',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#A32D2D',
                                cancelButtonColor: '#2E4460',
                                confirmButtonText: 'Sí, eliminar',
                                cancelButtonText: 'Cancelar',
                              }).then(async (result) => {
                                if (result.isConfirmed) {
                                  try {
                                    const res = await fetch(`/api/orders/${o.folio}`, { method: 'DELETE' });
                                    if (!res.ok) throw new Error('No se pudo eliminar');
                                    setOrders(prev => prev.filter(ord => ord.folio !== o.folio));
                                    Swal.fire('Eliminada', 'La orden ha sido eliminada.', 'success');
                                  } catch (err) {
                                    Swal.fire('Error', 'No se pudo eliminar la orden en el servidor', 'error');
                                  }
                                }
                              });
                            }}>
                              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 4h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                              </svg>
                            </button>
                          ) : (o.status || o.estado) === 'eliminada' ? null : (
                            <button className="action-btn btn-cancel" title="Cancelar" onClick={() => setCancelOrderFolio(o.folio)}>
                              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal cancelación */}
      {cancelOrderFolio !== null && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <h3 className="modal-title" style={{ color: '#A32D2D' }}>Cancelar orden</h3>
            <p className="modal-sub">Por favor, indica el motivo de la cancelación:</p>
            <textarea
              className="modal-textarea"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación..."
            />
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => { setCancelOrderFolio(null); setCancelReason(''); }}>Cancelar</button>
              <button
                className="btn-modal-confirm"
                style={{ background: '#A32D2D', color: '#fff' }}
                disabled={!cancelReason.trim()}
                onClick={async () => {
                  try {
                    await fetch(`/api/orders/${cancelOrderFolio}/estado`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado: 'cancelada' })
                    });
                    setOrders(prev => prev.map(ord => ord.folio === cancelOrderFolio ? { ...ord, status: 'cancelada', estado: 'cancelada', motivoCancelacion: cancelReason } : ord));
                    setCancelOrderFolio(null);
                    setCancelReason('');
                  } catch (err) {
                    Swal.fire('Error', 'No se pudo cancelar la orden en el servidor', 'error');
                  }
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal entrega */}
      {entregaOrderFolio !== null && (
        <div className="modal-overlay" style={{ touchAction: 'none' }}>
          <div className="modal-box" style={{ maxWidth: 700 }}>
            <h3 className="modal-title" style={{ color: '#2E4460' }}>Entregar orden</h3>
            <p className="modal-sub">Por favor, escribe el nombre de la persona que recibe y firma abajo:</p>
            <input
              className="modal-input"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              placeholder="Nombre de quien recibe..."
            />
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#2E4460' }}>Firma:</label>
              <div style={{ border: '1px solid #E2E8EF', borderRadius: 10, padding: 16, background: '#F4F6F8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SignaturePadCanvas
                  ref={signaturePadRef}
                  width={600}
                  height={220}
                  style={{ touchAction: 'none', maxWidth: '100%', height: '220px', borderRadius: 10, background: 'white', border: '1px solid #E2E8EF' }}
                  onEnd={() => {
                    const canvas = signaturePadRef.current.getTrimmedCanvas();
                    setSignatureData(canvas.toDataURL());
                  }}
                />
                <button
                  style={{ marginTop: 12, padding: '7px 18px', borderRadius: 7, background: '#E2E8EF', color: '#2E4460', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}
                  onClick={() => { signaturePadRef.current.clear(); setSignatureData(null); }}
                >
                  Limpiar firma
                </button>
                <span style={{ fontSize: 11, color: '#6B7F93', marginTop: 8 }}>Usa tu dedo o stylus para firmar. Si te equivocas, puedes limpiar y volver a intentar.</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => {
                setEntregaOrderFolio(null); setRecipientName(''); setSignatureData(null);
                if (signaturePadRef.current) signaturePadRef.current.clear();
              }}>Cancelar</button>
              <button
                className="btn-modal-confirm"
                style={{ background: '#2E4460', color: '#fff' }}
                disabled={!recipientName.trim() || !signatureData}
                onClick={async () => {
                  try {
                    await fetch(`/api/orders/${entregaOrderFolio}/estado`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado: 'entregada' })
                    });
                    setOrders(prev => prev.map(ord => ord.folio === entregaOrderFolio ? { ...ord, status: 'entregada', estado: 'entregada', nombreEntrega: recipientName, firmaEntrega: signatureData } : ord));
                    setEntregaOrderFolio(null); setRecipientName(''); setSignatureData(null);
                    if (signaturePadRef.current) signaturePadRef.current.clear();
                  } catch (err) {
                    Swal.fire('Error', 'No se pudo registrar la entrega en el servidor', 'error');
                  }
                }}
              >
                Confirmar entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal imágenes */}
      {imageOrder && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <h3 className="modal-title" style={{ color: '#155724' }}>Evidencia fotográfica — Orden {imageOrder.folio}</h3>
            <p className="modal-sub">Puedes subir o tomar fotos con cámara. Máximo 2 imágenes por orden.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <label style={{ padding: '11px 14px', borderRadius: 8, border: '1px solid #E2E8EF', background: '#F4F6F8', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', color: '#2E4460' }}>
                Subir desde galería
                <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
              </label>
              <label style={{ padding: '11px 14px', borderRadius: 8, border: '1px solid #E2E8EF', background: '#F4F6F8', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', color: '#2E4460' }}>
                Tomar foto con cámara
                <input type="file" accept="image/*" capture="environment" onChange={handleAddImages} style={{ display: 'none' }} />
              </label>
            </div>
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                {existingImages.map((img, idx) => (
                  <div key={`old-${idx}`} style={{ position: 'relative' }}>
                    <img src={img} alt={`Evidencia ${idx + 1}`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8EF' }} />
                    <button type="button" onClick={() => removeExistingImage(idx)} style={{ position: 'absolute', top: 4, right: 4, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
                {newImagePreviews.map((preview, idx) => (
                  <div key={`new-${idx}`} style={{ position: 'relative' }}>
                    <img src={preview} alt={`Nueva evidencia ${idx + 1}`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #D4EDDA' }} />
                    <button type="button" onClick={() => removeNewImage(idx)} style={{ position: 'absolute', top: 4, right: 4, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={closeImagesModal} disabled={savingImages}>Cancelar</button>
              <button
                className="btn-modal-confirm"
                style={{ background: '#27C93F', color: '#fff' }}
                onClick={handleSaveImages}
                disabled={savingImages}
              >
                {savingImages ? 'Guardando...' : 'Guardar imágenes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Orders;