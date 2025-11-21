// src/pages/AdminMonetizationPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

export default function AdminMonetizationPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Prix en cours d'édition
  const [editingPrices, setEditingPrices] = useState({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('niveau', { ascending: true });

    if (error) {
      setError("Impossible de charger les abonnements");
      console.error(error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const handlePriceChange = (planId, value) => {
    setEditingPrices(prev => ({
      ...prev,
      [planId]: value
    }));
  };

  const handleSavePrice = async (plan) => {
    const newPrice = parseFloat(editingPrices[plan.id_plan]);
    if (isNaN(newPrice) || newPrice < 0) {
      setError("Veuillez entrer un prix valide");
      return;
    }

    setSavingId(plan.id_plan);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from('plans')
      .update({ prix_mensuel: newPrice })
      .eq('id_plan', plan.id_plan);

    if (error) {
      setError("Échec de la mise à jour : " + error.message);
    } else {
      setSuccess(`Prix du plan "${plan.nom_plan}" mis à jour à ${newPrice.toLocaleString('fr-FR')} FCFA/mois`);
      setEditingPrices(prev => {
        const { [plan.id_plan]: _, ...rest } = prev;
        return rest;
      });
      fetchPlans();
      setTimeout(() => setSuccess(null), 5000);
    }
    setSavingId(null);
  };

  const getPlanGradient = (niveau) => {
    const gradients = {
      1: 'linear-gradient(135deg, #6c757d, #495057)',
      2: 'linear-gradient(135deg, #17a2b8, #0d6efd)',
      3: 'linear-gradient(135deg, #28a745, #20c997)',
      4: 'linear-gradient(135deg, #fd7e14, #f59e0b)',
      5: 'linear-gradient(135deg, #e83e8c, #d63384)'
    };
    return gradients[niveau] || gradients[1];
  };

  const getPlanBadge = (niveau) => {
    const badges = {
      1: { bg: '#6c757d', label: 'GRATUIT' },
      2: { bg: '#0d6efd', label: 'STARTER' },
      3: { bg: '#28a745', label: 'PRO' },
      4: { bg: '#fd7e14', label: 'BUSINESS' },
      5: { bg: '#e83e8c', label: 'ENTREPRISE' }
    };
    return badges[niveau] || badges[1];
  };
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '3.8rem';
  const headerSubtitleSize = isMobile ? '1.1rem' : '1.5rem';
  const containerPadding = isMobile ? '15px 0' : '32px';
  const cardTitleSize = isMobile ? '1.8rem' : '2.2rem';
  const cardPadding = isMobile ? '20px' : '30px 25px';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: containerPadding,
      maxWidth: '1500px',
      margin: '0 auto'
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
          letterSpacing: isMobile ? '-1px' : '-2px'
        }}>
          Monétisation & Abonnements
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '10px 0 0',
          opacity: 0.95
        }}>
          Contrôle total des tarifs • Mise à jour instantanée • Impact sur toutes les entreprises
        </p>
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
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-exclamation-triangle-fill fs-2"></i>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '20px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '18px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 6px 20px rgba(40,167,69,0.1)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <i className="bi bi-check-circle-fill fs-2"></i>
          {success}
        </div>
      )}

      {/* Cartes des plans */}
      <div style={{
        display: 'grid',
        // Colonnes fluides, min width réduit sur mobile
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: isMobile ? '20px' : '30px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {loading ? (
          Array(4).fill().map((_, i) => (
            <div key={i} style={{
              height: '400px',
              background: '#f8f9fa',
              borderRadius: '20px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          ))
        ) : (
          plans.map(plan => {
            const badge = getPlanBadge(plan.niveau);
            const currentPrice = editingPrices[plan.id_plan] !== undefined
              ? parseFloat(editingPrices[plan.id_plan])
              : plan.prix_mensuel;
            const hasChanged = currentPrice !== plan.prix_mensuel;

            return (
              <div
                key={plan.id_plan}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
                  transition: 'all 0.4s',
                  border: hasChanged ? '3px solid #28a745' : '1px solid #eee'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = isMobile ? 'none' : 'translateY(-10px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* En-tête du plan */}
                <div style={{
                  background: getPlanGradient(plan.niveau),
                  color: 'white',
                  padding: cardPadding,
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}>
                    {badge.label}
                  </div>
                  <h2 style={{ margin: '0', fontSize: cardTitleSize, fontWeight: 800 }}>
                    {plan.nom_plan}
                  </h2>
                  <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                    Tier {plan.niveau}
                  </p>
                </div>

                {/* Corps */}
                <div style={{ padding: cardPadding }}>
                  <div style={{ marginBottom: '25px' }}>
                    <p style={{ color: '#666', fontSize: isMobile ? '1rem' : '1.1rem', margin: '0 0 15px' }}>
                      Prix mensuel (FCFA)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
                      <input
                        type="number"
                        step="1000"
                        value={currentPrice || 0}
                        onChange={(e) => handlePriceChange(plan.id_plan, e.target.value)}
                        style={{
                          padding: isMobile ? '12px' : '16px',
                          borderRadius: '14px',
                          border: '2px solid #ddd',
                          fontSize: isMobile ? '1.4rem' : '1.8rem',
                          fontWeight: 'bold',
                          width: isMobile ? '50%' : '180px', // Prend 50% sur mobile
                          textAlign: 'right'
                        }}
                      />
                      <span style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', color: '#666' }}>FCFA</span>
                    </div>
                  </div>

                  {hasChanged && (
                    <button
                      onClick={() => handleSavePrice(plan)}
                      disabled={savingId === plan.id_plan}
                      style={{
                        width: '100%',
                        padding: isMobile ? '14px' : '16px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: isMobile ? '1.1rem' : '1.2rem',
                        fontWeight: 700,
                        cursor: savingId === plan.id_plan ? 'not-allowed' : 'pointer',
                        opacity: savingId === plan.id_plan ? 0.7 : 1
                      }}
                    >
                      {savingId === plan.id_plan ? 'Mise à jour...' : 'Appliquer le nouveau prix'}
                    </button>
                  )}

                  <div style={{
                    marginTop: '25px',
                    padding: isMobile ? '15px' : '20px',
                    background: '#f8f9fa',
                    borderRadius: '14px',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    lineHeight: '1.7',
                    color: '#555'
                  }}>
                    <strong>Fonctionnalités :</strong><br/>
                    {plan.features || 'Non définies'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop: '40px',
        padding: isMobile ? '30px' : '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '24px',
        textAlign: 'center',
        fontSize: '1.1rem',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p style={{ margin: 0, opacity: 0.95 }}>
          SuperAdmin uniquement • Mise à jour instantanée • Prix en FCFA HT • Appliqué à tous les clients
        </p>
      </div>
    </div>
  );
}
