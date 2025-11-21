// src/pages/AdminMasterPlanPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; 

// Styles de base des inputs/labels pour réutilisation
const inputBaseStyle = {
    width: '100%',
    padding: '20px',
    borderRadius: '18px',
    border: '2px solid',
    background: 'white',
    fontSize: '1.2rem',
    fontWeight: 600,
    boxSizing: 'border-box'
};
const labelBaseStyle = { 
    display: 'block', 
    marginBottom: '12px', 
    fontWeight: 700, 
    fontSize: '1.2rem' 
};

export default function AdminMasterPlanPage() {
  const { isMobile } = useWindowWidth(); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comptes, setComptes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [newCompte, setNewCompte] = useState({
    numero_compte: '',
    libelle_compte: '',
    classe_compte: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ numero: '', libelle: '' });

  useEffect(() => {
    fetchComptes();
  }, []);

  async function fetchComptes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('plansyscoamodele')
      .select('*')
      .order('numero_compte');
    if (error) setError(error.message);
    else setComptes(data || []);
    setLoading(false);
  }

  const filteredComptes = useMemo(() => {
    return comptes.filter(c =>
      c.numero_compte.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.libelle_compte.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [comptes, searchTerm]);

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...newCompte, [name]: value };
    if (name === 'numero_compte' && value.length > 0) {
      updated.classe_compte = value.charAt(0);
    }
    setNewCompte(updated);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCompte.numero_compte || !newCompte.libelle_compte) return;
    setLoading(true);
    const { error } = await supabase.from('plansyscoamodele').insert(newCompte);
    if (error) setError(error.message);
    else {
      setNewCompte({ numero_compte: '', libelle_compte: '', classe_compte: '' });
      fetchComptes();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce compte du plan maître ?")) return;
    setLoading(true);
    const { error } = await supabase.from('plansyscoamodele').delete().eq('id_modele', id);
    if (error) setError(error.message);
    else fetchComptes();
    setLoading(false);
  };

  const startEdit = (compte) => {
    setEditingId(compte.id_modele);
    setEditValues({ numero: compte.numero_compte, libelle: compte.libelle_compte });
  };

  const saveEdit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('plansyscoamodele')
      .update({
        numero_compte: editValues.numero,
        libelle_compte: editValues.libelle
      })
      .eq('id_modele', editingId);
    if (error) setError(error.message);
    else {
      setEditingId(null);
      fetchComptes();
    }
    setLoading(false);
  };

  if (loading && comptes.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem', color: '#666' }}>Chargement du plan comptable maître...</p>
      </div>
    );
  }

  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '5rem';
  const headerSubtitleSize = isMobile ? '1.1rem' : '1.9rem';
  const containerPadding = isMobile ? '15px 0' : '40px 20px';
  const formPadding = isMobile ? '30px 20px' : '50px 40px';
  const inputPadding = isMobile ? '14px' : '20px';
  const labelFontSize = isMobile ? '1rem' : '1.2rem';
  const h2FontSize = isMobile ? '2rem' : '2.6rem';


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: containerPadding
    }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

        {/* En-tête premium */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: isMobile ? '30px 20px' : '70px 60px',
          borderRadius: '36px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 50px 100px rgba(99, 102, 241, 0.5)',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-4px' }}>
            Plan Comptable Maître
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
            Modèle SYSCOA Révisé • Base pour toutes les nouvelles entreprises
          </p>
        </div>

        {error && (
          <div style={{
            padding: '25px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '20px',
            marginBottom: '40px',
            border: '1px solid #fca5a5',
            fontSize: '1.2rem',
            margin: isMobile ? '0 15px 40px' : '0 auto 40px'
          }}>
            ⚠️ Erreur : {error}
          </div>
        )}

        <div style={{
          background: '#ffffff',
          borderRadius: '32px',
          padding: isMobile ? '20px' : '60px',
          boxShadow: '0 50px 120px rgba(0,0,0,0.15)',
          marginBottom: '60px',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '420px 1fr',
            gap: isMobile ? '30px' : '60px',
            alignItems: 'start'
          }}>

            {/* Formulaire Ajout */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              padding: formPadding,
              borderRadius: '28px',
              border: '2px solid #86efac',
              boxShadow: '0 30px 80px rgba(34, 197, 94, 0.2)',
              height: 'fit-content'
            }}>
              <h2 style={{ fontSize: h2FontSize, margin: '0 0 40px', color: '#166534' }}>
                Ajouter un Compte
              </h2>

              <form onSubmit={handleAdd}>
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ ...labelBaseStyle, fontSize: labelFontSize }}>
                    Numéro de compte
                  </label>
                  <input
                    name="numero_compte"
                    value={newCompte.numero_compte}
                    onChange={handleAddChange}
                    placeholder="Ex: 411100"
                    required
                    style={{
                      ...inputBaseStyle,
                        padding: inputPadding,
                      border: '2px solid #86efac',
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{ ...labelBaseStyle, fontSize: labelFontSize }}>
                    Libellé
                  </label>
                  <input
                    name="libelle_compte"
                    value={newCompte.libelle_compte}
                    onChange={handleAddChange}
                    placeholder="Ex: Clients divers"
                    required
                    style={{
                      ...inputBaseStyle,
                        padding: inputPadding,
                      border: '2px solid #86efac',
                      fontSize: isMobile ? '1.1rem' : '1.2rem',
                      fontWeight: 400
                    }}
                  />
                </div>

                <div style={{ marginBottom: '40px' }}>
                  <label style={{ ...labelBaseStyle, fontSize: labelFontSize }}>
                    Classe (automatique)
                  </label>
                  <div style={{
                    padding: inputPadding,
                    background: '#ecfdf5',
                    borderRadius: '20px',
                    fontSize: isMobile ? '1.8rem' : '2.4rem',
                    fontWeight: 900,
                    textAlign: 'center',
                    color: '#166534',
                    fontFamily: 'monospace',
                    border: '2px dashed #86efac'
                  }}>
                    {newCompte.classe_compte || '-'}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: isMobile ? '18px' : '22px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: isMobile ? '1.3rem' : '1.5rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 20px 50px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {loading ? 'Ajout...' : '+ Ajouter au Plan Maître'}
                </button>
              </form>
            </div>

            {/* Tableau des comptes */}
            <div style={{ marginTop: isMobile ? '30px' : '0' }}>
              <input
                type="text"
                placeholder="Rechercher un compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px 18px' : '22px 60px 22px 24px',
                  borderRadius: '24px',
                  border: '2px solid #d1d5db',
                  background: '#f9fafb',
                  fontSize: isMobile ? '1.1rem' : '1.3rem',
                  marginBottom: '30px',
                  backgroundImage: isMobile ? 'none' : 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Ccircle cx=%2711%27 cy=%2711%27 r=%278%27/%3E%3Cpath d=%27m21 21-4.35-4.35%27/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 20px center'
                }}
              />

              <div style={{
                background: '#ffffff',
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                maxHeight: '74vh',
                overflowY: 'auto'
              }}>
                
                {filteredComptes.length === 0 ? (
                    // --- Message "Aucun compte trouvé"
                    <div style={{ padding: '80px 40px', textAlign: 'center', color: '#94a3b8', fontSize: '1.6rem' }}>
                        Aucun compte trouvé
                    </div>
                ) : (
                    // --- Rendu du tableau / cartes (Vue Conditionnelle)
                    isMobile ? (
                        // VUE MOBILE: Cartes empilées
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
                            {filteredComptes.map((c) => (
                                <div key={c.id_modele} style={{
                                    background: '#f8fafc',
                                    padding: '15px',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                    borderLeft: `5px solid #6366f1`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ maxWidth: '70%' }}>
                                            <p style={{ margin: '0 0 5px 0', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.4rem', color: '#1e293b' }}>
                                                {c.numero_compte}
                                            </p>
                                            <span style={{ fontSize: '1rem', color: '#374151', fontWeight: 600 }}>
                                                {editingId === c.id_modele ? (
                                                    <input
                                                        value={editValues.libelle}
                                                        onChange={(e) => setEditValues({ ...editValues, libelle: e.target.value })}
                                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '2px solid #6366f1' }}
                                                    />
                                                ) : c.libelle_compte}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Classe:</strong>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                background: '#e0e7ff', 
                                                color: '#4338ca', 
                                                borderRadius: '50px', 
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}>
                                                {c.classe_compte}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                        {editingId === c.id_modele ? (
                                            <>
                                                <button onClick={saveEdit} style={{
                                                    padding: '8px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem'
                                                }}>Valider</button>
                                                <button onClick={() => setEditingId(null)} style={{
                                                    padding: '8px 18px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem'
                                                }}>Annuler</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(c)} style={{
                                                    padding: '8px 18px', background: '#f59e0b', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem'
                                                }}>Éditer</button>
                                                <button onClick={() => handleDelete(c.id_modele)} style={{
                                                    padding: '8px 18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem'
                                                }}>Supprimer</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // VUE DESKTOP: Tableau classique
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: '0 14px' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                        <th style={{ padding: '28px 30px', textAlign: 'left', color: 'white', fontSize: '1.3rem', fontWeight: 700, width: '25%' }}>Numéro</th>
                                        <th style={{ padding: '28px 30px', textAlign: 'left', color: 'white', fontSize: '1.3rem', fontWeight: 700, width: '55%' }}>Libellé</th>
                                        <th style={{ padding: '28px 30px', textAlign: 'right', color: 'white', fontSize: '1.3rem', fontWeight: 700, width: '20%' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredComptes.map((c) => (
                                        <tr key={c.id_modele} style={{
                                            background: '#f8fafc',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.05)'
                                        }}>
                                            <td style={{ padding: '28px 30px', fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                                                {editingId === c.id_modele ? (
                                                    <input
                                                        value={editValues.numero}
                                                        onChange={(e) => setEditValues({ ...editValues, numero: e.target.value })}
                                                        style={{ width: '140px', padding: '12px', borderRadius: '12px', border: '2px solid #6366f1', fontWeight: 600 }}
                                                    />
                                                ) : c.numero_compte}
                                            </td>
                                            <td style={{ padding: '28px 30px', fontSize: '1.2rem', color: '#374151' }}>
                                                {editingId === c.id_modele ? (
                                                    <input
                                                        value={editValues.libelle}
                                                        onChange={(e) => setEditValues({ ...editValues, libelle: e.target.value })}
                                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #6366f1' }}
                                                    />
                                                ) : c.libelle_compte}
                                            </td>
                                            <td style={{ padding: '28px 30px', textAlign: 'right' }}>
                                                {editingId === c.id_modele ? (
                                                    <>
                                                        <button onClick={saveEdit} style={{
                                                            padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, marginLeft: '10px'
                                                        }}>Valider</button>
                                                        <button onClick={() => setEditingId(null)} style={{
                                                            padding: '12px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, marginLeft: '10px'
                                                        }}>Annuler</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(c)} style={{
                                                            padding: '12px 24px', background: '#f59e0b', color: 'black', border: 'none', borderRadius: '14px', fontWeight: 700, marginLeft: '10px'
                                                        }}>Éditer</button>
                                                        <button onClick={() => handleDelete(c.id_modele)} style={{
                                                            padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 700, marginLeft: '10px'
                                                        }}>Supprimer</button>
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

        <div style={{
          padding: isMobile ? '30px' : '50px',
          background: '#f8fafc',
          borderRadius: '28px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '1.2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          margin: isMobile ? '0 15px' : '0 auto',
          marginTop: '40px'
        }}>
          <p>
            Plan comptable SYSCOA Révisé • Modèle officiel • Utilisé comme base pour toutes les nouvelles entreprises
          </p>
        </div>
      </div>
    </div>
  );
}
