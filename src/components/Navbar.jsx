import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const isMostrador = normalizedRole === 'mostrador';
  const isCotizador = normalizedRole === 'cotizador';

  const navLinks =
    normalizedRole === 'tecnico'
      ? [
          { name: 'Mis Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
        ]
      : isMostrador
      ? [
          { name: 'Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Crear Orden', to: '/admin/orders/create' },
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Crear Externo', to: '/servicios-externos/crear' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
        ]
      : [
          { name: 'Dashboard', to: '/admin' },
          { name: 'Órdenes', to: '/admin/orders' },
          { name: 'Cotizaciones', to: '/admin/quotes' },
          { name: 'Usuarios', to: '/admin/technicians' },
          ...(isAdmin ? [{ name: 'Clientes', to: '/admin/clientes' }] : []),
          { name: 'Servicios Externos', to: '/servicios-externos' },
          { name: 'Órdenes de Clientes', to: '/ordenes-clientes' },
          { name: 'Consulta Pública', to: '/consulta-tu-orden' },
          { name: 'Solicitar Orden', to: '/solicitar-orden-cliente' },
        ];

  if (isCotizador) {
    navLinks.length = 0;
    navLinks.push({ name: 'Cotizaciones', to: '/admin/quotes' });
  }

  return (
    <>
      <style>{`
        .navbar-root {
          width: 100%;
          height: 64px;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 30;
          background: #1B2A3B;
          border-bottom: 2px solid #E8500A;
          font-family: sans-serif;
        }
        .navbar-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          justify-content: space-between;
          gap: 1rem;
          box-sizing: border-box;
        }

        /* Logo / marca */
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .brand-icon {
          width: 36px;
          height: 36px;
          background: #E8500A;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-name {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .brand-name span {
          color: #E8500A;
        }
        .brand-sub {
          font-size: 9px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 2px;
          text-transform: uppercase;
          display: block;
          line-height: 1;
        }

        /* Nav links escritorio */
        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-wrap: wrap;
          justify-content: center;
        }
        @media (max-width: 767px) { .navbar-nav { display: none; } }

        .nav-link {
          padding: 7px 13px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .nav-link:hover {
          background: rgba(232,80,10,0.15);
          color: #fff;
          border-color: rgba(232,80,10,0.3);
        }
        .nav-link-active {
          background: #E8500A !important;
          color: #fff !important;
          border-color: #E8500A !important;
          font-weight: 600;
        }

        /* Acciones derecha */
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Badge de rol */
        .role-badge {
          display: none;
          padding: 4px 10px;
          background: rgba(244,166,58,0.15);
          border: 1px solid rgba(244,166,58,0.4);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #F4A63A;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        @media (min-width: 768px) { .role-badge { display: inline-flex; } }

        /* Botón cerrar sesión */
        .btn-logout {
          display: none;
          padding: 8px 16px;
          border-radius: 6px;
          background: transparent;
          border: 1.5px solid rgba(232,80,10,0.6);
          color: #E8500A;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .btn-logout:hover {
          background: #E8500A;
          color: #fff;
        }
        @media (min-width: 768px) { .btn-logout { display: inline-flex; align-items: center; gap: 6px; } }

        /* Hamburguesa */
        .btn-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          cursor: pointer;
        }
        @media (min-width: 768px) { .btn-hamburger { display: none; } }
        .ham-bar {
          width: 18px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.25s;
        }
        .ham-bar.open-1 { transform: rotate(45deg) translate(5px, 5px); }
        .ham-bar.open-2 { opacity: 0; }
        .ham-bar.open-3 { transform: rotate(-45deg) translate(5px, -5px); }

        /* Menú móvil */
        .mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          width: 100%;
          background: #1B2A3B;
          border-bottom: 2px solid #E8500A;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .mobile-menu nav {
          display: flex;
          flex-direction: column;
          padding: 0.5rem 0;
        }
        .mobile-link {
          padding: 13px 24px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          border-left: 3px solid transparent;
          transition: background 0.15s, color 0.15s;
        }
        .mobile-link:hover {
          background: rgba(232,80,10,0.1);
          color: #fff;
        }
        .mobile-link-active {
          background: rgba(232,80,10,0.15) !important;
          color: #fff !important;
          border-left-color: #E8500A !important;
        }
        .mobile-logout {
          margin: 8px 20px 12px;
          padding: 11px;
          border-radius: 6px;
          background: #E8500A;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          text-align: center;
        }

        /* Línea acento inferior naranja ya está en border-bottom del navbar-root */
      `}</style>

      <header className="navbar-root">
        <div className="navbar-inner">

          {/* Marca */}
          <div className="navbar-brand">
            <div className="brand-icon">
              {/* Ícono de engrane SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <div className="brand-name">Mec<span>á</span>nica</div>
              <span className="brand-sub">Órdenes de servicio</span>
            </div>
          </div>

          {/* Links escritorio */}
          <nav className="navbar-nav">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                {...(link.to === '/admin' ? { end: true } : {})}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' nav-link-active' : ''}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Acciones */}
          <div className="navbar-actions">
            <span className="role-badge">{role}</span>
            <button
              className="btn-logout"
              onClick={() => { logout(); navigate('/login_magic'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Salir
            </button>

            <button
              className="btn-hamburger"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <span className={`ham-bar${isMenuOpen ? ' open-1' : ''}`}></span>
              <span className={`ham-bar${isMenuOpen ? ' open-2' : ''}`}></span>
              <span className={`ham-bar${isMenuOpen ? ' open-3' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <nav>
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  {...(link.to === '/admin' ? { end: true } : {})}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `mobile-link${isActive ? ' mobile-link-active' : ''}`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              <button
                className="mobile-logout"
                onClick={() => { logout(); navigate('/login_magic'); setIsMenuOpen(false); }}
              >
                Cerrar sesión
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;