import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';
import { generateQuotePdfDoc } from '../utils/quotesPdf';

const statusOptions = ['Borrador', 'Pendiente', 'Aprobado', 'Cancelada'];

const STATUS_STYLES = {
  Aprobado:  'bg-[#D4EDDA] text-[#1a5c2e]',
  Pendiente: 'bg-[#FFF3CD] text-[#7c5a00]',
  Borrador:  'bg-[#E2E8EF] text-[#2E4460]',
  Cancelada: 'bg-[#F8D7DA] text-[#7b1e24]',
};

const unitOptions = [
  'PZA', 'SERVICIO', 'Lote', 'Juego', 'Kit', 'Paquete', 'Caja', 'Bolsa',
  'Rollo', 'Metro', 'Metro lineal', 'Metro cuadrado', 'Metro cúbico',
  'Centímetro', 'Centímetro cuadrado', 'Centímetro cúbico', 'Milímetro',
  'Kilogramo', 'Gramo', 'Litro', 'Mililitro', 'Hora', 'Minuto', 'Día',
  'Semana', 'Mes', 'Año', 'Par', 'Docena', 'Tonelada', 'Tarro', 'Tambor',
  'Bulto', 'Envase', 'Botella', 'Saco', 'Caja chica', 'Caja grande', 'Unidad',
];

const initialProductForm = {
  descripcion: '',
  observaciones: '',
  unidad: '',
  precioUnitario: '',
};

export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productValidationAttempted, setProductValidationAttempted] = useState(false);
  const [emisorFilter, setEmisorFilter] = useState('sinar');
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';

  const isEmpty = (value) => String(value ?? '').trim() === '';

  const toggleEmisorFilter = () => {
    setEmisorFilter(prev => (prev === 'sinar' ? 'sieeg' : 'sinar'));
  };

  const filteredQuotes = quotes.filter(quote => {
    const emisor = String(quote?.emisor || '').toLowerCase().trim();
    return emisorFilter === 'sinar' ? emisor === 'sinar' : emisor === 'sieeg';
  });

  const handleOpenProductModal = () => {
    setProductForm(initialProductForm);
    setProductValidationAttempted(false);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setProductForm(initialProductForm);
    setProductValidationAttempted(false);
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setProductValidationAttempted(true);

    if (Object.values(productForm).some(isEmpty)) {
      await Swal.fire({
        title: 'Faltan datos obligatorios',
        text: 'Completa descripción, observaciones, unidad y precio unitario.',
        icon: 'warning',
      });
      return;
    }

    const normalizedProduct = {
      cantidad: 1,
      descripcion: productForm.descripcion.trim(),
      observaciones: productForm.observaciones.trim(),
      unidad: productForm.unidad,
      precioUnitario: Number(productForm.precioUnitario),
      importe: Number(productForm.precioUnitario),
    };

    setShowProductModal(false);
    navigate('/admin/quotes/create', { state: { preloadedPartida: normalizedProduct } });
  };

  const handleDeleteQuote = async (quote) => {
    if (normalizedRole === 'cotizador') {
      await Swal.fire('Permisos insuficientes', 'No puedes eliminar cotizaciones con el rol Cotizador.', 'warning');
      return;
    }
    try {
      const result = await Swal.fire({
        title: '¿Eliminar cotización?',
        text: `Se eliminará ${quote.numeroCotizacion}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!result.isConfirmed) return;

      const response = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo eliminar la cotización');

      setQuotes(prev => prev.filter(item => item.id !== quote.id));
      await Swal.fire('Eliminada', 'La cotización fue eliminada correctamente.', 'success');
    } catch (error) {
      await Swal.fire('Error', error.message || 'No se pudo eliminar la cotización', 'error');
    }
  };

  const handleDownloadPDF = async (quote) => {
    try {
      const doc = await generateQuotePdfDoc(quote);
      doc.save(`Cotizacion_${quote.numeroCotizacion}.pdf`);
    } catch {
      await Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const handleStatusChange = async (quote, nextStatus) => {
    if (!nextStatus || nextStatus === quote.status) return;
    const previousStatus = quote.status;
    setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, status: nextStatus } : item)));

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo actualizar el estado');

      const savedQuote = data?.quote || data;
      setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, ...savedQuote } : item)));
      await Swal.fire('Estado actualizado', 'El estado de la cotización se guardó correctamente.', 'success');
    } catch (error) {
      setQuotes(prev => prev.map(item => (item.id === quote.id ? { ...item, status: previousStatus } : item)));
      await Swal.fire('Error', error.message || 'No se pudo actualizar el estado', 'error');
    }
  };

  useEffect(() => {
    let active = true;
    const loadQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'No se pudieron cargar las cotizaciones');
        if (active) { setQuotes(Array.isArray(data) ? data : []); setError(''); }
      } catch (loadError) {
        if (active) { setQuotes([]); setError(loadError.message || 'No se pudieron cargar las cotizaciones'); }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadQuotes();
    return () => { active = false; };
  }, []);

  return (
    <DashboardLayout>
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1B2A3B] flex items-center justify-center shrink-0">
            {/* ícono de documento */}
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-4H7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B2A3B] leading-tight">
              Cotizaciones
            </h2>
            <p className="text-xs text-gray-500 leading-none mt-0.5">
              {emisorFilter === 'sinar' ? 'Persona física' : 'Mecánica'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Toggle emisor */}
          <button
            onClick={toggleEmisorFilter}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E4460] text-white text-sm font-medium hover:bg-[#1B2A3B] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {emisorFilter === 'sinar' ? 'Persona física' : 'Mecánica'}
          </button>

          {/* Nueva cotización */}
          {normalizedRole !== 'cotizador' && (
            <button
              onClick={() => navigate('/admin/quotes/create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva cotización
            </button>
          )}

          {/* Ver productos */}
          {normalizedRole !== 'cotizador' && (
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2E4460]/30 bg-white text-[#2E4460] text-sm font-medium hover:bg-[#F4F6F8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
              Productos/servicios
            </button>
          )}
        </div>
      </div>

      {/* ── Modal alta producto ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#1B2A3B]">
              <h3 className="text-base font-semibold text-white">Alta Producto</h3>
              <p className="text-xs text-white/70 mt-0.5">Captura la partida para agregarla a una cotización.</p>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleProductSubmit}>
              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] mb-1 uppercase tracking-wide">Descripción</label>
                <input
                  name="descripcion"
                  value={productForm.descripcion}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors ${
                    productValidationAttempted && isEmpty(productForm.descripcion)
                      ? 'border-red-400'
                      : 'border-gray-200'
                  }`}
                  placeholder="Descripción del producto o servicio"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] mb-1 uppercase tracking-wide">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={productForm.observaciones}
                  onChange={handleProductChange}
                  className={`w-full min-h-[100px] px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] resize-y transition-colors ${
                    productValidationAttempted && isEmpty(productForm.observaciones)
                      ? 'border-red-400'
                      : 'border-gray-200'
                  }`}
                  placeholder="Escribe observaciones del producto o servicio"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] mb-1 uppercase tracking-wide">Unidad</label>
                <select
                  name="unidad"
                  value={productForm.unidad}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors ${
                    productValidationAttempted && isEmpty(productForm.unidad)
                      ? 'border-red-400'
                      : 'border-gray-200'
                  }`}
                >
                  <option value="">Selecciona una unidad</option>
                  {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B2A3B] mb-1 uppercase tracking-wide">Precio unitario</label>
                <input
                  name="precioUnitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.precioUnitario}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors ${
                    productValidationAttempted && isEmpty(productForm.precioUnitario)
                      ? 'border-red-400'
                      : 'border-gray-200'
                  }`}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-4 py-2.5 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
                >
                  Continuar a cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Contador de registros ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#E8500A]" />
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {filteredQuotes.length} registro{filteredQuotes.length !== 1 ? 's' : ''} encontrado{filteredQuotes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#1B2A3B] text-white">
                {['#', 'Número', 'Fecha', 'Empresa', 'Cliente', 'Total', 'Vigencia', 'Estado', 'Acciones'].map((col, i, arr) => (
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
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-12 text-sm">
                    {loading
                      ? 'Cargando cotizaciones...'
                      : error || `No hay cotizaciones de ${emisorFilter === 'sinar' ? 'Persona física' : 'Mecánica'}.`}
                  </td>
                </tr>
              )}

              {filteredQuotes.map((q, idx) => (
                <tr
                  key={q.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-[#F4F6F8] transition-colors"
                >
                  {/* # */}
                  <td className="py-3.5 px-4 font-semibold text-[#2E4460] align-middle">
                    {idx + 1}
                  </td>

                  {/* Número */}
                  <td className="py-3.5 px-4 font-mono text-xs text-gray-500 align-middle">
                    {q.numeroCotizacion}
                  </td>

                  {/* Fecha */}
                  <td className="py-3.5 px-4 align-middle text-gray-600 whitespace-nowrap">
                    {q.fecha}
                  </td>

                  {/* Empresa */}
                  <td className="py-3.5 px-4 align-middle text-[#1B2A3B] font-medium">
                    {q.empresa}
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4 align-middle text-gray-700">
                    {q.cliente}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 align-middle font-semibold text-[#1B2A3B] whitespace-nowrap">
                    ${q.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Vigencia */}
                  <td className="py-3.5 px-4 align-middle text-gray-600 whitespace-nowrap">
                    {q.vigencia} días
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 align-middle">
                    <select
                      value={q.status || 'Borrador'}
                      onChange={(e) => handleStatusChange(q, e.target.value)}
                      disabled={!isAdmin}
                      className={`px-2.5 py-1.5 rounded-lg border-0 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 transition-colors
                        ${STATUS_STYLES[q.status] || STATUS_STYLES['Borrador']}
                        ${!isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      {/* PDF */}
                      <button
                        onClick={() => handleDownloadPDF(q)}
                        title="Descargar PDF"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D4EDDA] text-[#1a5c2e] text-xs font-medium hover:bg-[#c3e6cb] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        PDF
                      </button>

                      {/* Clonar */}
                      <button
                        onClick={() => navigate('/admin/quotes/create', { state: { preloadedQuote: q } })}
                        title="Clonar"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E2E8EF] text-[#2E4460] text-xs font-medium hover:bg-[#d0d8e4] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Clonar
                      </button>

                      {/* Ver */}
                      <button
                        onClick={() => navigate(`/admin/quotes/${q.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8500A] text-white text-xs font-medium hover:bg-[#c94208] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver
                      </button>

                      {/* Eliminar (solo admin) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteQuote(q)}
                          title="Eliminar"
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
    </DashboardLayout>
  );
}