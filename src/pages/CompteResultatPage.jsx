// src/pages/CompteResultatPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

// Le Hook useMemo a été ajouté ici car il manquait dans les imports originaux (bien qu'il ne soit pas utilisé dans le code fourni, il est souvent utile dans les pages analytiques)

// Formatage monétaire
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0,00';
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return num < 0 ? `(${formatted})` : formatted;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// --- Composants internes adaptés au mobile ---

// Composant pour les lignes de détail (Produit ou Charge)
function Line({ label, value, negative = false, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      // Padding réduit sur mobile
      padding: isMobile ? '12px 15px' : '18px 25px', 
      background: '#f8f9fa',
      borderRadius: '16px',
      // Taille de police réduite
      fontSize: isMobile ? '1rem' : '1.25rem' 
    }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{
        fontWeight: 700,
        color: negative ? '#dc3545' : '#28a745',
        fontFamily: 'monospace'
      }}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

// Composant pour les lignes de résultat intermédiaires (Marge, Résultat Exploitation, etc.)
function ResultLine({ label, value, big = false, huge = false, isMobile }) {
  const isPositive = value >= 0;
  
  // Ajustement des tailles de police et padding pour le mobile
  let fontSizeLabel = '1.5rem';
  let fontSizeValue = '1.8rem';
  let padding = '22px 28px';

  if (huge) {
      fontSizeLabel = isMobile ? '1.5rem' : '2.2rem';
      fontSizeValue = isMobile ? '2rem' : '2.8rem';
      padding = isMobile ? '30px 20px' : '40px 35px';
  } else if (big) {
      fontSizeLabel = isMobile ? '1.2rem' : '1.8rem';
      fontSizeValue = isMobile ? '1.6rem' : '2.2rem';
      padding = isMobile ? '20px 15px' : '30px 30px';
  } else if (isMobile) {
      fontSizeLabel = '1.1rem';
      fontSizeValue = '1.4rem';
      padding = '15px 15px';
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: padding,
      background: isPositive ? '#d4edda' : '#f8d7da',
      borderRadius: '20px',
      fontSize: fontSizeLabel,
      border: `4px solid ${isPositive ? '#28a745' : '#dc3545'}`
    }}>
      <span style={{ fontWeight: 800, color: isPositive ? '#155724' : '#721c24' }}>
        {label}
      </span>
      <span style={{
        fontWeight: 900,
        color: isPositive ? '#155724' : '#721c24',
        fontFamily: 'monospace',
        fontSize: fontSizeValue
      }}>
        {isPositive ? '+' : ''}{formatNumber(value)}
      </span>
    </div>
  );
}

// Composant pour les titres de section (Exploitation, Financier...)
function Section({ title, color, children, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? '30px' : '50px' }}>
      <h3 style={{
        fontSize: isMobile ? '1.5rem' : '1.8rem',
        fontWeight: 700,
        color: color,
        margin: '0 0 20px',
        paddingBottom: '10px',
        borderBottom: `4px solid ${color}`
      }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gap: isMobile ? '10px' : '16px' }}>
        {children}
      </div>
    </div>
  );
}


export default function CompteResultatPage() {
  const { isMobile } = useWindowWidth(); // <-- Utilisation du Hook
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercices, setExercices] = useState([]);
  const [selectedExercice, setSelectedExercice] = useState('');
  const [resultat, setResultat] = useState(null);

  // ... (formatNumber, formatDate, fetchExercices, fetchResultat sont inchangés) ...

  // 1. Chargement des exercices
  useEffect(() => {
    const fetchExercices = async () => {
      const { data, error } = await supabase
        .from('exercicescomptables')
        .select('id_exercice, libelle, date_debut, date_fin')
        .order('date_debut', { ascending: false });

      if (error) {
        setError("Impossible de charger les exercices");
      } else {
        setExercices(data || []);
        if (data?.length > 0) {
          setSelectedExercice(data[0].id_exercice);
        }
      }
    };
    fetchExercices();
  }, []);

  // 2. Chargement du compte de résultat
  useEffect(() => {
    if (!selectedExercice) return;

    const fetchResultat = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_compte_de_resultat', { p_exercice_id: selectedExercice });

      if (error) {
        setError("Erreur lors du calcul du compte de résultat : " + error.message);
        console.error(error);
      } else {
        setResultat(data?.[0] || null);
      }
      setLoading(false);
    };

    fetchResultat();
  }, [selectedExercice]);

  const currentExercice = exercices.find(e => e.id_exercice === selectedExercice);
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.8rem' : '4.5rem';
  const headerSubtitleSize = isMobile ? '1.2rem' : '1.7rem'; 
  const resultFinalFontSize = isMobile ? '3.5rem' : '5rem';
  const resultFinalSubFontSize = isMobile ? '1.5rem' : '2.2rem';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      // Pleine largeur mobile
      padding: isMobile ? '15px 0' : '32px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* En-tête principal */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '30px 20px' : '70px 40px',
        borderRadius: '32px',
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 40px 90px rgba(102, 126, 234, 0.5)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{
          fontSize: headerTitleSize,
          fontWeight: 900,
          margin: 0,
          letterSpacing: isMobile ? '-1.5px' : '-3px'
        }}>
          Compte de Résultat
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '15px 0 0',
          opacity: 0.95
        }}>
          Performance économique • Analyse de rentabilité • SYSCOA Révisé
        </p>
      </div>

      {/* Sélecteur d'exercice */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '15px' : '30px',
        borderRadius: '24px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '25px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '10px' : '30px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ width: isMobile ? '100%' : 'auto' }}>
            <div style={{ color: '#666', fontSize: isMobile ? '0.9rem' : '1.1rem', marginBottom: '10px' }}>
              Exercice comptable
            </div>
            <select
              value={selectedExercice}
              onChange={(e) => setSelectedExercice(e.target.value)}
              style={{
                padding: isMobile ? '12px 18px' : '18px 28px',
                borderRadius: '18px',
                border: '3px solid #0d6efd',
                fontSize: isMobile ? '1rem' : '1.3rem',
                fontWeight: 700,
                width: isMobile ? '100%' : '420px',
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
              borderRadius: '18px',
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.2rem',
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
          borderRadius: '20px',
          marginBottom: '40px',
          fontSize: '1.1rem',
          boxShadow: '0 8px 25px rgba(220,53,69,0.15)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          ⚠️ Erreur : {error}
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div style={{
          padding: isMobile ? '80px' : '140px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }}></div>
          <p style={{ marginTop: '25px', fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#666' }}>
            Calcul du compte de résultat en cours...
          </p>
        </div>
      )}

      {/* Compte de Résultat */}
      {!loading && resultat && (
        <div style={{
          background: '#ffffff',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
          border: '1px solid #eee',
          paddingBottom: isMobile ? '15px' : '0',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: isMobile ? '25px' : '40px',
            textAlign: 'center',
            fontSize: isMobile ? '1.8rem' : '2.4rem',
            fontWeight: 800
          }}>
            COMPTE DE RÉSULTAT DÉTAILLÉ
          </div>

          <div style={{ padding: isMobile ? '20px 10px' : '40px 50px' }}>
            {/* Section Exploitation */}
            <Section title="ACTIVITÉ D'EXPLOITATION" color="#28a745" isMobile={isMobile}>
              <Line label="Ventes de marchandises (70)" value={resultat.ventes_marchandises} isMobile={isMobile} />
              <Line label="Achats de marchandises (60)" value={-resultat.achats_marchandises} negative isMobile={isMobile} />
              <ResultLine label="MARGE COMMERCIALE" value={resultat.marge_commerciale} isMobile={isMobile} />
              
              <Line label="Autres produits d'exploitation (71-78)" value={resultat.autres_produits_exploitation} isMobile={isMobile} />
              <Line label="Autres charges d'exploitation (61-68)" value={-resultat.autres_charges_exploitation} negative isMobile={isMobile} />
              <ResultLine label="RÉSULTAT D'EXPLOITATION" value={resultat.resultat_exploitation} big isMobile={isMobile} />
            </Section>

            {/* Section Financière */}
            <Section title="ACTIVITÉ FINANCIÈRE" color="#fd7e14" isMobile={isMobile}>
              <Line label="Produits financiers (77)" value={resultat.produits_financiers} isMobile={isMobile} />
              <Line label="Charges financières (67)" value={-resultat.charges_financieres} negative isMobile={isMobile} />
              <ResultLine label="RÉSULTAT FINANCIER" value={resultat.resultat_financier} isMobile={isMobile} />
            </Section>

            {/* Résultat courant */}
            <div style={{ margin: isMobile ? '30px 0' : '50px 0', padding: isMobile ? '15px' : '30px', background: '#f8f9fa', borderRadius: '20px' }}>
              <ResultLine 
                label="RÉSULTAT DES ACTIVITÉS ORDINAIRES" 
                value={resultat.resultat_activites_ordinaires}
                huge
                isMobile={isMobile}
              />
            </div>

            {/* Section Hors Exploitation */}
            <Section title="OPÉRATIONS HORS ACTIVITÉS ORDINAIRES" color="#6f42c1" isMobile={isMobile}>
              <Line label="Produits exceptionnels (8)" value={resultat.produits_hao} isMobile={isMobile} />
              <Line label="Charges exceptionnelles (8)" value={-resultat.charges_hao} negative isMobile={isMobile} />
              <ResultLine label="RÉSULTAT HORS ACTIVITÉS ORDINAIRES" value={resultat.resultat_hao} isMobile={isMobile} />
            </Section>

            {/* RÉSULTAT FINAL */}
            <div style={{
              marginTop: '40px',
              padding: isMobile ? '30px' : '50px',
              background: resultat.resultat_net >= 0
                ? 'linear-gradient(135deg, #d4edda, #c3e6cb)'
                : 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
              borderRadius: '28px',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)'
            }}>
              <h2 style={{
                margin: '0 0 20px',
                fontSize: isMobile ? '2rem' : '3rem',
                color: resultat.resultat_net >= 0 ? '#155724' : '#721c24',
                fontWeight: 900
              }}>
                RÉSULTAT NET DE L'EXERCICE
              </h2>
              <div style={{
                fontSize: resultFinalFontSize,
                fontWeight: 900,
                color: resultat.resultat_net >= 0 ? '#155724' : '#721c24',
                letterSpacing: isMobile ? '-2px' : '-4px',
                lineHeight: '1'
              }}>
                {resultat.resultat_net >= 0 ? '+' : ''}{formatNumber(resultat.resultat_net)} FCFA
              </div>
              <div style={{
                marginTop: '15px',
                fontSize: resultFinalSubFontSize,
                fontWeight: 800,
                color: resultat.resultat_net >= 0 ? '#155724' : '#721c24'
              }}>
                {resultat.resultat_net >= 0 ? 'BÉNÉFICE' : 'PERTE'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div style={{
        marginTop: '60px',
        padding: isMobile ? '30px' : '50px',
        background: '#f8f9fa',
        borderRadius: '24px',
        textAlign: 'center',
        color: '#666',
        fontSize: '1.1rem',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Calculé via fonction SQL optimisée • Mise à jour en temps réel • Conformité SYSCOA Révisé 2025
        </p>
      </div>
    </div>
  );
}
