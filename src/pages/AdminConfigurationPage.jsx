// src/pages/AdminConfigurationPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

// Styles de base des inputs/labels pour réutilisation
const inputBaseStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: '1rem'
};
const labelBaseStyle = { fontWeight: 600, display: 'block', marginBottom: '8px' };

export default function AdminConfigurationPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [comptesReference, setComptesReference] = useState([]);
  const [journauxReference, setJournauxReference] = useState([]);
  const [newJournal, setNewJournal] = useState({
    code_journal: '',
    libelle_journal: ''
  });
  // Codes obligatoires pour le bon fonctionnement des triggers
  const requiredJournals = ['VT', 'AC', 'OD', 'BQ', 'PA'];
  const requiredAccounts = ['445', '401', '411', '661', '664', '422', '431', '681', '701'];
  
  const fetchReferenceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [comptesRes, journauxRes] = await Promise.all([
        supabase
          .from('plansyscoamodele')
          .select('numero_compte, libelle_compte')
          .in('numero_compte', requiredAccounts.map(n => n.padStart(3, '0'))),
        supabase
          .from('journaux')
          .select('code_journal, libelle_journal')
          .in('code_journal', requiredJournals)
      ]);
      setComptesReference(comptesRes.data || []);
      setJournauxReference(journauxRes.data || []);
    } catch (err) {
      setError("Impossible de charger les données de configuration");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requiredAccounts, requiredJournals]);
  
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);
  
  const handleCreateJournal = async (e) => {
    e.preventDefault();
    if (!newJournal.code_journal || !newJournal.libelle_journal) {
      setError("Code et libellé obligatoires");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase
      .from('journaux')
      .insert({
        code_journal: newJournal.code_journal.toUpperCase().trim(),
        libelle_journal: newJournal.libelle_journal.trim()
      });
    if (error) {
      setError("Échec de création du journal : " + error.message);
    } else {
      setSuccess(`Journal "${newJournal.code_journal.toUpperCase()}" créé avec succès !`);
      setNewJournal({ code_journal: '', libelle_journal: '' });
      fetchReferenceData();
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2rem' : '3.2rem';
  const headerSubtitleSize = isMobile ? '1rem' : '1.4rem';
  const contentPadding = isMobile ? '15px' : '32px';
  const tableTitleSize = isMobile ? '1.5rem' : '1.8rem';
  const gridColumns = isMobile ? '1fr' : '1fr 1fr';
  const gridGap = isMobile ? '30px' : '35px';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '30px',
      maxWidth: '1500px',
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
        boxShadow: '0 25px 60px rgba(102, 126, 234, 0.3)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: headerTitleSize,
          fontWeight: 800,
          margin: 0,
          letterSpacing: isMobile ? '-0.5px' : '-1px'
        }}>
          Configuration Système Centrale
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '12px 0 0',
          opacity: 0.95
        }}>
          Vérification et correction des éléments critiques du moteur comptable
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
          boxShadow: '0 6px 20px rgba(220,53,69,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-exclamation-triangle-fill fs-3"></i>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '18px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 6px 20px rgba(40,167,69,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-check-circle-fill fs-3"></i>
          {success}
        </div>
      )}
      {/* Grille principale */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns, // 1fr sur mobile, 1fr 1fr sur desktop
        gap: gridGap,
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {/* === JOURNAUX ESSENTIELS === */}
        <div style={{
          background: '#ffffff',
          padding: contentPadding,
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          border: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
            <i className={`bi bi-journal-text fs-1 text-success ${isMobile ? 'mb-2' : 'me-3'}`}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: tableTitleSize, color: '#28a745' }}>
                Journaux Comptables Obligatoires
              </h2>
              <p style={{ margin: '8px 0 0', color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Ces journaux sont requis pour le fonctionnement des écritures automatiques
              </p>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
          ) : (
            <>
                {isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES (Journaux) ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {requiredJournals.map(code => {
                            const journal = journauxReference.find(j => j.code_journal === code);
                            const isMissing = !journal;
                            const statusColor = isMissing ? '#ef4444' : '#22c55e';
                            const statusBg = isMissing ? '#fee2e2' : '#dcfce7';

                            return (
                                <div key={code} style={{
                                    background: '#f8f9fa',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    borderLeft: `5px solid ${statusColor}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: '0 0 5px 0', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.2rem' }}>
                                                {code}
                                            </p>
                                            <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                                {journal ? journal.libelle_journal : 'Journal Manquant'}
                                            </span>
                                        </div>
                                        <span style={{
                                            padding: '8px 16px',
                                            borderRadius: '30px',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            background: statusBg,
                                            color: statusColor
                                        }}>
                                            {isMissing ? 'MANQUANT' : 'PRÉSENT'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE (Journaux) ---
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', borderRadius: '12px 0 0 12px' }}>Code</th>
                                    <th style={{ padding: '16px', textAlign: 'left' }}>Libellé</th>
                                    <th style={{ padding: '16px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requiredJournals.map(code => {
                                    const journal = journauxReference.find(j => j.code_journal === code);
                                    const isMissing = !journal;
                                    const statusColor = isMissing ? '#ef4444' : '#22c55e';
                                    const statusBg = isMissing ? '#fee2e2' : '#dcfce7';

                                    return (
                                        <tr key={code} style={{
                                            background: isMissing ? '#fee2e2' : '#f0fdf4',
                                            borderLeft: `6px solid ${statusColor}`
                                        }}>
                                            <td style={{ padding: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                                                {code}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {journal ? journal.libelle_journal : '— Non défini —'}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '30px',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    background: statusBg,
                                                    color: statusColor
                                                }}>
                                                    {isMissing ? 'MANQUANT' : 'PRÉSENT'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
              
              {/* Formulaire d'ajout */}
              <div style={{
                marginTop: isMobile ? '25px' : '30px',
                padding: isMobile ? '15px' : '24px',
                background: '#f8f9fa',
                borderRadius: '16px',
                border: '2px dashed #28a745'
              }}>
                <h3 style={{ margin: '0 0 20px', color: '#166534', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
                  Ajouter un journal manquant
                </h3>
                <form onSubmit={handleCreateJournal} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : '120px 1fr 140px', 
                    gap: '15px', 
                    alignItems: 'end' 
                }}>
                  <div>
                    <label style={labelBaseStyle}>Code</label>
                    <input
                      type="text"
                      name="code_journal"
                      value={newJournal.code_journal}
                      onChange={(e) => setNewJournal({ ...newJournal, code_journal: e.target.value.toUpperCase() })}
                      style={{ ...inputBaseStyle, fontWeight: 'bold', textAlign: 'center' }}
                      maxLength={3}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelBaseStyle}>Libellé</label>
                    <input
                      type="text"
                      name="libelle_journal"
                      value={newJournal.libelle_journal}
                      onChange={(e) => setNewJournal({ ...newJournal, libelle_journal: e.target.value })}
                      placeholder="Ex: Ventes de marchandises"
                      style={inputBaseStyle}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: isMobile ? '12px 20px' : '12px 20px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    Créer le journal
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        {/* === COMPTES CLÉS === */}
        <div style={{
          background: '#ffffff',
          padding: contentPadding,
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          border: '1px solid #eee',
            marginTop: isMobile ? '30px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
            <i className={`bi bi-calculator fs-1 text-primary ${isMobile ? 'mb-2' : 'me-3'}`}></i>
            <div>
              <h2 style={{ margin: 0, fontSize: tableTitleSize, color: '#0d6efd' }}>
                Comptes Clés du Plan Maître
              </h2>
              <p style={{ margin: '8px 0 0', color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Comptes indispensables au calcul du résultat, TVA, trésorerie...
              </p>
            </div>
          </div>
          {isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES (Comptes) ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {requiredAccounts.map(num => {
                        const compte = comptesReference.find(c => c.numero_compte.startsWith(num));
                        const isMissing = !compte;
                        const statusColor = isMissing ? '#f59e0b' : '#22c55e';
                        const statusBg = isMissing ? '#fef3c7' : '#dcfce7';

                        return (
                            <div key={num} style={{
                                background: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '12px',
                                borderLeft: `5px solid ${statusColor}`
                            }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.2rem' }}>
                                    Compte {num}
                                </p>
                                <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                    {compte ? compte.libelle_compte : 'Libellé Manquant'}
                                </span>
                                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                                    <span style={{
                                        padding: '8px 16px',
                                        borderRadius: '30px',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        background: statusBg,
                                        color: statusColor
                                    }}>
                                        {isMissing ? 'À AJOUTER' : 'PRÉSENT'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE (Comptes) ---
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ background: '#f0f7ff' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderRadius: '12px 0 0 12px' }}>N° Compte</th>
                                <th style={{ padding: '16px', textAlign: 'left' }}>Libellé dans le Plan Maître</th>
                                <th style={{ padding: '16px', textAlign: 'center', borderRadius: '0 12px 12px 0' }}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requiredAccounts.map(num => {
                                const compte = comptesReference.find(c => c.numero_compte.startsWith(num));
                                const isMissing = !compte;
                                const statusColor = isMissing ? '#f59e0b' : '#22c55e';
                                const statusBg = isMissing ? '#fef3c7' : '#dcfce7';
                                return (
                                    <tr key={num} style={{
                                        background: isMissing ? '#fef3c7' : '#f0fdf4',
                                        borderLeft: `6px solid ${statusColor}`
                                    }}>
                                        <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 700 }}>
                                            {num}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {compte ? compte.libelle_compte : '— Non défini dans le Plan Maître —'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '8px 16px',
                                                borderRadius: '30px',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                background: statusBg,
                                                color: statusColor
                                            }}>
                                                {isMissing ? 'À AJOUTER' : 'PRÉSENT'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
          <div style={{
            marginTop: '25px',
            padding: '20px',
            background: '#fffbeb',
            borderRadius: '14px',
            border: '1px solid #fde68a'
          }}>
            <p style={{ margin: 0, color: '#92400e', fontSize: '1rem' }}>
              <strong>Note :</strong> Ces comptes doivent être créés via la page <strong>"Gérer le Plan Comptable Maître"</strong> (Admin → Plan Syscoa).
            </p>
          </div>
        </div>
      </div>
      {/* Pied de page */}
      <div style={{
        marginTop: '40px',
        textAlign: 'center',
        color: '#888',
        fontSize: '0.95rem',
        padding: '30px',
        background: '#f8f9fa',
        borderRadius: '16px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Configuration critique • SuperAdmin uniquement • Impact sur tous les calculs automatiques
        </p>
      </div>
    </div>
  );
}
