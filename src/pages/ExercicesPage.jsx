// src/pages/ExercicesPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

// Styles de base des inputs/labels pour réutilisation
const inputBaseStyle = {
    width: '100%',
    padding: '18px',
    borderRadius: '16px',
    border: '2px solid #ddd',
    fontSize: '1.1rem',
    boxSizing: 'border-box'
};
const labelBaseStyle = {
    display: 'block',
    fontWeight: 700,
    marginBottom: '10px',
    color: '#333'
};

export default function ExercicesPage() {
  const { company } = useAuth();
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [exercices, setExercices] = useState([]);

  const currentYear = new Date().getFullYear();
  const [newExercice, setNewExercice] = useState({
    libelle: `Exercice ${currentYear + 1}`,
    date_debut: `${currentYear + 1}-01-01`,
    date_fin: `${currentYear + 1}-12-31`,
  });

  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Chargement des exercices
  useEffect(() => {
    fetchExercices();
  }, []);

  const fetchExercices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercicescomptables')
      .select('*')
      .order('date_debut', { ascending: false });

    if (error) {
      setError("Impossible de charger les exercices comptables");
      console.error(error);
    } else {
      setExercices(data || []);
    }
    setLoading(false);
  };

  // Création d’un nouvel exercice
  const handleCreateExercice = async (e) => {
    e.preventDefault();

    if (!company) {
      setError("Aucune entreprise sélectionnée. Veuillez vous reconnecter.");
      return;
    }

    if (newExercice.date_debut >= newExercice.date_fin) {
      setError("La date de début doit être antérieure à la date de fin.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from('exercicescomptables')
      .insert({
        libelle: newExercice.libelle,
        date_debut: newExercice.date_debut,
        date_fin: newExercice.date_fin,
        entreprise_id: company.id_entreprise,
        statut: 'Ouvert'
      });

    if (error) {
      if (error.code === '23505') {
        setError("Un exercice existe déjà pour cette période. Les dates se chevauchent.");
      } else {
        setError("Erreur : " + error.message);
      }
    } else {
      setSuccess(`Exercice "${newExercice.libelle}" ouvert avec succès !`);
      setNewExercice({
        libelle: `Exercice ${currentYear + 2}`,
        date_debut: `${currentYear + 2}-01-01`,
        date_fin: `${currentYear + 2}-12-31`,
      });
      fetchExercices();
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };

  // Clôture d’un exercice
  const handleCloseExercice = async (id, libelle) => {
    if (!window.confirm(`Clôturer définitivement l'exercice "${libelle}" ?\n\n⚠️ Toutes les saisies seront bloquées à jamais.`)) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('exercicescomptables')
      .update({ statut: 'Cloture' })
      .eq('id_exercice', id);

    if (error) {
      setError("Échec de la clôture : " + error.message);
    } else {
      setSuccess(`Exercice "${libelle}" clôturé avec succès.`);
      fetchExercices();
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '4.5rem'; 
  const headerSubtitleSize = isMobile ? '1.2rem' : '1.7rem'; 
  const formPadding = isMobile ? '25px' : '40px';
  const inputPadding = isMobile ? '14px' : '18px';
  const inputFontSize = isMobile ? '1rem' : '1.1rem';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      // Pleine largeur mobile
      padding: isMobile ? '15px 0' : '32px',
      maxWidth: '1600px',
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
          letterSpacing: isMobile ? '-2px' : '-3px'
        }}>
          Exercices Comptables
        </h1>
        <p style={{
          fontSize: headerSubtitleSize,
          margin: '15px 0 0',
          opacity: 0.95
        }}>
          Ouverture • Clôture • Historique complet • Sécurité maximale
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '20px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '20px',
          marginBottom: '30px',
          fontSize: '1.1rem',
          boxShadow: '0 8px 25px rgba(220,53,69,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          margin: isMobile ? '0 15px 30px' : '0 auto 40px'
        }}>
          <strong>⚠️ Erreur :</strong> {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '20px',
          background: '#d4edda',
          color: '#155724',
          borderRadius: '20px',
          marginBottom: '30px',
          fontSize: '1.1rem',
          boxShadow: '0 8px 25px rgba(40,167,69,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          margin: isMobile ? '0 15px 30px' : '0 auto 40px'
        }}>
          <strong>✅ Succès :</strong> {success}
        </div>
      )}

      <div style={{
        display: isMobile ? 'flex' : 'grid',
        flexDirection: 'column',
        gridTemplateColumns: '1fr 2fr',
        gap: isMobile ? '30px' : '50px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        {/* Formulaire de création */}
        <div style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: formPadding,
          boxShadow: '0 30px 70px rgba(0,0,0,0.12)',
          border: '1px solid #eee',
          height: 'fit-content'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            fontWeight: 800,
            color: '#28a745',
            margin: '0 0 30px',
            paddingBottom: '15px',
            borderBottom: '4px solid #28a745'
          }}>
            Ouvrir un Nouvel Exercice
          </h2>

          <form onSubmit={handleCreateExercice}>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>
                Libellé de l'exercice
              </label>
              <input
                type="text"
                value={newExercice.libelle}
                onChange={(e) => setNewExercice({ ...newExercice, libelle: e.target.value })}
                style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
                required
              />
            </div>
            {/* Dates côte à côte sur desktop, empilées sur mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '15px' : '20px', marginBottom: '40px' }}>
                <div>
                  <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={newExercice.date_debut}
                    onChange={(e) => setNewExercice({ ...newExercice, date_debut: e.target.value })}
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
                    required
                  />
                </div>

                <div>
                  <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={newExercice.date_fin}
                    onChange={(e) => setNewExercice({ ...newExercice, date_fin: e.target.value })}
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
                    required
                  />
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: isMobile ? '16px' : '20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '18px',
                fontSize: isMobile ? '1.2rem' : '1.4rem',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 30px rgba(40,167,69,0.4)'
              }}
            >
              {loading ? 'Création en cours...' : 'Ouvrir l\'Exercice'}
            </button>
          </form>
        </div>

        {/* Liste des exercices */}
        <div style={{marginTop: isMobile ? '30px' : '0'}}>
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2.2rem',
            fontWeight: 800,
            color: '#0d6efd',
            margin: '0 0 35px',
            paddingBottom: '15px',
            borderBottom: '4px solid #0d6efd'
          }}>
            Historique des Exercices
          </h2>

          {loading && exercices.length === 0 ? (
            <div style={{ padding: '100px', textAlign: 'center' }}>
              <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
            </div>
          ) : exercices.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              background: '#f8f9fa',
              borderRadius: '20px',
              textAlign: 'center',
              color: '#888',
              fontSize: '1.2rem'
            }}>
              Aucun exercice trouvé.<br />Créez le premier !
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {exercices.map((ex) => (
                <div
                  key={ex.id_exercice}
                  style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: isMobile ? '20px' : '30px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    border: ex.statut === 'Ouvert' ? '3px solid #28a745' : '3px solid #dc3545',
                    transition: 'all 0.3s'
                  }}
                >
                    {/* Contenu de la carte (Responsif) */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px', fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800 }}>
                        {ex.libelle}
                      </h3>
                      <p style={{ margin: '8px 0', color: '#666', fontSize: isMobile ? '1rem' : '1.2rem' }}>
                        Du **{formatDate(ex.date_debut)}** au **{formatDate(ex.date_fin)}**
                      </p>
                      <span style={{
                        display: 'inline-block',
                        padding: '8px 15px',
                        borderRadius: '30px',
                        fontWeight: 700,
                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                        background: ex.statut === 'Ouvert' ? '#d4edda' : '#f8d7da',
                        color: ex.statut === 'Ouvert' ? '#155724' : '#721c24',
                        marginTop: isMobile ? '10px' : '0'
                      }}>
                        {ex.statut === 'Ouvert' ? 'OUVERT' : 'CLÔTURÉ'}
                      </span>
                    </div>

                    {ex.statut === 'Ouvert' && (
                      <button
                        onClick={() => handleCloseExercice(ex.id_exercice, ex.libelle)}
                        disabled={loading}
                        style={{
                          padding: isMobile ? '12px 20px' : '14px 28px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 8px 25px rgba(220,53,69,0.3)',
                            marginTop: isMobile ? '20px' : '0', // Marge pour séparer le bouton du texte
                            width: isMobile ? '100%' : 'auto'
                        }}
                      >
                        Clôturer l'Exercice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop: '60px',
        padding: isMobile ? '30px' : '50px',
        background: '#f8f9fa',
        borderRadius: '24px',
        textAlign: 'center',
        color: '#666',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p style={{ fontSize: '1.1rem' }}>
          Sécurité renforcée • Clôture irréversible • Conformité SYSCOA Révisé
        </p>
      </div>
    </div>
  );
}
