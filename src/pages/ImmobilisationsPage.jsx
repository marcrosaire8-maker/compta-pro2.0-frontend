// src/pages/ImmobilisationsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

const formatCurrency = (amount) => {
  // Utilisation d'une devise générique pour l'Afrique de l'Ouest (CFA) pour être cohérent avec les autres pages
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount || 0);
};

// Styles de base des inputs pour réutilisation
const inputBaseStyle = {
    width: '100%',
    padding: '18px',
    borderRadius: '16px',
    border: '2px solid #ddd',
    fontSize: '1.1rem',
    boxSizing: 'border-box'
};
const labelBaseStyle = { 
    fontWeight: 700, 
    color: '#333', 
    display: 'block', 
    marginBottom: '12px' 
};
const cardStyleMobile = {
    background: '#f8fafc',
    padding: '15px',
    borderRadius: '12px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    borderLeft: '4px solid #667eea',
    marginBottom: '15px'
};


export default function ImmobilisationsPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
    
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [immobilisations, setImmobilisations] = useState([]);
  const [comptesImmo, setComptesImmo] = useState([]);
  const [comptesAmort, setComptesAmort] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [newImmo, setNewImmo] = useState({
    libelle: '',
    date_achat: new Date().toISOString().split('T')[0],
    date_mise_en_service: new Date().toISOString().split('T')[0],
    valeur_origine: '',
    duree_amortissement: 5,
    compte_immo_id: '',
    compte_amort_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
        const { data: immos, error: immosError } = await supabase.from('immobilisations').select('*').order('date_achat', { ascending: false });
        const { data: cImmo, error: cImmoError } = await supabase.from('plancomptableentreprise').select('*').like('numero_compte', '2%').not('numero_compte', 'like', '28%').order('numero_compte');
        const { data: cAmort, error: cAmortError } = await supabase.from('plancomptableentreprise').select('*').like('numero_compte', '28%').order('numero_compte');
        const { data: ex, error: exError } = await supabase.from('exercicescomptables').select('*').eq('statut', 'Ouvert');

        if (immosError || cImmoError || cAmortError || exError) {
             throw new Error(immosError?.message || cImmoError?.message || cAmortError?.message || exError?.message);
        }

        setImmobilisations(immos || []);
        setComptesImmo(cImmo || []);
        setComptesAmort(cAmort || []);
        setExercices(ex || []);

    } catch (err) {
        setError("Erreur de chargement des données : " + err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredImmos = useMemo(() => {
    return immobilisations.filter(item =>
      item.libelle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [immobilisations, searchTerm]);

  const handleChange = (e) => {
    setNewImmo({ ...newImmo, [e.target.name]: e.target.value });
  };

  const handleCreateImmo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const { error } = await supabase.from('immobilisations').insert({
      ...newImmo,
      valeur_origine: parseFloat(newImmo.valeur_origine) || 0
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('Immobilisation ajoutée avec succès !');
      setNewImmo({
        libelle: '', date_achat: new Date().toISOString().split('T')[0],
        date_mise_en_service: new Date().toISOString().split('T')[0],
        valeur_origine: '', duree_amortissement: 5, compte_immo_id: '', compte_amort_id: ''
      });
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
    setLoading(false);
  };

  const handleGenerateAmort = async () => {
    if (exercices.length === 0) return setError("Aucun exercice ouvert.");
    const exercice = exercices[0];

    if (!window.confirm(`Générer les dotations aux amortissements pour l'exercice "${exercice.libelle}" ?`)) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    const { data, error } = await supabase.rpc('generer_amortissements_exercice', {
      p_exercice_id: exercice.id_exercice
    });

    if (error) setError(error.message);
    else setSuccessMsg(data || "Dotations générées avec succès !");
    setLoading(false);
  };

  if (loading && immobilisations.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem' }}>Chargement des immobilisations...</p>
      </div>
    );
  }
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '5rem'; 
  const headerSubtitleSize = isMobile ? '1.2rem' : '1.9rem'; 
  const formPadding = isMobile ? '25px' : '50px';
  const cardTitleSize = isMobile ? '1.8rem' : '2.2rem';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '40px 20px' // Pleine largeur mobile
    }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

        {/* === EN-TÊTE MODERNE === */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: isMobile ? '30px 20px' : '70px 60px',
          borderRadius: '32px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 40px 90px rgba(102, 126, 234, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-3px' }}>
            Immobilisations
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
            Acquisition • Suivi • Amortissements automatiques (SYSCOA Révisé)
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>
            Erreur : {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>
            {successMsg}
          </div>
        )}

        {/* Bouton Génération Dotations */}
        {exercices.length > 0 && (
          <div style={{ textAlign: isMobile ? 'center' : 'right', marginBottom: '30px', margin: isMobile ? '0 15px 30px' : '0 0 30px' }}>
            <button
              onClick={handleGenerateAmort}
              disabled={loading}
              style={{
                padding: isMobile ? '16px 30px' : '18px 40px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 15px 40px rgba(231, 76, 60, 0.4)',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              {loading ? 'Génération...' : `Générer Dotations (${exercices[0].libelle})`}
            </button>
          </div>
        )}

        <div style={{ 
            display: isMobile ? 'flex' : 'grid', 
            flexDirection: 'column', 
            gridTemplateColumns: '1fr 2fr', 
            gap: isMobile ? '30px' : '40px',
            margin: isMobile ? '0 15px' : '0 auto' 
        }}>

          {/* === FORMULAIRE D'AJOUT === */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: formPadding,
            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
            height: 'fit-content'
          }}>
            <h2 style={{ fontSize: cardTitleSize, marginTop: 0, color: '#2c3e50', marginBottom: '30px' }}>
              Nouvelle Acquisition
            </h2>
            <form onSubmit={handleCreateImmo}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Libellé du Bien</label>
                <input type="text" name="libelle" value={newImmo.libelle} onChange={handleChange} required
                  style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }}
                  placeholder="Ex: Véhicule Toyota Hilux 2025" />
              </div>

              {/* Valeur HT et Durée: s'empilent sur mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '15px' : '20px', marginBottom: '25px' }}>
                <div>
                  <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Valeur HT</label>
                  <input type="number" name="valeur_origine" value={newImmo.valeur_origine} onChange={handleChange} required
                    style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }} />
                </div>
                <div>
                  <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Durée (années)</label>
                  <input type="number" name="duree_amortissement" value={newImmo.duree_amortissement} onChange={handleChange} min="1" required
                    style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }} />
                </div>
              </div>

              {/* Dates Achat et Mise en Service: s'empilent sur mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '15px' : '20px', marginBottom: '25px' }}>
                <div>
                  <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Date Achat</label>
                  <input type="date" name="date_achat" value={newImmo.date_achat} onChange={handleChange} required
                    style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }} />
                </div>
                <div>
                  <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Mise en Service</label>
                  <input type="date" name="date_mise_en_service" value={newImmo.date_mise_en_service} onChange={handleChange} required
                    style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Compte Immobilisation (Classe 2)</label>
                <select name="compte_immo_id" value={newImmo.compte_immo_id} onChange={handleChange} required
                  style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  <option value="">-- Choisir --</option>
                  {comptesImmo.map(c => (
                    <option key={c.id_compte} value={c.id_compte}>{c.numero_compte} - {c.libelle_compte}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '35px' }}>
                <label style={{ ...labelBaseStyle, fontSize: isMobile ? '0.9rem' : 'inherit' }}>Compte Amortissement (Classe 28)</label>
                <select name="compte_amort_id" value={newImmo.compte_amort_id} onChange={handleChange} required
                  style={{ ...inputBaseStyle, padding: isMobile ? '14px' : '18px', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                  <option value="">-- Choisir --</option>
                  {comptesAmort.map(c => (
                    <option key={c.id_compte} value={c.id_compte}>{c.numero_compte} - {c.libelle_compte}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%',
                  padding: isMobile ? '16px' : '20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 15px 40px rgba(40,167,69,0.4)'
                }}>
                {loading ? 'Enregistrement...' : 'Enregistrer l\'Immobilisation'}
              </button>
            </form>
          </div>

          {/* === LISTE DES IMMOBILISATIONS (Vue conditionnelle) === */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: formPadding,
            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
            marginTop: isMobile ? '30px' : '0' // Marge pour séparer les colonnes sur mobile
          }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                marginBottom: '30px', 
                gap: isMobile ? '15px' : '0'
            }}>
              <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', margin: 0, color: '#2c3e50' }}>
                Parc Immobilisé
              </h2>
              <input
                type="text"
                placeholder="Rechercher un bien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: isMobile ? '12px 18px' : '16px 24px',
                  borderRadius: '16px',
                  border: '2px solid #ddd',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  width: isMobile ? '100%' : '320px'
                }}
              />
            </div>

            {filteredImmos.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '60px', color: '#95a5a6', fontSize: '1.3rem' }}>
                    Aucune immobilisation enregistrée ou ne correspond à la recherche.
                 </div>
            ) : (
                isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredImmos.map(immo => {
                            const annuite = immo.valeur_origine / immo.duree_amortissement;
                            const dateMiseEnService = new Date(immo.date_mise_en_service).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                            return (
                                <div key={immo.id_immo} style={cardStyleMobile}>
                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.15rem' }}>{immo.libelle}</p>
                                    <p style={{ color: '#667eea', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
                                        {immo.duree_amortissement} ans • Mise en service: {dateMiseEnService}
                                    </p>
                                    <hr style={{ margin: '10px 0', borderTop: '1px solid #e5e7eb' }}/>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem' }}>
                                        <div>
                                            <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Valeur HT:</strong>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                {formatCurrency(immo.valeur_origine)}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Annuité Linéaire:</strong>
                                            <span style={{ fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                                                {formatCurrency(annuite)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px' }}>Bien</th>
                                    <th style={{ padding: '20px', textAlign: 'center' }}>Mise en Service</th>
                                    <th style={{ padding: '20px', textAlign: 'right' }}>Valeur HT</th>
                                    <th style={{ padding: '20px', textAlign: 'center' }}>Durée</th>
                                    <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>Annuité</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredImmos.map(immo => {
                                    const annuite = immo.valeur_origine / immo.duree_amortissement;
                                    return (
                                        <tr key={immo.id_immo} style={{ background: '#f8f9fa', borderRadius: '16px' }}>
                                            <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.15rem' }}>{immo.libelle}</td>
                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                {new Date(immo.date_mise_en_service).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                                                {formatCurrency(immo.valeur_origine)}
                                            </td>
                                            <td style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>{immo.duree_amortissement} ans</td>
                                            <td style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace', fontSize: '1.3rem' }}>
                                                {formatCurrency(annuite)} /an
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
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '60px',
          padding: isMobile ? '30px' : '50px',
          background: '#f8f9fa',
          borderRadius: '24px',
          textAlign: 'center',
          color: '#64748b',
            margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <p style={{ fontSize: '1.2rem' }}>
            Amortissements linéaires • Conforme SYSCOA Révisé • Écritures automatiques 6811 → 28...
          </p>
        </div>
      </div>
    </div>
  );
}
