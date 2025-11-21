// src/pages/BilanPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

export default function BilanPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercices, setExercices] = useState([]);
  const [selectedExercice, setSelectedExercice] = useState('');
  const [bilan, setBilan] = useState(null);

  // Formatage monétaire
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0,00';
    return Math.abs(num).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // 1. Chargement des exercices
  useEffect(() => {
    const fetchExercices = async () => {
      const { data, error } = await supabase
        .from('exercicescomptables')
        .select('id_exercice, libelle, date_debut, date_fin')
        .order('date_debut', { ascending: false });

      if (error) {
        setError("Impossible de charger les exercices");
        console.error(error);
      } else {
        setExercices(data || []);
        if (data?.length > 0) {
          setSelectedExercice(data[0].id_exercice);
        }
      }
    };
    fetchExercices();
  }, []);

  // 2. Chargement du bilan
  useEffect(() => {
    if (!selectedExercice) return;

    const fetchBilan = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_bilan', { p_exercice_id: selectedExercice });

      if (error) {
        setError("Erreur lors du calcul du bilan : " + error.message);
        console.error(error);
      } else {
        setBilan(data?.[0] || null);
      }
      setLoading(false);
    };

    fetchBilan();
  }, [selectedExercice]);

  const currentExercice = exercices.find(e => e.id_exercice === selectedExercice);
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '4rem'; 
  const headerSubtitleSize = isMobile ? '1.1rem' : '1.6rem'; 
  const contentPadding = isMobile ? '20px' : '35px';
  const totalBoxFontSize = isMobile ? '1.2rem' : '1.4rem';
  const totalValueFontSize = isMobile ? '2rem' : '2.8rem';
  const sectionTitleFontSize = isMobile ? '1.5rem' : '2.2rem';
  const lineFontSize = isMobile ? '1rem' : '1.3rem';


  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '32px', // Pleine largeur mobile
      maxWidth: '1600px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* En-tête principal */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '30px 20px' : '60px 40px',
        borderRadius: '28px',
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 35px 80px rgba(102, 126, 234, 0.4)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: headerTitleSize,
          fontWeight: 800,
          margin: 0,
          letterSpacing: isMobile ? '-1.5px' : '-2.5px'
        }}>
          Bilan Comptable
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '15px 0 0',
          opacity: 0.95
        }}>
          Situation patrimoniale • Conformité SYSCOA Révisé • Clôture d’exercice
        </p>
      </div>

      {/* Sélecteur d'exercice */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '15px' : '30px',
        borderRadius: '20px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '20px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '10px' : '25px', width: isMobile ? '100%' : 'auto' }}>
          <div>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#666', marginBottom: '10px' }}>
              Exercice comptable sélectionné
            </div>
            <select
              value={selectedExercice}
              onChange={(e) => setSelectedExercice(e.target.value)}
              style={{
                padding: isMobile ? '12px 18px' : '16px 24px',
                borderRadius: '16px',
                border: '2px solid #0d6efd',
                fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: 600,
                width: isMobile ? '100%' : '380px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {exercices.map(ex => (
                <option key={ex.id_exercice} value={ex.id_exercice}>
                  {ex.libelle} — {formatDate(ex.date_debut)} → {formatDate(ex.date_fin)}
                </option>
              ))}
            </select>
          </div>
          {currentExercice && (
            <div style={{
              background: '#e3f2fd',
              color: '#0d6efd',
              padding: '12px 20px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.1rem',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center'
            }}>
              {currentExercice.libelle}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '20px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '18px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 6px 20px rgba(220,53,69,0.1)',
          margin: isMobile ? '0 15px 30px' : '0 auto'
        }}>
          <strong>⚠️ Erreur :</strong> {error}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div style={{
          padding: isMobile ? '80px' : '120px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
          <p style={{ marginTop: '30px', fontSize: '1.4rem', color: '#666' }}>
            Calcul du bilan en cours...
          </p>
        </div>
      )}

      {/* Bilan */}
      {!loading && bilan && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', // Empilement sur mobile
          gap: isMobile ? '30px' : '40px',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          {/* ACTIF */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.12)',
            border: '1px solid #eee'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              padding: isMobile ? '25px' : '35px',
              textAlign: 'center',
              fontSize: sectionTitleFontSize,
              fontWeight: 800
            }}>
              ACTIF
            </div>
            <div style={{ padding: contentPadding }}>
              <div style={{ marginBottom: isMobile ? '20px' : '25px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Actif Immobilisé</span>
                  <span style={{ fontWeight: 700, color: '#28a745' }}>
                    {formatNumber(bilan.actif_immobilise)} FCFA
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: isMobile ? '20px' : '25px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Actif Circulant</span>
                  <span style={{ fontWeight: 700, color: '#28a745' }}>
                    {formatNumber(bilan.actif_circulant)} FCFA
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: isMobile ? '25px' : '30px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Trésorerie Actif</span>
                  <span style={{ fontWeight: 700, color: '#28a745' }}>
                    {formatNumber(bilan.tresorerie_actif)} FCFA
                  </span>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
                padding: isMobile ? '18px' : '25px',
                borderRadius: '18px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: totalBoxFontSize, color: '#155724', marginBottom: '8px' }}>
                  TOTAL ACTIF
                </div>
                <div style={{
                  fontSize: totalValueFontSize,
                  fontWeight: 900,
                  color: '#155724',
                  letterSpacing: isMobile ? '-0.5px' : '-1px'
                }}>
                  {formatNumber(bilan.total_actif)} FCFA
                </div>
              </div>
            </div>
          </div>

          {/* PASSIF */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.12)',
            border: '1px solid #eee'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #dc3545, #e74c3c)',
              color: 'white',
              padding: isMobile ? '25px' : '35px',
              textAlign: 'center',
              fontSize: sectionTitleFontSize,
              fontWeight: 800
            }}>
              PASSIF
            </div>
            <div style={{ padding: contentPadding }}>
              <div style={{ marginBottom: isMobile ? '20px' : '25px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Capitaux Propres</span>
                  <span style={{ fontWeight: 700, color: '#dc3545' }}>
                    {formatNumber(bilan.capitaux_propres)} FCFA
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: isMobile ? '20px' : '25px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Dettes à Long Terme</span>
                  <span style={{ fontWeight: 700, color: '#dc3545' }}>
                    {formatNumber(bilan.dettes_long_terme || 0)} FCFA
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: isMobile ? '20px' : '25px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Passif Circulant</span>
                  <span style={{ fontWeight: 700, color: '#dc3545' }}>
                    {formatNumber(bilan.passif_circulant)} FCFA
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: isMobile ? '25px' : '30px', paddingBottom: '10px', borderBottom: '2px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: lineFontSize }}>
                  <span style={{ fontWeight: 600 }}>Trésorerie Passif</span>
                  <span style={{ fontWeight: 700, color: '#dc3545' }}>
                    {formatNumber(bilan.tresorerie_passif)} FCFA
                  </span>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
                padding: isMobile ? '18px' : '25px',
                borderRadius: '18px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: totalBoxFontSize, color: '#721c24', marginBottom: '8px' }}>
                  TOTAL PASSIF
                </div>
                <div style={{
                  fontSize: totalValueFontSize,
                  fontWeight: 900,
                  color: '#721c24',
                  letterSpacing: isMobile ? '-0.5px' : '-1px'
                }}>
                  {formatNumber(bilan.total_passif)} FCFA
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultat net mis en évidence */}
      {!loading && bilan && (
        <div style={{
          marginTop: '40px',
          padding: isMobile ? '25px' : '40px',
          background: bilan.resultat >= 0
            ? 'linear-gradient(135deg, #d4edda, #c3e6cb)'
            : 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
          borderRadius: '24px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <h2 style={{
            margin: '0 0 15px',
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            color: bilan.resultat >= 0 ? '#155724' : '#721c24'
          }}>
            RÉSULTAT DE L'EXERCICE
          </h2>
          <div style={{
            fontSize: isMobile ? '2.8rem' : '3.5rem',
            fontWeight: 900,
            color: bilan.resultat >= 0 ? '#155724' : '#721c24',
            letterSpacing: isMobile ? '-1.5px' : '-2px'
          }}>
            {bilan.resultat >= 0 ? '+' : ''}{formatNumber(bilan.resultat)} FCFA
          </div>
          <div style={{
            marginTop: '15px',
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: 600,
            color: bilan.resultat >= 0 ? '#155724' : '#721c24'
          }}>
            {bilan.resultat >= 0 ? 'BÉNÉFICE' : 'PERTE'}
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div style={{
        marginTop: '60px',
        padding: isMobile ? '30px' : '40px',
        background: '#f8f9fa',
        borderRadius: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '1rem',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Calculé via fonction SQL sécurisée • Mise à jour en temps réel • SYSCOA Révisé 2025
        </p>
      </div>
    </div>
  );
}
