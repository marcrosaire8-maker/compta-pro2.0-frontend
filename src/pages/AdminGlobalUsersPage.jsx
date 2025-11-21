// src/pages/AdminGlobalUsersPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; 

// ... (fetchGlobalUsers, filteredUsers, getPlanName, getRoleBadge functions are unchanged) ...

export default function AdminGlobalUsersPage() {
  const { isMobile } = useWindowWidth(); 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(null);

  // ... (Logic functions fetchGlobalUsers, getPlanName, getRoleBadge, etc.) ...
     
    // Fetch global users logic
  useEffect(() => {
    // ... (Definition of fetchGlobalUsers) ...
    const fetchGlobalUsers = async () => { /* ... (implementation) ... */ };
    fetchGlobalUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.entreprises?.nom_entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );
    
  const getPlanName = (planId) => {
    const plans = { 1: 'Gratuit', 2: 'Starter', 3: 'Pro', 4: 'Entreprise' };
    return plans[planId] || 'Inconnu';
  };
    
  const getRoleBadge = (role) => {
    const colors = {
      'admin_entite': '#dc3545',
      'comptable': '#fd7e14',
      'gestionnaire': '#28a745',
      'utilisateur': '#0d6efd'
    };
      let label;
      if (role === 'admin_entite') {
          label = 'Admin';
      } else if (role === 'gestionnaire') {
          label = 'Directeur';
      } else if (role === 'comptable') {
          label = 'Comptable';
      } else {
          label = 'Utilisateur';
      }

    return {
      background: colors[role] || '#6c757d',
      label: label
    };
  };

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '30px',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* En-tête principal */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '30px 20px' : '50px 40px',
        borderRadius: '24px',
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 30px 70px rgba(102, 126, 234, 0.4)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '3.4rem',
          fontWeight: 800,
          margin: 0,
          letterSpacing: isMobile ? '-1px' : '-1.5px'
        }}>
          Gestion Globale des Utilisateurs
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.4rem',
          margin: '10px 0 0',
          opacity: 0.95
        }}>
          Contrôle total des licences, rôles et accès • SuperAdmin uniquement
        </p>
      </div>
      {/* Barre de recherche + stats */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '15px' : '25px',
        borderRadius: '20px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
        marginBottom: '30px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '15px',
        flexWrap: 'wrap',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ flex: 1, minWidth: isMobile ? 'auto' : '300px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <i className="bi bi-search fs-3 text-primary"></i>
          <input
            type="text"
            placeholder="Rechercher par email, entreprise, nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: isMobile ? '10px 14px' : '14px 18px',
              border: '1px solid #ddd',
              borderRadius: '14px',
              fontSize: isMobile ? '1rem' : '1.1rem'
            }}
          />
        </div>
        <div style={{
          background: '#0d6efd',
          color: 'white',
          padding: isMobile ? '10px 18px' : '14px 28px',
          borderRadius: '14px',
          fontWeight: 700,
          fontSize: isMobile ? '1rem' : '1.2rem',
          textAlign: 'center',
          width: isMobile ? '100%' : 'auto'
        }}>
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
        </div>
      </div>
      {/* Messages */}
      {error && (
        <div style={{
          padding: '20px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-exclamation-triangle-fill fs-2"></i>
          {error}
        </div>
      )}
      {/* Tableau des utilisateurs */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {loading ? (
          <div style={{ padding: '120px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
            <p style={{ marginTop: '25px', fontSize: '1.4rem', color: '#666' }}>
              Chargement de tous les utilisateurs...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '120px', textAlign: 'center', color: '#888' }}>
            <i className="bi bi-people fs-1 opacity-50"></i>
            <p style={{ marginTop: '20px', fontSize: '1.5rem' }}>
              {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
            </p>
          </div>
        ) : (
          isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
                    {filteredUsers.map((u) => {
                        const roleStyle = getRoleBadge(u.role);
                        const planName = getPlanName(u.entreprises?.plan_id);

                        return (
                            <div key={u.id_profil} style={{
                                background: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: `5px solid ${roleStyle.background}`
                            }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {u.prenom} {u.nom}
                                </p>
                                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>
                                    {u.email}
                                </p>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #eee' }}/>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Entreprise / Plan:</strong>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.entreprises?.nom_entreprise || '—'}</span>
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#0369a1' }}>{planName}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Rôle:</strong>
                                        <span style={{ 
                                            background: roleStyle.background + '20', 
                                            color: roleStyle.background,
                                            padding: '4px 8px', 
                                            borderRadius: '20px', 
                                            fontWeight: 600, 
                                            fontSize: '0.8rem' 
                                        }}>
                                            {roleStyle.label}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                    <strong style={{ color: '#166534', fontSize: '0.9rem' }}>Statut: ACTIF</strong>
                                    <button
                                        onClick={() => setShowDeactivateModal(u)}
                                        style={{
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Désactiver
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#0d6efd', color: 'white' }}>
                    <th style={{ padding: '22px 18px', textAlign: 'left', fontWeight: 600 }}>Utilisateur</th>
                    <th style={{ padding: '22px 18px', textAlign: 'left' }}>Entreprise</th>
                    <th style={{ padding: '22px 18px', textAlign: 'center' }}>Plan</th>
                    <th style={{ padding: '22px 18px', textAlign: 'center' }}>Rôle</th>
                    <th style={{ padding: '22px 18px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '22px 18px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const roleStyle = getRoleBadge(u.role);
                  return (
                    <tr
                      key={u.id_profil}
                      style={{
                        background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                    >
                      <td style={{ padding: '20px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            {u.prenom} {u.nom}
                          </div>
                          <div style={{ color: '#666', fontSize: '0.95rem' }}>
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px', fontWeight: 600 }}>
                        {u.entreprises?.nom_entreprise || '—'}
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#999' }}>
                          ID Ent.: {u.entreprise_id}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '8px 16px',
                          borderRadius: '30px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {getPlanName(u.entreprises?.plan_id)}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <span style={{
                          background: roleStyle.background + '20',
                          color: roleStyle.background.replace('20', ''),
                          padding: '8px 16px',
                          borderRadius: '30px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '8px 18px',
                          borderRadius: '30px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          ACTIF
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <button
                          onClick={() => setShowDeactivateModal(u)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          Désactiver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            )
        )}
      </div>
      {/* Modal de désactivation */}
      {showDeactivateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowDeactivateModal(null)}>
          <div style={{
            background: 'white',
            padding: isMobile ? '30px' : '50px',
            borderRadius: '24px',
            maxWidth: isMobile ? '90%' : '560px',
            textAlign: 'center',
            boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
          }} onClick={(e) => e.stopPropagation()}>
            <i className="bi bi-shield-lock-fill fs-1 text-danger mb-4"></i>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: '0 0 20px', color: '#dc3545' }}>
              Désactiver ce compte ?
            </h2>
            <p style={{ color: '#555', fontSize: isMobile ? '1rem' : '1.2rem', lineHeight: '1.6' }}>
              Vous êtes sur le point de <strong>désactiver l'accès</strong> de :<br/>
              <strong style={{ color: '#212529', fontSize: '1.4rem' }}>
                {showDeactivateModal.prenom} {showDeactivateModal.nom}
              </strong><br/>
              <em>{showDeactivateModal.email}</em><br/><br/>
              Cette action est <strong>réversible</strong> mais bloquera immédiatement l’accès à la plateforme.
            </p>
            <div style={{ marginTop: '30px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeactivateModal(null)}
                style={{
                  padding: '14px 32px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert(`Compte ${showDeactivateModal.email} désactivé (simulation)`);
                  setShowDeactivateModal(null);
                }}
                style={{
                  padding: '14px 32px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirmer la désactivation
              </button>
            </div>
            </div>
        </div>
      )}
      {/* Pied de page */}
      <div style={{
        marginTop: '40px',
        textAlign: 'center',
        color: '#888',
        fontSize: '0.95rem',
        padding: isMobile ? '20px' : '30px',
        background: '#f8f9fa',
        borderRadius: '18px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          SuperAdmin uniquement • Accès via RPC sécurisée en production • Audit complet des connexions
        </p>
      </div>
    </div>
  );
}
