// src/pages/PaiePage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount || 0);
};

// --- STYLES RÉUTILISABLES ET DE BASE ---
const inputBaseStyle = {
    width: '100%', 
    padding: '18px', 
    borderRadius: '16px', 
    border: '2px solid #ddd', 
    fontSize: '1.1rem',
    boxSizing: 'border-box'
};
const buttonBaseStyle = {
    width: '100%',
    padding: '20px',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1.4rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'background 0.3s'
};

export default function PaiePage() {
  const { isMobile } = useWindowWidth(); // <-- Utilisation du Hook ici
    
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [employes, setEmployes] = useState([]);
  const [exercices, setExercices] = useState([]);

  const [newEmploye, setNewEmploye] = useState({
    nom: '', prenom: '', poste: '', salaire_de_base: ''
  });

  const [newBulletin, setNewBulletin] = useState({
    employe_id: '',
    exercice_id: '',
    periode_fin: new Date().toISOString().split('T')[0],
    salaire_brut: '',
    cotisations_salariales: '',
    cotisations_patronales: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [{ data: emp }, { data: ex }] = await Promise.all([
        supabase.from('employes').select('*').order('nom'),
        supabase.from('exercicescomptables').select('*').eq('statut', 'Ouvert')
      ]);

      setEmployes(emp || []);
      setExercices(ex || []);

      if (ex?.length > 0) {
        setNewBulletin(b => ({ ...b, exercice_id: ex[0].id_exercice }));
      }
    } catch (err) {
      setError("Erreur de chargement : " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEmployeChange = (e) => {
    const { name, value } = e.target;
    setNewEmploye(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEmploye = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from('employes')
      .insert({ ...newEmploye, salaire_de_base: parseFloat(newEmploye.salaire_de_base) || 0 });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Employé ajouté avec succès !');
      setNewEmploye({ nom: '', prenom: '', poste: '', salaire_de_base: '' });
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    }
    setLoading(false);
  };

  const handleBulletinChange = (e) => {
    setNewBulletin({ ...newBulletin, [e.target.name]: e.target.value });
  };

  const handleCreateBulletin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const periode_fin = newBulletin.periode_fin;
    const periode_debut = periode_fin.slice(0, 8) + '01';

    try {
      const { data: bulletin, error: insertError } = await supabase
        .from('bulletinspaie')
        .insert({
          employe_id: newBulletin.employe_id,
          exercice_id: newBulletin.exercice_id,
          periode_debut,
          periode_fin,
          salaire_brut: parseFloat(newBulletin.salaire_brut),
          cotisations_salariales: parseFloat(newBulletin.cotisations_salariales),
          cotisations_patronales: parseFloat(newBulletin.cotisations_patronales),
          statut: 'Brouillon'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: validateError } = await supabase
        .from('bulletinspaie')
        .update({ statut: 'Validee' })
        .eq('id_bulletin', bulletin.id_bulletin);

      if (validateError) throw validateError;

      setSuccess(`Bulletin validé et comptabilisé avec succès !`);
      setNewBulletin(prev => ({
        ...prev,
        employe_id: '',
        salaire_brut: '',
        cotisations_salariales: '',
        cotisations_patronales: ''
      }));
    } catch (err) {
      setError("Échec de validation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && employes.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem' }}>Chargement du module paie...</p>
      </div>
    );
  }
  
  // --- STYLES CONDITIONNELS POUR RESPONSIVITÉ MAXIMALE ---
  const headerTitleSize = isMobile ? '2.5rem' : '5.5rem'; 
  const headerSubtitleSize = isMobile ? '1.2rem' : '2rem'; 
  const cardTitleSize = isMobile ? '1.8rem' : '2.6rem';
  const formPadding = isMobile ? '25px' : '50px';
  const inputPadding = isMobile ? '14px' : '18px';
  const inputFontSize = isMobile ? '1rem' : '1.1rem';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '40px 20px' // Correction pour pleine largeur mobile
    }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

        {/* EN-TÊTE ÉPIQUE */}
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
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-4px' }}>
            Paie & Salaires
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
            Gestion du personnel • Bulletins • Écritures automatiques 641 / 43 / 664
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>
            Erreur : {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>
            {success}
          </div>
        )}

        {/* LAYOUT PRINCIPAL (Responsif) */}
        <div style={{ 
            display: isMobile ? 'flex' : 'grid', 
            flexDirection: 'column', // Empilement sur mobile
            gridTemplateColumns: '1fr 2fr', 
            gap: isMobile ? '30px' : '40px',
            margin: isMobile ? '0 15px' : '0 auto' 
        }}>

          {/* COLONNE GAUCHE : FORMULAIRES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Créer un Employé */}
            <div style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: formPadding,
              boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
              height: 'fit-content'
            }}>
              <h2 style={{ fontSize: cardTitleSize, marginTop: 0, color: '#2c3e50', marginBottom: '35px' }}>
                Nouvel Employé
              </h2>
              <form onSubmit={handleCreateEmploye}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Nom</label>
                  <input type="text" name="nom" value={newEmploye.nom} onChange={handleEmployeChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Prénom</label>
                  <input type="text" name="prenom" value={newEmploye.prenom} onChange={handleEmployeChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                </div>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Poste</label>
                  <input type="text" name="poste" value={newEmploye.poste} onChange={handleEmployeChange}
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
                    placeholder="Ex: Comptable Senior" />
                </div>
                <div style={{ marginBottom: '35px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Salaire de Base Mensuel</label>
                  <input type="number" name="salaire_de_base" value={newEmploye.salaire_de_base} onChange={handleEmployeChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{
                    ...buttonBaseStyle,
                    padding: isMobile ? '15px' : '20px',
                    background: '#3498db',
                    color: 'white',
                    fontSize: isMobile ? '1.2rem' : '1.4rem',
                    boxShadow: '0 15px 40px rgba(52,152,219,0.4)'
                  }}>
                  {loading ? 'Création...' : 'Ajouter l\'Employé'}
                </button>
              </form>
            </div>

            {/* Générer Bulletin */}
            <div style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: formPadding,
              boxShadow: '0 40px 90px rgba(0,0,0,0.15)'
            }}>
              <h2 style={{ fontSize: cardTitleSize, marginTop: 0, color: '#2c3e50', marginBottom: '35px' }}>
                Générer Bulletin de Paie
              </h2>
              <form onSubmit={handleCreateBulletin}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Employé</label>
                  <select name="employe_id" value={newBulletin.employe_id} onChange={handleBulletinChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}>
                    <option value="">-- Choisir un employé --</option>
                    {employes.map(e => (
                      <option key={e.id_employe} value={e.id_employe}>
                        {e.nom} {e.prenom} - {e.poste && `(${e.poste})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Mois de Paie (fin de période)</label>
                  <input type="date" name="periode_fin" value={newBulletin.periode_fin} onChange={handleBulletinChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                </div>

                {/* Salaires et Cotisations Salariales: s'empilent sur mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '15px' : '20px', marginBottom: '25px' }}>
                  <div>
                    <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Salaire Brut (661)</label>
                    <input type="number" step="0.01" name="salaire_brut" value={newBulletin.salaire_brut} onChange={handleBulletinChange} required
                      style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                  </div>
                  <div>
                    <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Cotisations Salariales (43)</label>
                    <input type="number" step="0.01" name="cotisations_salariales" value={newBulletin.cotisations_salariales} onChange={handleBulletinChange} required
                      style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                  </div>
                </div>

                <div style={{ marginBottom: '35px' }}>
                  <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Cotisations Patronales (664)</label>
                  <input type="number" step="0.01" name="cotisations_patronales" value={newBulletin.cotisations_patronales} onChange={handleBulletinChange} required
                    style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
                </div>

                <button type="submit" disabled={loading}
                  style={{
                    ...buttonBaseStyle,
                    padding: isMobile ? '18px' : '22px',
                    background: '#28a745',
                    color: 'white',
                    fontSize: isMobile ? '1.4rem' : '1.6rem',
                    boxShadow: '0 15px 40px rgba(40,167,69,0.4)'
                  }}>
                  {loading ? 'Comptabilisation...' : 'Valider & Comptabiliser'}
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE : LISTE PERSONNEL (Vue conditionnelle) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '28px',
            padding: formPadding,
            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
            // Marge pour séparer la liste des formulaires sur mobile
            marginTop: isMobile ? '30px' : '0' 
          }}>
            <h2 style={{ fontSize: '2.8rem', marginTop: 0, color: '#2c3e50', marginBottom: '40px' }}>
              Personnel ({employes.length})
            </h2>

            {employes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#95a5a6', fontSize: '1.3rem' }}>
                    Aucun employé enregistré
                </div>
            ) : (
                isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {employes.map(e => (
                            <div key={e.id_employe} style={{
                                background: '#f8fafc',
                                padding: '15px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: '4px solid #3498db'
                            }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.15rem' }}>
                                    {e.prenom} {e.nom}
                                </p>
                                <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                                    {e.poste || 'Poste non spécifié'}
                                </p>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #e5e7eb' }}/>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                    <div>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Base:</strong>
                                        <span style={{ fontFamily: 'monospace' }}>
                                            {formatCurrency(e.salaire_de_base)}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Net Est. (approx.):</strong>
                                        <span style={{ fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace' }}>
                                            {formatCurrency(e.salaire_de_base * 0.78)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px' }}>Nom</th>
                                    <th style={{ padding: '20px' }}>Poste</th>
                                    <th style={{ padding: '20px', textAlign: 'right' }}>Salaire Base</th>
                                    <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>Net Estimé</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employes.map(e => (
                                    <tr key={e.id_employe} style={{ background: '#f8f9fa', borderRadius: '16px' }}>
                                        <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.15rem' }}>
                                            {e.prenom} {e.nom}
                                        </td>
                                        <td style={{ padding: '20px', color: '#7f8c8d' }}>{e.poste || '—'}</td>
                                        <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                                            {formatCurrency(e.salaire_de_base)}
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold', color: '#27ae60', fontFamily: 'monospace' }}>
                                            {formatCurrency(e.salaire_de_base * 0.78)} 
                                        </td>
                                    </tr>
                                ))}
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
          color: '#666',
          fontSize: '1.1rem',
            margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <p>Paie mensuelle • Conforme SYSCOA • Écritures automatiques 641 / 43 / 664 • Déclaration CNSS prête</p>
        </div>
      </div>
    </div>
  );
}
