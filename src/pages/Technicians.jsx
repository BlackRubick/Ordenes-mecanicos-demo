import { useState } from 'react';
import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

const ROLES = ['Técnico', 'Administrador', 'Mostrador', 'Cotizador'];
const ESTADOS = ['Activo', 'Inactivo'];

const ROL_STYLES = {
  Técnico:       'bg-[#E2E8EF] text-[#2E4460]',
  Administrador: 'bg-[#FFF3CD] text-[#7c5a00]',
  Mostrador:     'bg-[#D4EDDA] text-[#1a5c2e]',
  Cotizador:     'bg-[#F8D7DA] text-[#7b1e24]',
};

/* ── Input / Select reutilizable ── */
const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-[#1B2A3B] uppercase tracking-wide">{label}</span>
    {children}
  </label>
);

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#1B2A3B] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8500A]/30 focus:border-[#E8500A] transition-colors';

/* ── Modal genérico ── */
const Modal = ({ title, data, setData, onCancel, onConfirm, confirmLabel, confirmCls }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-[#1B2A3B]">
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-4">
        <Field label="Nombre">
          <input
            className={inputCls}
            value={data.nombre}
            onChange={e => setData(d => ({ ...d, nombre: e.target.value }))}
            placeholder="Nombre completo"
          />
        </Field>

        <Field label="Correo">
          <input
            className={inputCls}
            value={data.correo}
            onChange={e => setData(d => ({ ...d, correo: e.target.value }))}
            placeholder="correo@ejemplo.com"
          />
        </Field>

        <Field label="Contraseña">
          <input
            type="password"
            className={inputCls}
            value={data.contrasena}
            onChange={e => setData(d => ({ ...d, contrasena: e.target.value }))}
            placeholder={title.includes('Editar') ? 'Dejar vacío para no cambiar' : 'Contraseña'}
          />
        </Field>

        <Field label="Rol">
          <select
            className={inputCls}
            value={data.rol}
            onChange={e => setData(d => ({ ...d, rol: e.target.value }))}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label="Estado">
          <select
            className={inputCls}
            value={data.estado}
            onChange={e => setData(d => ({ ...d, estado: e.target.value }))}
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Componente principal ── */
const Technicians = () => {
  const [users, setUsers] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });

  React.useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditData({ ...users[idx], contrasena: '' });
  };

  const handleSave = () => {
    const user = users[editIdx];
    fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
      .then(res => res.json())
      .then(updated => {
        setUsers(prev => prev.map((u, i) => (i === editIdx ? updated : u)));
        setEditIdx(null);
        Swal.fire('Usuario actualizado', '', 'success');
      })
      .catch(() => Swal.fire('Error al actualizar', '', 'error'));
  };

  const handleCreate = () => {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: createData.nombre,
        correo: createData.correo,
        contrasena: createData.contrasena,
        rol: createData.rol,
        estado: createData.estado,
      }),
    })
      .then(res => res.json())
      .then(newUser => {
        setUsers(prev => [...prev, newUser]);
        setShowCreate(false);
        setCreateData({ nombre: '', correo: '', contrasena: '', rol: ROLES[0], estado: ESTADOS[0] });
      })
      .catch(() => Swal.fire('Error al crear usuario', '', 'error'));
  };

  const handleDelete = (idx) => {
    const user = users[idx];
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Seguro que quieres eliminar a ${user.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (result.isConfirmed) {
        fetch(`/api/users/${user.id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(() => {
            setUsers(prev => prev.filter((_, i) => i !== idx));
            Swal.fire('Usuario eliminado', '', 'success');
          })
          .catch(() => Swal.fire('Error al eliminar', '', 'error'));
      }
    });
  };

  /* ── Render ── */
  return (
    <DashboardLayout>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1B2A3B] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B2A3B] leading-tight">Gestión de Usuarios</h2>
            <p className="text-xs text-gray-500 leading-none mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8500A] text-white text-sm font-medium hover:bg-[#c94208] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#E8500A]" />
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {users.length} registro{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#1B2A3B] text-white">
                {['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'].map((col, i, arr) => (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}

              {users.map((user, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-0 hover:bg-[#F4F6F8] transition-colors"
                >
                  {/* Nombre */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#2E4460] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {user.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-[#1B2A3B]">{user.nombre}</span>
                    </div>
                  </td>

                  {/* Correo */}
                  <td className="py-3.5 px-4 align-middle text-gray-500 text-xs font-mono">
                    {user.correo}
                  </td>

                  {/* Rol */}
                  <td className="py-3.5 px-4 align-middle">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${ROL_STYLES[user.rol] ?? 'bg-[#E2E8EF] text-[#2E4460]'}`}>
                      {user.rol}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                      ${user.estado === 'Inactivo'
                        ? 'bg-[#F8D7DA] text-[#7b1e24]'
                        : 'bg-[#D4EDDA] text-[#1a5c2e]'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.estado === 'Inactivo' ? 'bg-[#7b1e24]' : 'bg-[#1a5c2e]'}`} />
                      {user.estado}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEdit(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E2E8EF] text-[#2E4460] text-xs font-medium hover:bg-[#d0d8e4] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {showCreate && (
        <Modal
          title="Crear usuario"
          data={createData}
          setData={setCreateData}
          onCancel={() => setShowCreate(false)}
          onConfirm={handleCreate}
          confirmLabel="Crear"
          confirmCls="bg-[#E8500A] hover:bg-[#c94208]"
        />
      )}

      {/* Modal Editar */}
      {editIdx !== null && (
        <Modal
          title="Editar usuario"
          data={editData}
          setData={setEditData}
          onCancel={() => setEditIdx(null)}
          onConfirm={handleSave}
          confirmLabel="Guardar cambios"
          confirmCls="bg-[#2E4460] hover:bg-[#1B2A3B]"
        />
      )}
    </DashboardLayout>
  );
};

export default Technicians;