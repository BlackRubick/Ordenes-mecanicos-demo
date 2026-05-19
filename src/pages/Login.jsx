import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginStore = useAuthStore();

  const validate = () => {
    const errors = {};
    if (!email) errors.email = 'El correo es obligatorio';
    if (!password) errors.password = 'La contraseña es obligatoria';
    return errors;
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setTouched({ email: true, password: true });
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena: password })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setError('');
          loginStore.login(data.user, data.user.rol);
          const rol = String(data.user.rol || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          if (rol === 'admin' || rol === 'administrador') {
            navigate('/admin/dashboard');
          } else if (rol === 'technician' || rol === 'tecnico') {
            navigate('/admin/orders');
          } else if (rol === 'mostrador') {
            navigate('/admin/orders');
          } else if (rol === 'cotizador') {
            navigate('/admin/quotes');
          }
        } else {
          setError('Credenciales incorrectas');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Error de conexión');
      });
  };

  const errors = validate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&family=Source+Sans+3:wght@400;500&display=swap');

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotateCog {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rotateReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,80,10,0); }
          50%       { box-shadow: 0 0 0 3px rgba(232,80,10,0.25); }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .login-root {
          min-height: 100vh;
          background: #0e1117;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Source Sans 3', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Fondo: patrón de placas de acero */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg,   rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg,  rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px);
          pointer-events: none;
        }

        /* Viñeta lateral */
        .login-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, #0e1117 100%);
          pointer-events: none;
        }

        /* Línea de escaneo */
        .scanline {
          position: absolute;
          left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(232,80,10,0.18), transparent);
          animation: scanline 6s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        /* Ticker inferior */
        .ticker-wrap {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 32px;
          background: #1B2A3B;
          border-top: 1px solid rgba(232,80,10,0.4);
          overflow: hidden;
          z-index: 10;
          display: flex;
          align-items: center;
        }
        .ticker-inner {
          display: flex;
          white-space: nowrap;
          animation: ticker 28s linear infinite;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          letter-spacing: 1.5px;
        }
        .ticker-sep {
          color: #E8500A;
          margin: 0 18px;
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 5;
          width: 100%;
          max-width: 420px;
          margin: 0 1rem 40px;
          animation: fadeUp 0.55s ease both;
        }

        /* Cabecera con engranes */
        .card-header {
          background: #1B2A3B;
          border: 1px solid rgba(232,80,10,0.35);
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          padding: 1.5rem 2rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 18px;
          position: relative;
          overflow: hidden;
        }
        .card-header::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,80,10,0.6), transparent);
        }

        .cogs-container {
          position: relative;
          width: 52px;
          height: 52px;
          flex-shrink: 0;
        }
        .cog-big {
          position: absolute;
          top: 0; left: 0;
          animation: rotateCog 8s linear infinite;
        }
        .cog-small {
          position: absolute;
          bottom: 0; right: -4px;
          animation: rotateReverse 5s linear infinite;
        }

        .header-text {}
        .header-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1px;
          line-height: 1;
          margin-bottom: 3px;
        }
        .header-title span { color: #E8500A; }
        .header-sub {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* Cuerpo */
        .card-body {
          background: #141920;
          border: 1px solid rgba(232,80,10,0.25);
          border-top: none;
          border-radius: 0 0 12px 12px;
          padding: 1.75rem 2rem 2rem;
        }

        /* Badges de estado */
        .status-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 1.5rem;
        }
        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #27C93F;
          box-shadow: 0 0 6px #27C93F;
        }
        .status-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 1.5px;
          align-self: center;
        }

        /* Alerta */
        .alert-error {
          background: rgba(232,80,10,0.1);
          border: 1px solid rgba(232,80,10,0.4);
          border-left: 3px solid #E8500A;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 13px;
          color: #ffad85;
          margin-bottom: 1.25rem;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.5px;
        }

        /* Labels */
        .field-label {
          display: block;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .field-label span {
          color: #E8500A;
          margin-right: 4px;
        }

        /* Inputs */
        .field-wrap {
          position: relative;
          margin-bottom: 1.25rem;
        }
        .field-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.35;
          pointer-events: none;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          padding: 11px 14px 11px 40px;
          color: #e8edf2;
          font-size: 14px;
          font-family: 'Source Sans 3', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, background 0.2s;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.18); }
        .field-input:focus {
          border-color: rgba(232,80,10,0.6);
          background: rgba(232,80,10,0.04);
        }
        .field-input.has-error {
          border-color: rgba(255,80,80,0.5);
          background: rgba(255,80,80,0.04);
        }
        .field-error {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #ff8080;
          letter-spacing: 0.5px;
          margin-top: 5px;
          display: block;
        }

        /* Botón */
        .btn-submit {
          width: 100%;
          padding: 13px;
          border-radius: 8px;
          border: none;
          background: #E8500A;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.1s;
          animation: pulse-border 3s ease infinite;
          margin-top: 0.5rem;
        }
        .btn-submit:hover:not(:disabled) { background: #c94308; }
        .btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-submit::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: rgba(255,255,255,0.08);
          transform: skewX(-20deg);
          transition: left 0.4s;
        }
        .btn-submit:hover::before { left: 140%; }

        /* Divisor */
        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 1.5rem 0;
        }
      `}</style>

      <div className="login-root">
        <div className="scanline" />

        <div className="login-card">
          {/* Cabecera */}
          <div className="card-header">
            <div className="cogs-container">
              {/* Engrane grande */}
              <svg className="cog-big" width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" fill="#E8500A" opacity="0.9"/>
                <path d="M15.5 2h5l1 4.2a9.9 9.9 0 0 1 3.1 1.8l4.1-1.3 2.5 4.3-3.1 3a9.9 9.9 0 0 1 0 3.6l3.1 3-2.5 4.3-4.1-1.3a9.9 9.9 0 0 1-3.1 1.8l-1 4.2h-5l-1-4.2a9.9 9.9 0 0 1-3.1-1.8l-4.1 1.3L4.8 21l3.1-3a9.9 9.9 0 0 1 0-3.6l-3.1-3 2.5-4.3 4.1 1.3A9.9 9.9 0 0 1 14.5 6.2l1-4.2z" stroke="#E8500A" strokeWidth="1.5" fill="rgba(232,80,10,0.08)"/>
              </svg>
              {/* Engrane pequeño */}
              <svg className="cog-small" width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" fill="#F4A63A" opacity="0.85"/>
                <path d="M9.5 1.5h3l.6 2.6a6 6 0 0 1 1.9 1.1l2.5-.8 1.5 2.6-1.9 1.8a6 6 0 0 1 0 2.2l1.9 1.8-1.5 2.6-2.5-.8a6 6 0 0 1-1.9 1.1l-.6 2.6h-3l-.6-2.6a6 6 0 0 1-1.9-1.1l-2.5.8L3 16.1l1.9-1.8a6 6 0 0 1 0-2.2L3 10.3l1.5-2.6 2.5.8A6 6 0 0 1 8.9 4.1l.6-2.6z" stroke="#F4A63A" strokeWidth="1.2" fill="rgba(244,166,58,0.1)"/>
              </svg>
            </div>

            <div className="header-text">
              <div className="header-title">Sistema <span>Mecanico</span></div>
              <div className="header-sub">Gestión de órdenes de servicio</div>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="card-body">
            <div className="status-bar">
              <div className="status-dot" />
              <div className="status-text">SISTEMA EN LÍNEA </div>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert-error">⚠ {error}</div>}

              {/* Correo */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" className="field-label">
                  <span>▸</span>Correo electrónico
                </label>
                <div className="field-wrap" style={{ marginBottom: 0 }}>
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m2 7 10 7 10-7"/>
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="usuario@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={handleBlur}
                    autoComplete="username"
                    className={`field-input${touched.email && errors.email ? ' has-error' : ''}`}
                  />
                </div>
                {touched.email && errors.email && (
                  <span className="field-error">▸ {errors.email}</span>
                )}
              </div>

              {/* Contraseña */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="password" className="field-label">
                  <span>▸</span>Contraseña
                </label>
                <div className="field-wrap" style={{ marginBottom: 0 }}>
                  <svg className="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={handleBlur}
                    autoComplete="current-password"
                    className={`field-input${touched.password && errors.password ? ' has-error' : ''}`}
                  />
                </div>
                {touched.password && errors.password && (
                  <span className="field-error">▸ {errors.password}</span>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}
              </button>
            </form>

            <div className="divider-line" style={{ marginBottom: '1rem' }} />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', letterSpacing: '1.5px' }}>
              ACCESO RESTRINGIDO — SOLO PERSONAL AUTORIZADO
            </div>
          </div>
        </div>

        {/* Ticker inferior */}
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {'MOTOR • TRANSMISIÓN • FRENOS • SUSPENSIÓN • ELÉCTRICO • DIAGNÓSTICO • AFINACIÓN • CLUTCH • DIFERENCIAL • DIRECCIÓN • ESCAPE • ENFRIAMIENTO • MOTOR • TRANSMISIÓN • FRENOS • SUSPENSIÓN • ELÉCTRICO • DIAGNÓSTICO • AFINACIÓN • CLUTCH • DIFERENCIAL • DIRECCIÓN • ESCAPE • ENFRIAMIENTO • '.split('').map((c, i) =>
              c === '•' ? <span key={i} className="ticker-sep">◆</span> : c
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;