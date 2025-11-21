// src/AppLayout.jsx

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button, Nav, Collapse, OverlayTrigger, Tooltip } from 'react-bootstrap';

const SIDEBAR_WIDTH = '300px';

export default function AppLayout() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Ferme la sidebar après avoir cliqué sur un lien
  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    color: '#333',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  };

  // Fonction pour rendre les liens de navigation avec un support de tooltip conditionnel
  const renderLink = (to, icon, label, isDropdown = false, color = '#0d6efd') => (
    <OverlayTrigger 
      placement="right" 
      // Le Fragment (<>) est utilisé ici car le Tooltip n'est rendu que si !sidebarOpen
      // Si sidebarOpen est vrai, il rend un fragment sans props, ce qui est correct.
      overlay={!sidebarOpen ? <Tooltip>{label}</Tooltip> : <></>} 
    >
      <Link
        to={to}
        style={linkStyle}
        onClick={isDropdown ? (e) => { e.preventDefault(); toggleSection(label); } : handleLinkClick}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fd7e1422'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <i className={`bi ${icon} me-3 fs-4`} style={{ color }}></i>
        {sidebarOpen && <span style={{ flex: 1 }}>{label}</span>}
        {isDropdown && sidebarOpen && (
          <i className={`bi ${openSections[label] ? 'bi-chevron-down' : 'bi-chevron-right'} ms-auto`}></i>
        )}
      </Link>
    </OverlayTrigger>
  );

  return (
    // Le conteneur principal est un <div> pour pouvoir appliquer des styles de layout.
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}> 

      {/* Bouton du menu latéral */}
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
          backgroundColor: '#0d6efd',
          border: 'none',
          boxShadow: '0 10px 30px rgba(13,110,253,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="shadow-lg"
      >
        <i className="bi bi-list fs-3 text-white"></i>
      </Button>

      {/* Sidebar en OVERLAY */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-100%',
          width: SIDEBAR_WIDTH,
          height: '100vh',
          backgroundColor: '#f5f5dc',
          padding: '100px 30px 40px',
          boxShadow: '10px 0 40px rgba(0,0,0,0.25)',
          transition: 'left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          zIndex: 1090,
          fontFamily: "'Poppins', sans-serif",
          overflowY: 'auto',
          borderRight: '1px solid #ddd',
        }}
      >
        {/* En-tête sidebar */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h2 style={{ color: '#0d6efd', fontWeight: 800, fontSize: '2.3rem' }}>ComptaPro</h2>
          <Button variant="link" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-2" style={{ color: '#333' }}></i>
          </Button>
        </div>
        <Nav className="flex-column gap-3">
          {renderLink('/', 'bi-speedometer2', 'Tableau de Bord', false, '#6366f1')}
          
          {renderLink('#', 'bi-cart4', 'Gestion', true, '#0d6efd')}
          <Collapse in={openSections['Gestion'] && sidebarOpen}>
            <div className="ps-4">
              {renderLink('/facturation', 'bi-receipt', 'Ventes / Factures')}
              {renderLink('/achats', 'bi-bag-fill', 'Achats / Fournisseurs')}
              {renderLink('/stocks', 'bi-box-seam-fill', 'Gestion des Stocks')}
              {renderLink('/paie', 'bi-people-fill', 'Gestion de la Paie')}
            </div>
          </Collapse>
          {renderLink('#', 'bi-journal-text', 'Comptabilité', true, '#28a745')}
          <Collapse in={openSections['Comptabilité'] && sidebarOpen}>
            <div className="ps-4">
              {renderLink('/saisie', 'bi-pencil-square', 'Saisie Manuelle')}
              {renderLink('/immobilisations', 'bi-building', 'Immobilisations')}
              {renderLink('/mon-plan', 'bi-table', 'Mon Plan comptable')}
              {renderLink('/exercices', 'bi-calendar-check', 'Exercices')}
              {renderLink('/membres', 'bi-person-badge', 'Membres')}
            </div>
          </Collapse>
          {renderLink('#', 'bi-graph-up-arrow', 'Rapports', true, '#6f42c1')}
          <Collapse in={openSections['Rapports'] && sidebarOpen}>
            <div className="ps-4">
              {renderLink('/balance', 'bi-bar-chart-line-fill', 'Balance & Grand Livre')}
              {renderLink('/compte-resultat', 'bi-file-earmark-bar-graph', 'Compte de Résultat')}
              {renderLink('/bilan', 'bi-clipboard-data', 'Bilan')}
            </div>
          </Collapse>
          {isSuperAdmin && renderLink('/admin', 'bi-shield-lock-fill', 'SUPER ADMIN', false, '#dc3545')}
        </Nav>
        <Button
          onClick={handleLogout}
          className="w-100 mt-5"
          style={{
            background: 'linear-gradient(90deg, #dc3545, #c82333)',
            border: 'none',
            borderRadius: '16px',
            padding: '16px',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          Déconnexion
        </Button>
      </nav>

      {/* Fond semi-transparent quand sidebar ouverte */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1080,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Contenu principal */}
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          padding: '40px',
          paddingTop: '100px',
          fontFamily: "'Poppins', sans-serif",
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
