// src/pages/AdminActivityLogPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

export default function AdminActivityLogPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivityLog();
  }, []);

  const fetchActivityLog = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_global_activity_log');
    if (error) {
      setError("Impossible de charger l'historique d'activité");
      console.error(error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0,00';
    return parseFloat(num).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtrage
  const filteredActivities = activities.filter(act =>
    act.nom_ent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.num_compte?.includes(searchTerm) ||
    act.libelle_op?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // --- STYLES CONDITIONNELS ---
  const containerPadding = isMobile ? '15px 0' : '28px';
  const headerTitleSize = isMobile ? '2rem' : '2.8rem';
  const searchPadding = isMobile ? '15px' : '20px';


  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: containerPadding,
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* En-tête */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '20px' : '32px',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        marginBottom: '25px',
        textAlign: 'center',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: headerTitleSize,
          fontWeight: 700,
          color: '#0d6efd',
          margin: 0
        }}>
          Audit Global des Activités
        </h1>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: '#555',
          margin: '10px 0 0'
        }}>
          Historique complet et sécurisé de toutes les écritures comptables de la plateforme
        </p>
      </div>
      {/* Barre de recherche */}
      <div style={{
        background: '#ffffff',
        padding: searchPadding,
        borderRadius: '16px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        marginBottom: '25px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '15px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: isMobile ? '100%' : 'auto' }}>
          <i className="bi bi-search fs-4 text-primary"></i>
          <input
            type="text"
            placeholder="Rechercher par entreprise, compte, libellé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: isMobile ? '10px' : '14px',
              border: '1px solid #ddd',
              borderRadius: '12px',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}
          />
        </div>
        <div style={{
          background: '#0d6efd',
          color: 'white',
          padding: isMobile ? '8px 15px' : '10px 20px',
          borderRadius: '12px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {filteredActivities.length} écritures
        </div>
      </div>
      {/* Messages */}
      {error && (
        <div style={{
          padding: '18px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-exclamation-triangle-fill fs-3"></i>
          {error}
        </div>
      )}
      {/* Tableau */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }}></div>
            <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#666' }}>
              Chargement de l'historique complet...
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>
            <i className="bi bi-journal-text fs-1 opacity-50"></i>
            <p style={{ marginTop: '16px', fontSize: '1.3rem' }}>
              {searchTerm ? 'Aucune écriture trouvée' : 'Aucune activité enregistrée pour le moment'}
            </p>
          </div>
        ) : (
          isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES (Journal d'activité) ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
                    {filteredActivities.map((act, i) => {
                        const isValidee = act.statut === 'Validee';
                        const debit = act.montant_debit > 0 ? formatNumber(act.montant_debit) : '—';
                        const credit = act.montant_credit > 0 ? formatNumber(act.montant_credit) : '—';

                        return (
                            <div key={i} style={{
                                background: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: `5px solid ${isValidee ? '#0d6efd' : '#856404'}`,
                                opacity: isValidee ? 1 : 0.9
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
                                        {formatDate(act.date_op)}
                                    </span>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '30px', 
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: isValidee ? '#d4edda' : '#fff3cd',
                                        color: isValidee ? '#155724' : '#856404'
                                    }}>
                                        {isValidee ? 'VALIDÉE' : 'BROUILLON'}
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1rem' }}>
                                    {act.libelle_op || '—'}
                                </p>

                                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>
                                    Ent.: {act.nom_ent || '—'} | Cpt: {act.num_compte || '—'}
                                </p>
                                
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #e5e7eb' }}/>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                    <div>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Débit:</strong>
                                        <span style={{ fontWeight: 700, color: '#28a745', fontFamily: 'monospace' }}>
                                            {debit}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Crédit:</strong>
                                        <span style={{ fontWeight: 700, color: '#dc3545', fontFamily: 'monospace' }}>
                                            {credit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#0d6efd', color: 'white' }}>
                    <th style={{ padding: '18px 16px', textAlign: 'left', fontWeight: 600 }}>Date & Heure</th>
                    <th style={{ padding: '18px 16px', textAlign: 'left' }}>Entreprise</th>
                    <th style={{ padding: '18px 16px', textAlign: 'left' }}>Journal</th>
                    <th style={{ padding: '18px 16px', textAlign: 'left' }}>Compte</th>
                    <th style={{ padding: '18px 16px', textAlign: 'left' }}>Libellé</th>
                    <th style={{ padding: '18px 16px', textAlign: 'right' }}>Débit</th>
                    <th style={{ padding: '18px 16px', textAlign: 'right' }}>Crédit</th>
                    <th style={{ padding: '18px 16px', textAlign: 'center' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      transition: 'all 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                  >
                    <td style={{ padding: '16px', fontSize: '0.95rem', color: '#444' }}>
                      {formatDate(act.date_op)}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>
                      {act.nom_ent || '—'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: '#e9ecef',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {act.journal_code || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {act.num_compte || '—'}
                    </td>
                    <td style={{ padding: '16px', maxWidth: '300px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={act.libelle_op}>
                        {act.libelle_op || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: act.montant_debit > 0 ? '#28a745' : '#666' }}>
                      {act.montant_debit > 0 ? formatNumber(act.montant_debit) : '—'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: act.montant_credit > 0 ? '#dc3545' : '#666' }}>
                      {act.montant_credit > 0 ? formatNumber(act.montant_credit) : '—'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: act.statut === 'Validee' ? '#d4edda' : '#fff3cd',
                        color: act.statut === 'Validee' ? '#155724' : '#856404'
                      }}>
                        {act.statut === 'Validee' ? 'Validée' : 'Brouillon'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            )
        )}
      </div>
      {/* Pied de page */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: '#888',
        fontSize: '0.9rem',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Lecture seule • Traçabilité totale • Conformité SYSCOHADA
        </p>
      </div>
    </div>
  );
}
