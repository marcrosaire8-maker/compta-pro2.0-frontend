// src/pages/PlanComptablePage.jsx
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
    fontWeight: 700, 
    display: 'block', 
    marginBottom: '12px' 
};

export default function PlanComptablePage() {
  const { company } = useAuth();
  const { isMobile } = useWindowWidth(); // <-- Détection mobile

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [comptes, setComptes] = useState([]);
  const [newCompte, setNewCompte] = useState({
    numero_compte: '',
    libelle_compte: '',
    classe_compte: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editedLabel, setEditedLabel] = useState('');

  useEffect(() => {
    fetchComptes();
  }, []);

  async function fetchComptes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('plancomptableentreprise')
      .select('*')
      .order('numero_compte');

    if (error) {
      setError(error.message);
    } else {
      setComptes(data || []);
    }
    setLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...newCompte, [name]: value };

    if (name === 'numero_compte' && value.length > 0) {
      updated.classe_compte = value.charAt(0);
    }
    setNewCompte(updated);
  };

  const handleCreateCompte = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!newCompte.numero_compte || !newCompte.libelle_compte) {
      setError("Numéro et libellé obligatoires");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('plancomptableentreprise')
      .insert({
        numero_compte: newCompte.numero_compte.trim(),
        libelle_compte: newCompte.libelle_compte.trim(),
        classe_compte: newCompte.classe_compte,
        entreprise_id: company.id_entreprise
      });

    if (insertError) {
      if (insertError.code === '23505') {
        setError(`Le compte ${newCompte.numero_compte} existe déjà.`);
      } else {
        setError(insertError.message);
      }
    } else {
      setSuccess('Compte ajouté avec succès !');
      setNewCompte({ numero_compte: '', libelle_compte: '', classe_compte: '' });
      fetchComptes();
      setTimeout(() => setSuccess(null), 4000);
    }
    setLoading(false);
  };

  const startEditing = (compte) => {
    setEditingId(compte.id_compte);
    setEditedLabel(compte.libelle_compte);
  };

  const handleUpdateCompte = async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from('plancomptableentreprise')
      .update({ libelle_compte: editedLabel.trim() })
      .eq('id_compte', id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Libellé mis à jour !');
      setEditingId(null);
      fetchComptes();
      setTimeout(() => setSuccess(null), 3000);
    }
    setLoading(false);
  };

  const handleDeleteCompte = async (id, numero) => {
    if (!window.confirm(`Supprimer définitivement le compte ${numero} ?`)) return;

    setLoading(true);
    const { error } = await supabase
      .from('plancomptableentreprise')
      .delete()
      .eq('id_compte', id);

    if (error) {
      if (error.code === '23503') {
        setError("Impossible de supprimer : compte utilisé dans des écritures.");
      } else {
        setError(error.message);
      }
    } else {
      setSuccess('Compte supprimé.');
      fetchComptes();
      setTimeout(() => setSuccess(null), 3000);
    }
    setLoading(false);
  };

  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '5.5rem'; 
  const headerSubtitleSize = isMobile ? '1.2rem' : '2rem'; 
  const formPadding = isMobile ? '25px' : '50px';
  const cardTitleSize = isMobile ? '2rem' : '2.8rem';
  const inputFontSize = isMobile ? '1rem' : '1.1rem';
  const inputPadding = isMobile ? '14px' : '18px';

  // Loader
  if (loading && comptes.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', border: '6px solid #f3f3f3', borderTop: '6px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem' }}>Chargement du plan comptable...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '40px 20px' // Pleine largeur mobile
    }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: isMobile ? '30px 20px' : '70px 60px',
          borderRadius: '32px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 40px 90px rgba(102,126,234,0.5)'
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-4px' }}>
            Plan Comptable
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0' }}>
            Personnalisez vos comptes • SYSCOA Révisé
          </p>
          <p style={{ marginTop: '15px', fontSize: isMobile ? '1rem' : '1.4rem' }}>
            Entreprise : <strong>{company?.nom_entreprise}</strong>
          </p>
        </div>

        {/* Messages */}
        {error && <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>{error}</div>}
        {success && <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>{success}</div>}

        <div style={{ 
            display: isMobile ? 'flex' : 'grid', 
            flexDirection: 'column', 
            gridTemplateColumns: '1fr 2.5fr', 
            gap: isMobile ? '30px' : '40px',
            margin: isMobile ? '0 15px' : '0 auto' 
        }}>

          {/* AJOUT COMPTE */}
          <div style={{
            background: '#fff',
            borderRadius: '28px',
            padding: formPadding,
            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
            height: 'fit-content'
          }}>
            <h2 style={{ fontSize: cardTitleSize, color: '#2c3e50', marginBottom: '40px' }}>Ajouter un Compte</h2>
            <form onSubmit={handleCreateCompte}>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>Numéro de Compte</label>
                <input type="text" name="numero_compte" value={newCompte.numero_compte} onChange={handleChange} placeholder="411101" required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: isMobile ? '1.1rem' : '1.2rem', fontFamily: 'monospace' }} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>Libellé</label>
                <input type="text" name="libelle_compte" value={newCompte.libelle_compte} onChange={handleChange} placeholder="Client - Société Alpha" required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
              </div>
              <div style={{ marginBottom: '40px' }}>
                <label style={{ ...labelBaseStyle, fontSize: inputFontSize }}>Classe (auto)</label>
                <div style={{ 
                    padding: inputPadding, 
                    background: '#f0f4ff', 
                    borderRadius: '16px', 
                    fontSize: isMobile ? '1.4rem' : '1.6rem', 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    color: '#5a67d8' 
                }}>
                  {newCompte.classe_compte || '—'}
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{
                  width: '100%', 
                    padding: isMobile ? '18px' : '22px', 
                    background: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '16px',
                  fontSize: isMobile ? '1.3rem' : '1.5rem', 
                    fontWeight: 800, 
                    cursor: 'pointer', 
                    boxShadow: '0 15px 40px rgba(52,152,219,0.4)'
                }}>
                {loading ? 'Ajout...' : 'Ajouter le Compte'}
              </button>
            </form>
          </div>

          {/* LISTE COMPTES */}
          <div style={{
            background: '#fff',
            borderRadius: '28px',
            padding: formPadding,
            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
            marginTop: isMobile ? '30px' : '0' // Marge pour séparer les colonnes sur mobile
          }}>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : '3rem', color: '#2c3e50', marginBottom: '40px' }}>
              Plan Comptable ({comptes.length} comptes)
            </h2>

            {comptes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#95a5a6', fontSize: '1.3rem' }}>
                    Aucun compte enregistré.
                </div>
            ) : (
                isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                    <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {comptes.map(c => (
                            <div key={c.id_compte} style={{ 
                                background: '#f8fafc', 
                                padding: '15px', 
                                borderRadius: '16px', 
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: `5px solid #3498db`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>N° / Classe</p>
                                        <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50' }}>
                                            {c.numero_compte}
                                        </span>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            background: '#e0e7ff', 
                                            color: '#4338ca', 
                                            borderRadius: '50px', 
                                            fontWeight: 'bold',
                                            fontSize: '0.8rem',
                                            marginLeft: '10px'
                                        }}>
                                            Cl. {c.classe_compte}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#6c757d' }}>Actions</p>
                                        {/* Actions mobiles */}
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {editingId === c.id_compte ? (
                                                <>
                                                    <button onClick={() => handleUpdateCompte(c.id_compte)}
                                                        style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem' }}>
                                                        Sauver
                                                    </button>
                                                    <button onClick={() => setEditingId(null)}
                                                        style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem' }}>
                                                        Annuler
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEditing(c)}
                                                        style={{ padding: '8px 12px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        Modif
                                                    </button>
                                                    <button onClick={() => handleDeleteCompte(c.id_compte, c.numero_compte)}
                                                        style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        Suppr
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Libellé Modifiable */}
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                    <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Libellé :</strong>
                                    {editingId === c.id_compte ? (
                                        <input value={editedLabel} onChange={e => setEditedLabel(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '2px solid #3498db', fontSize: '1rem' }} autoFocus />
                                    ) : (
                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{c.libelle_compte}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px', width: '20%' }}>N°</th>
                                    <th style={{ padding: '20px', textAlign: 'left', width: '50%' }}>Libellé</th>
                                    <th style={{ padding: '20px', textAlign: 'center', width: '15%' }}>Classe</th>
                                    <th style={{ padding: '20px', textAlign: 'center', borderRadius: '0 16px 16px 0', width: '15%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comptes.map(c => (
                                    <tr key={c.id_compte} style={{ background: '#f8f9fa', borderRadius: '16px' }}>
                                        <td style={{ padding: '20px', fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 'bold' }}>{c.numero_compte}</td>
                                        <td style={{ padding: '20px' }}>
                                            {editingId === c.id_compte ? (
                                                <input value={editedLabel} onChange={e => setEditedLabel(e.target.value)}
                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #3498db' }} autoFocus />
                                            ) : (
                                                <span style={{ fontWeight: 600 }}>{c.libelle_compte}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'center' }}>
                                            <span style={{ padding: '8px 20px', background: '#e0e7ff', color: '#4338ca', borderRadius: '50px', fontWeight: 'bold' }}>
                                                Classe {c.classe_compte}
                                            </span>
                                        </td>
                                        <td style={{ padding: 'center', padding: '20px' }}>
                                            {editingId === c.id_compte ? (
                                                <>
                                                    <button onClick={() => handleUpdateCompte(c.id_compte)}
                                                        style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '12px', marginRight: '10px' }}>
                                                        Sauver
                                                    </button>
                                                    <button onClick={() => setEditingId(null)}
                                                        style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '12px' }}>
                                                        Annuler
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEditing(c)}
                                                        style={{ padding: '10px 20px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '12px', marginRight: '10px', fontWeight: 'bold' }}>
                                                        Modifier
                                                    </button>
                                                    <button onClick={() => handleDeleteCompte(c.id_compte, c.numero_compte)}
                                                        style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>
                                                        Supprimer
                                                    </button>
                                                </>
                                            )}
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
      </div>
    </div>
  );
}
