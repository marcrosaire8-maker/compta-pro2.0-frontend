// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button, Nav, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';

const SIDEBAR_WIDTH = '320px';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const handleLinkClick = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Protection d'accès
  if (!loading && !isSuperAdmin) return <Navigate to="/" replace />;
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ecfdf5',
        color: '#065f46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '1.2rem'
      }}>
        Vérification des droits Super Admin...
      </div>
    );
  }

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    color: '#166534',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  };

  const renderLink = (to, icon, label, color = '#16a34a') => (
    <OverlayTrigger placement="right" overlay={!sidebarOpen ? <Tooltip>{label}</Tooltip> : <></>}>
      <div>
        <Link
          to={to}
          style={linkStyle}
          onClick={handleLinkClick}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dcfce722'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className={`bi ${icon} me-3 fs-4`} style={{ color }}></i>
          {sidebarOpen && <span style={{ flex: 1 }}>{label}</span>}
        </Link>
      </div>
    </OverlayTrigger>
  );

  return (
    <>
      {/* Bouton flottant VERT ÉMERAUDE – Signature Super Admin */}
      {!sidebarOpen && (
        <Button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1100,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            border: 'none',
            boxShadow: '0 10px 30px rgba(22, 163, 74, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="shadow-lg"
        >
          <i className="bi bi-shield-lock-fill fs-3 text-white"></i>
        </Button>
      )}

      {/* Sidebar Overlay – Fond beige clair + accent vert */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-100%',
          width: SIDEBAR_WIDTH,
          height: '100vh',
          backgroundColor: '#f0fdf4',        // vert très clair
          padding: '100px 30px 40px',
          boxShadow: '10px 0 40px rgba(0,0,0,0.15)',
          transition: 'left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          zIndex: 1090,
          fontFamily: "'Poppins', sans-serif",
          overflowY: 'auto',
          borderRight: '1px solid #86efac',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 style={{ 
            color: '#16a34a', 
            fontWeight: 800, 
            fontSize: '2.3rem',
            textShadow: '0 2px 4px rgba(22,163,74,0.2)'
          }}>
            Super Admin
          </h2>
          <Button variant="link" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-2" style={{ color: '#166534' }}></i>
          </Button>
        </div>

        <Nav className="flex-column gap-3">
          {renderLink('/admin',              'bi-speedometer2',      'Synthèse Globale', '#16a34a')}
          {renderLink('/admin/companies',    'bi-building-fill',     'Gestion des Entreprises', '#15803d')}
          {renderLink('/admin/master-plan',  'bi-table',             'Plan Comptable Maître', '#22c55e')}
          {renderLink('/admin/audit',        'bi-shield-shaded',     'Audit Global', '#16a34a')}
          {renderLink('/admin/config',       'bi-gear-fill',         'Configuration Backend', '#22c55e')}
          {renderLink('/admin/monetization', 'bi-currency-exchange', 'Abonnements & Monétisation', '#15803d')}
        </Nav>

        <Button
          onClick={handleLogout}
          className="w-100 mt-5"
          style={{
            background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          Déconnexion Super Admin
        </Button>
      </nav>

      {/* Fond semi-transparent */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1080,
          }}
        />
      )}

      {/* Contenu principal – même style clair que l'app normale */}
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          padding: '40px',
          paddingTop: '100px',
          fontFamily: "'Poppins', sans-serif",
          color: '#1f2937',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Outlet />
      </main>
    </>
  );
}
