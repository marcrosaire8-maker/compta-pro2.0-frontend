// src/pages/SuperAdminPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0,00';
  return parseFloat(num || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function SuperAdminPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [synthese, setSynthese] = useState([]);
  const [dbStats, setDbStats] = useState([]);

  useEffect(() => {
    async function fetchSuperAdminData() {
      setLoading(true);
      setError(null);
      try {
        const [syntheseRes, statsRes] = await Promise.all([
          supabase.rpc('get_synthese_super_admin'),
          supabase.rpc('get_platform_stats')
        ]);

        if (syntheseRes.error) {
          if (syntheseRes.error.code === '42501') {
            setError("Accès refusé : vous n'êtes pas autorisé en tant que Super Administrateur.");
          } else {
            setError(syntheseRes.error.message);
          }
        } else {
          setSynthese(syntheseRes.data || []);
        }

        if (statsRes.error) {
          console.warn("Stats indisponibles", statsRes.error);
        } else {
          setDbStats(statsRes.data || []);
        }
      } catch (err) {
        setError("Erreur critique : " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSuperAdminData();
  }, []);

  const groupedData = synthese.reduce((acc, item) => {
    const key = item.id_entreprise;
    if (!acc[key]) {
      acc[key] = {
        nom_entreprise: item.nom_entreprise || 'Entreprise inconnue',
        comptes: []
      };
    }
    acc[key].comptes.push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: "'Poppins', sans-serif",
        color: '#166534'
      }}>
        <div style={{
          width: '6rem',
          height: '6rem',
          border: '8px solid #dcfce7',
          borderTop: '8px solid #16a34a',
          borderRadius: '50%',
          animation: 'spin 1.2s linear infinite',
          marginBottom: '30px'
        }}></div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Accès Super Admin en cours...</h2>
        <p style={{ opacity: 0.8, fontSize: '1.3rem' }}>Vérification des privilèges élevés...</p>
      </div>
    );
  }
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '3.5rem' : '6.5rem';
  const headerSubtitleSize = isMobile ? '1.2rem' : '2.4rem';
  const headerSubtextSize = isMobile ? '1rem' : '1.4rem';
  const contentPadding = isMobile ? '20px' : '50px';
  const tableTitleSize = isMobile ? '2rem' : '3rem';
  const entrepriseTitleSize = isMobile ? '2.2rem' : '3.2rem';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: "'Poppins', sans-serif",
      color: '#1f2937',
      padding: isMobile ? '15px 0' : '40px 20px'
    }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>

        {/* HEADER PRESTIGE VERT */}
        <div style={{
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          padding: isMobile ? '40px 20px' : '80px 60px',
          borderRadius: '32px',
          textAlign: 'center',
          marginBottom: '40px',
          boxShadow: '0 30px 80px rgba(22, 163, 74, 0.25)',
          border: '1px solid #86efac',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <h1 style={{
            fontSize: headerTitleSize,
            fontWeight: 900,
            margin: 0,
            letterSpacing: isMobile ? '-2px' : '-4px',
            color: 'white',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            SUPER ADMIN
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '20px 0 0', color: '#ecfdf5', fontWeight: 600 }}>
            Contrôle total de la plateforme ComptaPro
          </p>
          <p style={{ fontSize: headerSubtextSize, marginTop: '10px', color: '#dcfce7' }}>
            Vision agrégée • Sécurité maximale • Administration complète
          </p>
        </div>

        {/* ERREUR D'ACCÈS */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #f87171',
            color: '#991b1b',
            padding: isMobile ? '25px' : '40px',
            borderRadius: '24px',
            marginBottom: '30px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(254, 226, 226, 0.6)',
            margin: isMobile ? '0 15px' : '0 auto'
          }}>
            <h3 style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 800 }}>ACCÈS REFUSÉ</h3>
            <p style={{ fontSize: '1.2rem', margin: '15px 0' }}>{error}</p>
            <p style={{ opacity: 0.8, background: '#fef2f2', padding: '10px', borderRadius: '12px', display: 'inline-block', fontSize: '0.9rem' }}>
              Seuls les utilisateurs dans la table <code style={{ fontWeight: 'bold' }}>superadmins</code> ont accès.
            </p>
          </div>
        )}

        {/* AUDIT DE LA PLATEFORME */}
        <div style={{
          background: 'white',
          borderRadius: '32px',
          padding: contentPadding,
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <h2 style={{
            fontSize: tableTitleSize,
            marginBottom: '30px',
            color: '#16a34a',
            fontWeight: 800,
            borderBottom: '4px solid #86efac',
            paddingBottom: '15px',
            display: 'inline-block'
          }}>
            Audit de la Plateforme
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
          ) : (
            isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES (Stats BD) ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dbStats.map((stat, i) => (
                            <div key={i} style={{
                                background: '#f0fdf4',
                                padding: '15px',
                                borderRadius: '12px',
                                borderLeft: '5px solid #16a34a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    {stat.table_name}
                                </span>
                                <span style={{ padding: '4px 10px', background: '#dcfce7', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace' }}>
                                    {stat.row_count.toLocaleString('fr-FR')} lignes
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE (Stats BD) ---
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                  <thead>
                    <tr style={{ background: '#ecfdf5' }}>
                      <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px', fontWeight: 700, color: '#166534' }}>Table</th>
                      <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 16px 16px 0', fontWeight: 700, color: '#166534' }}>Nombre de lignes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbStats.map((stat, i) => (
                      <tr key={i} style={{ background: '#f0fdf4' }}>
                        <td style={{ padding: '20px', fontWeight: 600, borderRadius: '12px 0 0 12px' }}>
                          {stat.table_name}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', borderRadius: '0 12px 12px 0' }}>
                          {stat.row_count.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
            )
          )}
        </div>

        {/* SYNTHÈSE PAR ENTREPRISE */}
        {Object.entries(groupedData).length === 0 && !error && !loading && (
          <div style={{ textAlign: 'center', padding: '120px 40px', background: 'white', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', margin: isMobile ? '0 15px' : '0 auto' }}>
            <h3 style={{ fontSize: '2rem', color: '#16a34a' }}>Aucune donnée financière disponible</h3>
            <p style={{ fontSize: '1.2rem', color: '#6b7280', marginTop: '15px' }}>Les entreprises n'ont pas encore enregistré d'écritures comptables.</p>
          </div>
        )}

        {Object.entries(groupedData).map(([id, entreprise]) => (
          <div key={id} style={{
            background: 'white',
            borderRadius: '32px',
            padding: contentPadding,
            marginBottom: '30px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            margin: isMobile ? '0 15px' : '0 auto'
          }}>
            <h2 style={{
              fontSize: entrepriseTitleSize,
              fontWeight: 900,
              marginBottom: '30px',
              color: '#166534',
              borderBottom: '5px solid #22c55e',
              paddingBottom: '15px',
              display: 'inline-block'
            }}>
              {entreprise.nom_entreprise}
            </h2>
            {isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES (Synthèse) ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entreprise.comptes.map(compte => {
                        const solde = (compte.solde_debit || 0) - (compte.solde_credit || 0);
                        const soldeAbs = Math.abs(solde);
                        const isDebit = solde >= 0;
                        const soldeColor = solde > 0 ? '#16a34a' : solde < 0 ? '#dc2626' : '#6b7280';

                        return (
                            <div key={compte.classe_compte} style={{
                                background: '#f8fff9',
                                padding: '15px',
                                borderRadius: '12px',
                                borderLeft: `5px solid ${soldeColor}`,
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: '1.1rem', color: '#166534' }}>
                                    CLASSE {compte.classe_compte}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                                    <div>Débit: <span style={{ fontWeight: 600 }}>{formatNumber(compte.total_debit)}</span></div>
                                    <div>Crédit: <span style={{ fontWeight: 600 }}>{formatNumber(compte.total_credit)}</span></div>
                                </div>
                                <hr style={{ margin: '10px 0', borderTop: '1px dashed #e5e7eb' }}/>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '1rem', color: '#1f2937' }}>Solde:</strong>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace', color: soldeColor }}>
                                        {formatNumber(soldeAbs)} {solde !== 0 && (isDebit ? '(D)' : '(C)')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr style={{ background: '#ecfdf5' }}>
                    <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px', color: '#166534', fontWeight: 700 }}>Classe</th>
                    <th style={{ padding: '20px', textAlign: 'right', color: '#166534', fontWeight: 700 }}>Total Débit</th>
                    <th style={{ padding: '20px', textAlign: 'right', color: '#166534', fontWeight: 700 }}>Total Crédit</th>
                    <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 16px 16px 0', color: '#166534', fontWeight: 700 }}>Solde</th>
                </tr>
                </thead>
                <tbody>
                  {entreprise.comptes.map(compte => {
                    const solde = (compte.solde_debit || 0) - (compte.solde_credit || 0);
                    const soldeColor = solde > 0 ? '#16a34a' : solde < 0 ? '#dc2626' : '#6b7280';
                    return (
                      <tr key={compte.classe_compte} style={{ background: '#f8fff9' }}>
                        <td style={{ padding: '20px', fontWeight: 700, borderRadius: '12px 0 0 12px', color: '#166534' }}>
                          Classe {compte.classe_compte}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'monospace', color: '#166534' }}>
                          {formatNumber(compte.total_debit)}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'monospace', color: '#166534' }}>
                          {formatNumber(compte.total_credit)}
                        </td>
                        <td style={{
                          padding: '20px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontSize: '1.4rem',
                          fontWeight: 'bold',
                          color: soldeColor,
                          borderRadius: '0 12px 12px 0'
                        }}>
                          {formatNumber(Math.abs(solde))} {solde < 0 ? '(créditeur)' : solde > 0 ? '(débiteur)' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        ))}

        {/* FOOTER ÉLÉGANT */}
        <div style={{
          marginTop: '40px',
          padding: isMobile ? '30px' : '60px 40px',
          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
          borderRadius: '32px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: isMobile ? '1rem' : '1.2rem',
          border: '2px solid #86efac',
          boxShadow: '0 20px 50px rgba(134, 239, 172, 0.2)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <p style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', color: '#166534', fontWeight: 700 }}>
            ComptaPro • Super Administration • 100% Afrique de l’Ouest
          </p>
          <p style={{ marginTop: '10px', fontSize: '1rem', color: '#16a34a', opacity: 0.9 }}>
            Vous avez le contrôle total. Utilisez ce pouvoir avec sagesse.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
