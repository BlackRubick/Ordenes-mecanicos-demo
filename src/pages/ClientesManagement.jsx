import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import DashboardLayout from '../layouts/DashboardLayout';

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#1B2A3B] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors';

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide">{label}</span>
    {children}
  </label>
);

const ClientesManagement = () => {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', correo: '', telefono: '', usuario: '', contrasena: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClientes(data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('Éxito', `Cliente ${editingId ? 'actualizado' : 'creado'} correctamente`, 'success');
        setShowModal(false);
        resetForm();
        fetchClientes();
      } else {
        Swal.fire('Error', data.error || 'Error al procesar la solicitud', 'error');
      }
    } catch {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setFormData({ nombre: cliente.nombre, correo: cliente.correo, telefono: cliente.telefono, usuario: cliente.usuario, contrasena: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E8500A',
      cancelButtonColor: '#2E4460',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) { Swal.fire('Eliminado', 'Cliente eliminado correctamente', 'success'); fetchClientes(); }
      else Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
    } catch {
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', correo: '', telefono: '', usuario: '', contrasena: '' });
    setEditingId(null);
  };

  const handleCloseModal = () => { setShowModal(false); resetForm(); };

  return (
    <DashboardLayout>
      <div className="p-0">

        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1B2A3B] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1B2A3B] leading-tight">Gestión de Clientes</h2>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Crear Cliente
          </button>
        </div>

        {/* ── Contador ── */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#E8500A]" />
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {clientes.length} registro{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Tabla ── */}
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#1B2A3B] text-white">
                  {['Nombre', 'Correo', 'Teléfono', 'Usuario', 'Estado', 'Acciones'].map((col, i, arr) => (
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
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-12 text-sm">
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-[#F4F6F8] transition-colors"
                    >
                      {/* Nombre con avatar */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#2E4460] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {cliente.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-[#1B2A3B]">{cliente.nombre}</span>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-3.5 px-4 align-middle text-gray-500 text-xs font-mono">
                        {cliente.correo}
                      </td>

                      {/* Teléfono */}
                      <td className="py-3.5 px-4 align-middle text-gray-600 whitespace-nowrap">
                        {cliente.telefono}
                      </td>

                      {/* Usuario */}
                      <td className="py-3.5 px-4 align-middle font-mono text-xs text-[#2E4460] font-semibold">
                        {cliente.usuario}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                          ${cliente.activo
                            ? 'bg-[#D4EDDA] text-[#1a5c2e]'
                            : 'bg-[#F8D7DA] text-[#7b1e24]'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cliente.activo ? 'bg-[#1a5c2e]' : 'bg-[#7b1e24]'}`} />
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E2E8EF] text-[#2E4460] text-xs font-medium hover:bg-[#d0d8e4] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8D7DA] text-[#7b1e24] text-xs font-medium hover:bg-[#f5c6cb] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Modal Crear / Editar ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 bg-[#1B2A3B]">
                <h3 className="text-base font-semibold text-white">
                  {editingId ? 'Editar cliente' : 'Crear cliente'}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {editingId ? 'Modifica los datos del cliente.' : 'Completa los datos del nuevo cliente.'}
                </p>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <Field label="Nombre">
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre completo"
                    required
                  />
                </Field>

                <Field label="Correo">
                  <input
                    type="email"
                    className={inputCls}
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    type="tel"
                    className={inputCls}
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="10 dígitos"
                    required
                  />
                </Field>

                <Field label="Usuario">
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    placeholder="Nombre de usuario"
                    required
                  />
                </Field>

                <Field label={`Contraseña${editingId ? ' (opcional)' : ''}`}>
                  <input
                    type="password"
                    className={inputCls}
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    placeholder={editingId ? 'Dejar vacío para no cambiar' : 'Contraseña'}
                    required={!editingId}
                  />
                </Field>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50
                      ${editingId
                        ? 'bg-[#2E4460] hover:bg-[#1B2A3B]'
                        : 'bg-[#E8500A] hover:bg-[#c94208]'}`}
                  >
                    {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientesManagement;