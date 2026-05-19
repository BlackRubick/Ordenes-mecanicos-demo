import React, { useState } from 'react';
import Swal from 'sweetalert2';

const normalizeStatus = (status) => {
  const statusMap = {
    pendiente: 'Pendiente',
    revision: 'En revisión',
    'en revisión': 'En revisión',
    reparacion: 'En reparación',
    'en reparación': 'En reparación',
    lista: 'Listo',
    listo: 'Listo',
    entregada: 'Entregado',
    entregado: 'Entregado',
    cancelada: 'Cancelada',
  };

  const normalized = String(status || '').toLowerCase().trim();
  return statusMap[normalized] || status || 'Pendiente';
};

export default function ConsultaPublica() {
  const [folio, setFolio] = useState('');
  const [order, setOrder] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!folio.trim()) {
      Swal.fire('Campo obligatorio', 'Por favor ingresa un número de folio.', 'warning');
      return;
    }

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        const allOrders = Array.isArray(data) ? data : [];
        const foundOrder = allOrders.find(o => String(o.folio || '').toLowerCase() === folio.trim().toLowerCase());

        if (!foundOrder) {
          setOrder(null);
          Swal.fire('No encontrado', 'No existe una orden con ese folio.', 'error');
          return;
        }

        setOrder({
          folio: foundOrder.folio,
          fecha: foundOrder.fecha || '-',
          estado: normalizeStatus(foundOrder.status || foundOrder.estado),
          tecnico: foundOrder.tecnico || 'Sin asignar',
          equipo: foundOrder.tipo && foundOrder.marca && foundOrder.modelo
            ? `${foundOrder.tipo} ${foundOrder.marca} ${foundOrder.modelo}`.trim()
            : foundOrder.tipo || 'Equipo',
          detalles: foundOrder.description || foundOrder.descripcion || 'No especificado',
          clientName: foundOrder.clientName || foundOrder.nombre || 'Cliente',
          historial: ['Pendiente'],
        });
      })
      .catch(() => {
        setOrder(null);
        Swal.fire('Error', 'No se pudo conectar con la API.', 'error');
      });
  };

  const serviceSteps = ['Pendiente', 'En revisión', 'En reparación', 'Listo', 'Entregado'];
  const currentStepIndex = serviceSteps.indexOf(order?.estado);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Share+Tech+Mono&family=Source+Sans+3:wght@400;500;600;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scanline {
          0% { transform: translateY(-120%); }
          100% { transform: translateY(120vh); }
        }

        .public-root {
          width: 100%;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(232,80,10,0.16), transparent 28%),
            radial-gradient(circle at top right, rgba(55,138,221,0.14), transparent 24%),
            linear-gradient(180deg, #0e1117 0%, #131920 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          padding: 2rem 1rem 3rem;
          font-family: 'Source Sans 3', sans-serif;
        }

        .public-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 42px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 42px);
          pointer-events: none;
        }

        .public-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 36%, rgba(14,17,23,0.96) 100%);
          pointer-events: none;
        }

        .public-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(232,80,10,0.22), transparent);
          animation: scanline 6.5s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .public-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1240px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr);
          gap: 1.25rem;
          align-items: stretch;
          animation: fadeUp 0.55s ease both;
        }

        .public-hero,
        .public-panel {
          border-radius: 24px;
          border: 1px solid rgba(232,80,10,0.18);
          box-shadow: 0 20px 60px rgba(0,0,0,0.32);
          backdrop-filter: blur(16px);
        }

        .public-hero {
          background: linear-gradient(180deg, rgba(20,25,32,0.96), rgba(17,22,28,0.96));
          padding: 2rem;
          overflow: hidden;
          position: relative;
        }

        .public-hero::before {
          content: '';
          position: absolute;
          right: -72px;
          top: -72px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(232,80,10,0.08);
        }

        .public-hero::after {
          content: '';
          position: absolute;
          left: -60px;
          bottom: -80px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(55,138,221,0.08);
        }

        .brand-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.9rem;
          border-radius: 16px;
          background: rgba(27,42,59,0.82);
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 1.2rem;
          position: relative;
          z-index: 1;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #E8500A, #F4A63A);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-name {
          font-family: 'Rajdhani', sans-serif;
          color: #fff;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          line-height: 1;
        }

        .brand-sub {
          display: block;
          margin-top: 2px;
          font-size: 10px;
          color: rgba(255,255,255,0.38);
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .hero-kicker {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.38);
          letter-spacing: 2.4px;
          text-transform: uppercase;
          margin-bottom: 0.7rem;
          position: relative;
          z-index: 1;
        }

        .hero-title {
          position: relative;
          z-index: 1;
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(2.2rem, 5vw, 4.2rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: 1px;
          color: #fff;
          margin: 0 0 0.8rem;
        }

        .hero-title span {
          color: #E8500A;
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          max-width: 32rem;
          color: rgba(255,255,255,0.68);
          font-size: 1rem;
          line-height: 1.7;
        }

        .hero-meta {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .hero-meta-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 0.9rem 1rem;
        }

        .hero-meta-card .label {
          display: block;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.34);
          margin-bottom: 0.4rem;
        }

        .hero-meta-card .value {
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .public-panel {
          background: rgba(20,25,32,0.96);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          overflow: hidden;
        }

        .public-panel.search-mode {
          justify-content: center;
          min-height: 520px;
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .panel-title.centered {
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .panel-title h2 {
          margin: 0;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .panel-title p {
          margin: 0.2rem 0 0;
          color: rgba(255,255,255,0.42);
          font-size: 0.92rem;
        }

        .search-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 1rem;
        }

        .public-panel.search-mode .search-card {
          margin-top: 0;
        }

        .field-label {
          display: block;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.38);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .field-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #fff;
          padding: 0.95rem 1rem;
          outline: none;
          font-size: 1rem;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.26);
        }

        .field-input:focus {
          border-color: rgba(232,80,10,0.7);
          background: rgba(232,80,10,0.06);
          box-shadow: 0 0 0 3px rgba(232,80,10,0.16);
        }

        .help-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          color: rgba(255,255,255,0.42);
          font-size: 0.85rem;
        }

        .btn-submit {
          width: 100%;
          margin-top: 0.95rem;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #E8500A, #F4A63A);
          color: #fff;
          padding: 0.95rem 1.1rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
          box-shadow: 0 12px 28px rgba(232,80,10,0.25);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .public-result {
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(232,80,10,0.18);
          background: rgba(20,25,32,0.96);
          box-shadow: 0 18px 45px rgba(0,0,0,0.28);
        }

        .result-head {
          padding: 1.25rem 1.35rem;
          background: linear-gradient(135deg, rgba(27,42,59,0.98), rgba(17,22,28,0.98));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .folio-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.42);
        }

        .folio-value {
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1;
          font-size: clamp(1.7rem, 4vw, 2.7rem);
          margin-top: 0.2rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          background: rgba(232,80,10,0.12);
          color: #ffbf8e;
          border: 1px solid rgba(232,80,10,0.26);
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .result-body {
          padding: 1.25rem 1.35rem 1.4rem;
          background: linear-gradient(180deg, rgba(20,25,32,0.96), rgba(16,20,26,0.96));
        }

        .step-track {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.65rem;
          margin: 0.25rem 0 1rem;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
          text-align: center;
        }

        .step-dot {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.42);
          flex-shrink: 0;
        }

        .step-item.reached .step-dot {
          background: rgba(232,80,10,0.12);
          border-color: rgba(232,80,10,0.28);
          color: #E8500A;
          box-shadow: 0 0 0 3px rgba(232,80,10,0.07);
        }

        .step-item.active .step-dot {
          background: linear-gradient(135deg, #E8500A, #F4A63A);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 12px 24px rgba(232,80,10,0.28);
        }

        .step-label {
          font-size: 11px;
          line-height: 1.15;
          color: rgba(255,255,255,0.42);
        }

        .step-item.reached .step-label,
        .step-item.active .step-label {
          color: rgba(255,255,255,0.82);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .detail-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 0.95rem 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .detail-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(232,80,10,0.12);
          color: #E8500A;
        }

        .detail-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.38);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }

        .detail-value {
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.4;
          word-break: break-word;
        }

        .info-card {
          margin-top: 1rem;
          border-radius: 18px;
          border: 1px solid rgba(55,138,221,0.2);
          background: rgba(55,138,221,0.08);
          padding: 1rem 1.1rem;
        }

        .info-card h3 {
          margin: 0 0 0.45rem;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .info-card ul {
          margin: 0;
          padding-left: 1.1rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .search-again,
        .help-card {
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          padding: 1rem;
        }

        .search-again button,
        .help-card a {
          transition: transform 0.15s, filter 0.15s, background 0.15s;
        }

        .search-again button:hover,
        .help-card a:hover {
          transform: translateY(-1px);
        }

        .help-card {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .help-card > div:last-child {
          margin-inline: auto;
          width: fit-content;
        }

        @media (max-width: 1024px) {
          .public-shell {
            grid-template-columns: 1fr;
            max-width: 760px;
          }

          .help-card {
            max-width: 760px;
          }
        }

        @media (max-width: 640px) {
          .public-root {
            padding: 1rem 0.75rem 2.5rem;
          }

          .public-hero,
          .public-panel {
            border-radius: 20px;
            padding: 1.15rem;
          }

          .hero-meta,
          .detail-grid,
          .step-track {
            grid-template-columns: 1fr;
          }

          .result-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="public-root">
        <div className="public-scanline" />

        <div className="public-shell">
          <section className="public-hero">
            <div className="brand-chip">
              <div className="brand-mark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <div className="brand-name">Mecánica</div>
                <span className="brand-sub">Órdenes de servicio</span>
              </div>
            </div>

            <div className="hero-kicker">Consulta pública</div>
            <h1 className="hero-title">Sigue el estado de tu <span>orden</span> en tiempo real.</h1>
            <p className="hero-copy">
              Ingresa tu folio para ver el avance del servicio, la fecha de ingreso, el técnico asignado y la información principal de tu equipo.
            </p>

            <div className="hero-meta">
              <div className="hero-meta-card">
                <span className="label">Paso 1</span>
                <div className="value">Busca tu folio</div>
              </div>
              <div className="hero-meta-card">
                <span className="label">Paso 2</span>
                <div className="value">Revisa el progreso</div>
              </div>
              <div className="hero-meta-card">
                <span className="label">Paso 3</span>
                <div className="value">Consulta detalles</div>
              </div>
              <div className="hero-meta-card">
                <span className="label">Soporte</span>
                <div className="value">WhatsApp o llamada</div>
              </div>
            </div>
          </section>

          <section className={`public-panel${!order ? ' search-mode' : ''}`}>
            {!order && (
              <div className="search-card">
                <div className="panel-title centered" style={{ marginBottom: '1rem' }}>
                  <div>
                    <h2>Consulta tu Orden</h2>
                    <p>Escribe el folio que te compartimos al ingresar el equipo.</p>
                  </div>
                </div>

                <form onSubmit={handleSearch}>
                  <label className="field-label">Número de folio</label>
                  <input
                    className="field-input font-mono uppercase tracking-[0.18em]"
                    placeholder="Ej: S2501104"
                    value={folio}
                    onChange={e => setFolio(e.target.value)}
                  />

                  <div className="help-line">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <circle cx="12" cy="8" r="1" />
                    </svg>
                    El folio aparece en tu recibo o comprobante de ingreso.
                  </div>

                  <button type="submit" className="btn-submit">Buscar orden</button>
                </form>
              </div>
            )}

            {order && (
              <div className="public-result">
                <div className="result-head">
                  <div>
                    <div className="folio-label">Folio de orden</div>
                    <div className="folio-value">{order.folio}</div>
                  </div>
                  <div className="status-badge">
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {order.estado}
                  </div>
                </div>

                <div className="result-body">
                  <div className="step-track">
                    {serviceSteps.map((step, idx) => {
                      const isActive = currentStepIndex === idx;
                      const reached = currentStepIndex >= idx && currentStepIndex !== -1;

                      return (
                        <div key={step} className={`step-item${isActive ? ' active' : reached ? ' reached' : ''}`}>
                          <div className="step-dot">
                            {reached ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                {isActive ? <circle cx="12" cy="12" r="9" /> : <path d="M5 13l4 4L19 7" />}
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                            )}
                          </div>
                          <div className="step-label">{step}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="detail-grid">
                    <div className="detail-card">
                      <div className="detail-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </div>
                      <div>
                        <div className="detail-label">Fecha de ingreso</div>
                        <div className="detail-value">{order.fecha}</div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="7" r="4" />
                          <path d="M5.5 21h13a2 2 0 0 0 2-2v-2a7 7 0 0 0-14 0v2a2 2 0 0 0 2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="detail-label">Técnico asignado</div>
                        <div className="detail-value">{order.tecnico}</div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="7" width="18" height="13" rx="2" />
                          <path d="M16 3v4M8 3v4" />
                        </svg>
                      </div>
                      <div>
                        <div className="detail-label">Equipo / servicio</div>
                        <div className="detail-value">{order.equipo}</div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="7" width="18" height="13" rx="2" />
                          <circle cx="12" cy="14" r="3" />
                        </svg>
                      </div>
                      <div>
                        <div className="detail-label">Estado actual</div>
                        <div className="detail-value">{order.estado}</div>
                      </div>
                    </div>
                  </div>

                  <div className="search-card mt-4">
                    <div className="panel-title mb-3">
                      <div>
                        <h2 className="text-lg">Servicio reportado</h2>
                        <p>Descripción breve del trabajo solicitado.</p>
                      </div>
                    </div>
                    <div className="text-white/80 text-sm leading-6">{order.detalles}</div>
                  </div>

                  <div className="info-card">
                    <h3>Información importante</h3>
                    <ul>
                      <li>Te notificaremos cuando tu equipo esté listo para recoger.</li>
                      <li>Si tienes dudas, contacta al técnico asignado.</li>
                      <li>Conserva tu número de folio para futuras consultas.</li>
                    </ul>
                  </div>

                  <div className="search-again mt-4">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-gradient-to-r from-[#E8500A] to-[#F4A63A] text-white font-bold py-3 tracking-[0.18em] uppercase"
                      onClick={() => {
                        setOrder(null);
                        setFolio('');
                      }}
                    >
                      Buscar otra orden
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="help-card mt-5">
          <div className="text-center text-white font-semibold mb-2">¿Necesitas ayuda?</div>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <a href="tel:9613336529" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-white/6 border border-white/10 text-white/85 font-semibold hover:bg-white/10">
              <svg className="w-5 h-5 text-[#E8500A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0 1 22 16.92z" />
              </svg>
              961 234 5678
            </a>
            <a href="https://wa.me/529613336529" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#27C93F]/15 text-[#9ef0ad] font-semibold border border-[#27C93F]/20 hover:bg-[#27C93F]/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.52 3.48A12.07 12.07 0 0 0 12 0C5.37 0 0 5.37 0 12a11.93 11.93 0 0 0 1.67 6.13L0 24l6.37-1.67A12.07 12.07 0 0 0 12 24c6.63 0 12-5.37 12-12a11.93 11.93 0 0 0-3.48-8.52zM12 22a9.93 9.93 0 0 1-5.09-1.39l-.36-.21-3.78 1 1-3.67-.24-.38A9.93 9.93 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-1 2.43s1.02 2.82 1.16 3.02c.14.2 2.01 3.08 4.88 4.2.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
