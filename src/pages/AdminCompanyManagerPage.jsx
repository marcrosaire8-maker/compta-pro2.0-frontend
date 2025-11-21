// src/pages/AdminCompanyManagerPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

export default function AdminCompanyManagerPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(null); // { id, name }

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('entreprises')
      .select('id_entreprise, nom_entreprise, date_creation')
      .order('date_creation', { ascending: false });
    if (error) {
      setError("Impossible de charger la liste des entreprises");
      console.error(error);
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    const { error: rpcError } = await supabase
      .rpc('delete_company', { p_entreprise_id: id });
    if (rpcError) {
      setError(`Échec de suppression : ${rpcError.message}`);
    } else {
      setSuccess(`Entreprise "${name}" supprimée avec succès (et toutes ses données)`);
      fetchCompanies();
      setTimeout(() => setSuccess(null), 5000);
    }
    setDeletingId(null);
    setShowConfirm(null);
  };

  const filteredCompanies = companies.filter(c =>
    c.nom_entreprise?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2rem' : '3rem';
  const headerSubtitleSize = isMobile ? '1rem' : '1.3rem';
  const containerPadding = isMobile ? '15px 0' : '28px';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: containerPadding,
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* En-tête principal */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '25px 20px' : '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(102, 126, 234, 0.3)',
        textAlign: 'center',
        marginBottom: '30px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: headerTitleSize,
          fontWeight: 800,
          margin: 0,
          letterSpacing: isMobile ? '-0.5px' : '-1px'
        }}>
          Gestion des Entreprises
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '10px 0 0',
          opacity: 0.95
        }}>
          Administration complète • Suppression sécurisée • Traçabilité totale
        </p>
      </div>
      {/* Messages */}
      {error && (
        <div style={{
          padding: '18px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 15px rgba(220,53,69,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-exclamation-triangle-fill fs-4"></i>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '18px',
          background: '#d1edda',
          color: '#155724',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 15px rgba(40,167,69,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-check-circle-fill fs-4"></i>
          {success}
        </div>
      )}
      {/* Barre de recherche */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '18px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        marginBottom: '30px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '15px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: isMobile ? '100%' : 'auto' }}>
          <i className="bi bi-search fs-4 text-primary"></i>
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: isMobile ? '10px' : '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              fontSize: isMobile ? '1rem' : '1.05rem'
            }}
          />
        </div>
        <div style={{
          background: '#0d6efd',
          color: 'white',
          padding: isMobile ? '8px 15px' : '12px 24px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: isMobile ? '0.9rem' : '1.1rem',
          textAlign: 'center',
          width: isMobile ? '100%' : 'auto'
        }}>
          {filteredCompanies.length} entreprise{filteredCompanies.length > 1 ? 's' : ''}
        </div>
      </div>
      {/* Tableau des entreprises */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }}></div>
            <p style={{ marginTop: '20px', fontSize: '1.3rem', color: '#666' }}>
              Chargement des entreprises...
            </p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: '100px', textAlign: 'center', color: '#888' }}>
            <i className="bi bi-building fs-1 opacity-50"></i>
            <p style={{ marginTop: '20px', fontSize: '1.4rem' }}>
              {searchTerm ? 'Aucune entreprise trouvée' : 'Aucune entreprise enregistrée'}
            </p>
          </div>
        ) : (
          isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
                    {filteredCompanies.map((comp) => (
                        <div key={comp.id_entreprise} style={{
                            background: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            borderLeft: '5px solid #667eea'
                        }}>
                            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {comp.nom_entreprise}
                            </p>
                            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.9rem' }}>
                                ID: {comp.id_entreprise}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                <div>
                                    <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Date Création:</strong>
                                    <span style={{ fontSize: '1rem' }}>
                                        {new Date(comp.date_creation).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'long', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                    <button
                                        style={{
                                            background: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        Audit
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm({ id: comp.id_entreprise, name: comp.nom_entreprise })}
                                        disabled={deletingId === comp.id_entreprise}
                                        style={{
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: deletingId ? 'not-allowed' : 'pointer',
                                            opacity: deletingId === comp.id_entreprise ? 0.6 : 1
                                        }}
                                    >
                                        {deletingId === comp.id_entreprise ? 'Suppression...' : 'Supprimer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#0d6efd', color: 'white' }}>
                    <th style={{ padding: '20px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '20px', textAlign: 'left', fontWeight: 600 }}>Nom de l'Entreprise</th>
                    <th style={{ padding: '20px', textAlign: 'left', fontWeight: 600 }}>Date de Création</th>
                    <th style={{ padding: '20px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((comp, i) => (
                  <tr
                    key={comp.id_entreprise}
                    style={{
                      background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                  >
                    <td style={{ padding: '20px', fontFamily: 'monospace', color: '#666' }}>
                      {comp.id_entreprise}
                    </td>
                    <td style={{ padding: '20px', fontWeight: 600, fontSize: '1.1rem' }}>
                      {comp.nom_entreprise}
                    </td>
                    <td style={{ padding: '20px', color: '#666' }}>
                      {new Date(comp.date_creation).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <button
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '10px',
                          marginRight: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      >
                        Audit
                      </button>
                      <button
                        onClick={() => setShowConfirm({ id: comp.id_entreprise, name: comp.nom_entreprise })}
                        disabled={deletingId === comp.id_entreprise}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '10px',
                          fontWeight: 600,
                          cursor: deletingId ? 'not-allowed' : 'pointer',
                          opacity: deletingId === comp.id_entreprise ? 0.6 : 1
                        }}
                      >
                        {deletingId === comp.id_entreprise ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            )
        )}
      </div>
      {/* Modal de confirmation personnalisé */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowConfirm(null)}>
          <div style={{
            background: 'white',
            padding: isMobile ? '30px' : '40px',
            borderRadius: '20px',
            maxWidth: isMobile ? '90%' : '500px',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <i className="bi bi-exclamation-triangle-fill fs-1 text-danger mb-4"></i>
            <h3 style={{ margin: '0 0 20px', fontSize: isMobile ? '1.4rem' : '1.6rem' }}>
              Confirmation de suppression
            </h3>
            <p style={{ color: '#555', marginBottom: '30px', lineHeight: '1.6', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
              Vous êtes sur le point de <strong>supprimer définitivement</strong> l'entreprise :<br/>
              <strong style={{ color: '#dc3545', fontSize: '1.2rem' }}>{showConfirm.name}</strong><br/><br/>
              Toutes les données comptables, factures, écritures, utilisateurs associés seront <strong>effacées irrémédiablement</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(null)}
                style={{
                  padding: '12px 30px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showConfirm.id, showConfirm.name)}
                style={{
                  padding: '12px 30px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Supprimer définitivement
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
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Rôle SuperAdmin requis • Suppression via fonction sécurisée • Cascade ON DELETE
        </p>
      </div>
    </div>
  );
}
