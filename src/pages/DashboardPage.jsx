// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

// --- Styles pour le Tableau de Bord (Centralisé pour la lisibilité) ---
const styles = {
  dashboardContainer: {
    fontFamily: "'Poppins', sans-serif",
    // Le padding sera géré conditionnellement dans le rendu
  },
  title: {
    fontWeight: 700,
    color: '#0d6efd',
    marginBottom: '10px',
    // La taille de la police sera gérée conditionnellement dans le rendu
  },
  // Grille Responsif des KPIs : S'adapte de 1 à N colonnes (min 260px)
  kpisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
    marginTop: '30px',
  },
  kpiCard: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s',
    cursor: 'pointer',
  },
  // Grille Responsif des Actions : S'adapte de 1 à N colonnes (min 200px)
  actionsGrid: {
    marginTop: '50px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  actionLink: {
    display: 'block',
    padding: '20px',
    borderRadius: '14px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 600,
    textAlign: 'center',
    boxShadow: '0 6px 15px rgba(0,0,0,0.08)',
    transition: 'all 0.3s',
  }
};

const DashboardPage = () => {
  const { session, company } = useAuth();
  const { isMobile } = useWindowWidth(); // <-- Utilisation du Hook ici
    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({
    sales: 0,
    purchases: 0,
    netResult: 0,
    cashBalance: 0,
    exerciceLibelle: 'Aucun exercice ouvert',
  });

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00 F CFA';
    const num = parseFloat(value);
    const color = num < 0 ? '#dc3545' : '#28a745';
    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} F CFA
      </span>
    );
  };

  useEffect(() => {
    // ... (Logique fetchDashboardData inchangée) ...
    const fetchDashboardData = async () => {
      if (!company) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer l'exercice ouvert
        const { data: exData, error: exError } = await supabase
          .from('exercicescomptables')
          .select('id_exercice, libelle')
          .eq('statut', 'Ouvert')
          .single();

        if (exError || !exData) {
          setError("Aucun exercice comptable ouvert. Veuillez en créer un.");
          setLoading(false);
          return;
        }

        const exerciceId = exData.id_exercice;

        // 2. Ventes & Achats TTC validées
        const { data: factures, error: fError } = await supabase
          .from('factures')
          .select('type_document, montant_ttc')
          .eq('statut', 'Validee');

        if (fError) throw fError;

        const ventes = factures
          .filter(f => f.type_document === 'VENTE')
          .reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0);

        const achats = factures
          .filter(f => f.type_document === 'ACHAT')
          .reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0);

        // 3. Résultat net via RPC
        const { data: resultData, error: rError } = await supabase
          .rpc('get_compte_de_resultat', { p_exercice_id: exerciceId });

        if (rError) throw rError;

        // 4. Trésorerie (comptes 52% et 57%)
        const { data: tresoData, error: tError } = await supabase
          .from('vue_balance')
          .select('solde_debit, solde_credit')
          .or('numero_compte.like.52%,numero_compte.like.57%')
          .eq('id_exercice', exerciceId);

        if (tError) throw tError;

        const tresorerie = tresoData.reduce((sum, row) => {
          return sum + (parseFloat(row.solde_debit || 0) - parseFloat(row.solde_credit || 0));
        }, 0);

        setKpis({
          sales: ventes,
          purchases: achats,
          netResult: resultData?.resultat_net || 0,
          cashBalance: tresorerie,
          exerciceLibelle: exData.libelle,
        });
      } catch (err) {
        setError("Erreur de chargement : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [company]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
        <p className="mt-3">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" style={{ borderRadius: '12px', fontSize: '1.1rem' }}>
        <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
      </div>
    );
  }
    
  // Variables de style conditionnel
  const titleFontSize = isMobile ? '1.8rem' : '2.5rem';
  const containerPadding = isMobile ? '15px 5px' : '20px'; // Moins de padding sur les petits écrans
    

  return (
    <div style={{...styles.dashboardContainer, padding: containerPadding}}>
      {/* Titre principal */}
      <h1 style={{...styles.title, fontSize: titleFontSize}}>
        <i className="bi bi-graph-up-arrow me-3"></i>
        Tableau de Bord
      </h1>
      <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#555' }}>
        <strong>{company?.nom_entreprise}</strong> — Exercice : <strong>{kpis.exerciceLibelle}</strong>
      </p>

      {/* Grille des KPIs (Responsif via minmax) */}
      <div style={styles.kpisGrid}>
        
        {/* Résultat Net */}
        <div 
          style={{ 
            ...styles.kpiCard, 
            borderLeft: `6px solid ${kpis.netResult >= 0 ? '#28a745' : '#dc3545'}` 
          }} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>Résultat Net</p>
              <h3 style={{ margin: '8px 0 0', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, overflowWrap: 'break-word' }}>
                {formatCurrency(kpis.netResult)}
              </h3>
            </div>
            <i className={`bi ${kpis.netResult >= 0 ? 'bi-graph-up-arrow text-success' : 'bi-graph-down-arrow text-danger'} fs-1 opacity-75`}></i>
          </div>
        </div>

        {/* Ventes */}
        <div 
          style={{ 
            ...styles.kpiCard, 
            borderLeft: '6px solid #0d6efd' 
          }} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>Chiffre d'Affaires</p>
              <h3 style={{ margin: '8px 0 0', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, overflowWrap: 'break-word' }}>
                {formatCurrency(kpis.sales)}
              </h3>
            </div>
            <i className="bi bi-receipt fs-1 text-primary opacity-75"></i>
          </div>
        </div>

        {/* Achats */}
        <div 
          style={{ 
            ...styles.kpiCard, 
            borderLeft: '6px solid #fd7e14' 
          }} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>Achats TTC</p>
              <h3 style={{ margin: '8px 0 0', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, overflowWrap: 'break-word' }}>
                {formatCurrency(kpis.purchases)}
              </h3>
            </div>
            <i className="bi bi-cart-fill fs-1 text-warning opacity-75"></i>
          </div>
        </div>

        {/* Trésorerie */}
        <div 
          style={{ 
            ...styles.kpiCard, 
            borderLeft: `6px solid ${kpis.cashBalance >= 0 ? '#28a745' : '#dc3545'}` 
          }} 
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: isMobile ? '0.9rem' : '1rem' }}>Trésorerie Nette</p>
              <h3 style={{ margin: '8px 0 0', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, overflowWrap: 'break-word' }}>
                {formatCurrency(kpis.cashBalance)}
              </h3>
            </div>
            <i className={`bi ${kpis.cashBalance >= 0 ? 'bi-piggy-bank' : 'bi-exclamation-circle-fill'} fs-1 ${kpis.cashBalance >= 0 ? 'text-success' : 'text-danger'} opacity-75`}></i>
          </div>
        </div>
      </div>

      {/* Actions rapides (Responsif via minmax) */}
      <div style={styles.actionsGrid}>
        {[
          { to: '/saisie', label: 'Nouvelle écriture', icon: 'bi-pencil-square', color: '#e6f7e6' },
          { to: '/facturation', label: 'Facture de vente', icon: 'bi-receipt-cutoff', color: '#e6f3ff' },
          { to: '/achats', label: 'Facture fournisseur', icon: 'bi-truck', color: '#fff4e6' },
          { to: '/bilan', label: 'Bilan & Résultat', icon: 'bi-file-earmark-bar-graph', color: '#f0e6ff' },
        ].map((item, i) => (
          <a key={i} href={item.to} 
            style={{ 
              ...styles.actionLink, 
              background: item.color 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <i className={`bi ${item.icon} fs-3 mb-2 d-block`}></i>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
