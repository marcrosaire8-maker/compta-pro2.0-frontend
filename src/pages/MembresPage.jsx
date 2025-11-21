// src/pages/MembresPage.jsx
import { useState, useEffect, useCallback } from 'react';
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
const selectBaseStyle = {
    padding: '12px 20px',
    borderRadius: '12px',
    border: '2px solid #ddd',
    fontSize: '1rem',
    minWidth: '180px',
    width: '100%',
    boxSizing: 'border-box'
};

export default function MembresPage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [membres, setMembres] = useState([]);
  const [editingRole, setEditingRole] = useState({});
  const { company } = useAuth();

  const roles = ['comptable', 'gestionnaire', 'admin_entite'];

  const [inviteForm, setInviteForm] = useState({
    email: '', password: '', nom: '', prenom: '', role: 'comptable'
  });
  const [inviteError, setInviteError] = useState(null);

  const fetchMembres = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profilsutilisateurs')
      .select('id_profil, user_id, email, nom, prenom, role')
      .order('nom');

    if (error) setError(error.message);
    else setMembres(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembres();
  }, [fetchMembres]);

  const handleInviteChange = (e) => {
    setInviteForm({ ...inviteForm, [e.target.name]: e.target.value });
  };

  const handleInviteNewMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInviteError(null);

    const { email, password, nom, prenom, role } = inviteForm;

    try {
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email, password,
      });
      if (signUpError) throw signUpError;

      const newUserId = userData.user.id;

      const { data: profileToUpdate, error: fetchProfileError } = await supabase
        .from('profilsutilisateurs')
        .select('id_profil, entreprise_id')
        .eq('user_id', newUserId)
        .single();
      if (fetchProfileError) throw fetchProfileError;

      const oldEnterpriseId = profileToUpdate.entreprise_id;

      const { error: updateError } = await supabase
        .from('profilsutilisateurs')
        .update({
          entreprise_id: company.id_entreprise,
          role: role,
          nom: nom,
          prenom: prenom
        })
        .eq('id_profil', profileToUpdate.id_profil);
      if (updateError) throw updateError;

      if (oldEnterpriseId) {
        await supabase.from('entreprises').delete().eq('id_entreprise', oldEnterpriseId);
      }

      alert(`Invitation envoyée avec succès à ${email} !`);
      setInviteForm({ email: '', password: '', nom: '', prenom: '', role: 'comptable' });
      fetchMembres();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (id, newRole) => {
    setEditingRole({ ...editingRole, [id]: newRole });
  };

  const handleSaveRole = async (id, newRole) => {
    setLoading(true);
    const { error } = await supabase
      .from('profilsutilisateurs')
      .update({ role: newRole })
      .eq('id_profil', id);

    if (error) {
      setError(error.message);
    } else {
      setEditingRole(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      fetchMembres();
    }
    setLoading(false);
  };

  if (loading && membres.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem' }}>Chargement des membres...</p>
      </div>
    );
  }
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '5.5rem'; 
  const headerSubtitleSize = isMobile ? '1.2rem' : '2rem'; 
  const formPadding = isMobile ? '25px' : '50px';
  const inputPadding = isMobile ? '14px' : '18px';
  const inputFontSize = isMobile ? '1rem' : '1.1rem';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      padding: isMobile ? '15px 0' : '40px 20px' // Pleine largeur mobile
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

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
          overflow: 'hidden',
          margin: isMobile ? '0 15px' : '0 auto' // Marge latérale compensatoire
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-4px' }}>
            Membres & Accès
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
            Gestion fine des utilisateurs • Rôles • Invitations sécurisées
          </p>
          <p style={{ marginTop: '15px', fontSize: isMobile ? '1.1rem' : '1.4rem', opacity: 0.9 }}>
            Entreprise : <strong>{company?.nom_entreprise}</strong>
          </p>
        </div>

        {/* Messages globaux */}
        {error && (
          <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>
            Erreur : {error}
          </div>
        )}

        {/* FORMULAIRE D'INVITATION */}
        <div style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: formPadding,
          boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
          marginBottom: '50px',
          margin: isMobile ? '0 15px 50px' : '0 auto 50px' // Marge latérale compensatoire
        }}>
          <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', marginTop: 0, color: '#2c3e50', marginBottom: '40px', textAlign: 'center' }}>
            Inviter un Nouveau Membre
          </h2>

          <form onSubmit={handleInviteNewMember}>
            <div style={{ 
                // Grille fluide qui s'empile sur mobile
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: isMobile ? '15px' : '30px' 
            }}>
              <div>
                <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Email</label>
                <input type="email" name="email" value={inviteForm.email} onChange={handleInviteChange} required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
                  placeholder="collaborateur@entreprise.com" />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Nom</label>
                <input type="text" name="nom" value={inviteForm.nom} onChange={handleInviteChange} required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Prénom</label>
                <input type="text" name="prenom" value={inviteForm.prenom} onChange={handleInviteChange} required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Mot de passe temporaire</label>
                <input type="password" name="password" value={inviteForm.password} onChange={handleInviteChange} required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }} />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px', fontSize: inputFontSize }}>Rôle</label>
                <select name="role" value={inviteForm.role} onChange={handleInviteChange} required
                  style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}>
                  {roles.map(r => (
                    <option key={r} value={r}>{r === 'admin_entite' ? 'Admin Entreprise' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button type="submit" disabled={loading}
                style={{
                  padding: isMobile ? '16px 40px' : '20px 60px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 15px 40px rgba(40,167,69,0.4)'
                }}>
                {loading ? 'Envoi en cours...' : 'Envoyer l\'Invitation'}
              </button>
            </div>
            {inviteError && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', textAlign: 'center' }}>
                {inviteError}
              </div>
            )}
          </form>
        </div>

        {/* LISTE DES MEMBRES */}
        <div style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: formPadding,
          boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
          margin: isMobile ? '0 15px' : '0 auto', // Marge latérale compensatoire
          marginTop: isMobile ? '30px' : '0' 
        }}>
          <h2 style={{ fontSize: isMobile ? '2.2rem' : '2.8rem', marginTop: 0, color: '#2c3e50', marginBottom: '40px', textAlign: 'center' }}>
            Membres Actuels ({membres.length})
          </h2>

          {membres.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '60px', color: '#95a5a6', fontSize: '1.3rem' }}>
                    Aucun membre enregistré (vous devriez être le premier !).
                </p>
            ) : (
                isMobile ? (
                    // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {membres.map(m => (
                            <div key={m.id_profil} style={{
                                background: '#f8fafc',
                                padding: '15px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                borderLeft: `5px solid ${m.role === 'admin_entite' ? '#e74c3c' : '#3498db'}`
                            }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {m.prenom} {m.nom}
                                </p>
                                <p style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '0.9rem' }}>
                                    {m.email}
                                </p>
                                <hr style={{ margin: '10px 0', borderTop: '1px solid #e5e7eb' }}/>
                                
                                <div style={{ marginBottom: '10px' }}>
                                    <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Rôle Actuel:</strong>
                                    <span style={{ fontWeight: 'bold', color: '#3498db' }}>
                                        {m.role === 'admin_entite' ? 'Admin Entreprise' : m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                    </span>
                                </div>

                                {/* Sélecteur et Action */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                    <label style={{ fontWeight: 700, color: '#333', display: 'block', fontSize: '0.9rem' }}>Changer le Rôle</label>
                                    <select
                                        value={editingRole[m.id_profil] || m.role}
                                        onChange={(e) => handleRoleChange(m.id_profil, e.target.value)}
                                        style={{ ...selectBaseStyle, padding: '10px', fontSize: '0.9rem' }}
                                    >
                                        {roles.map(r => (
                                            <option key={r} value={r}>
                                                {r === 'admin_entite' ? 'Admin Entreprise' : r.charAt(0).toUpperCase() + r.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {editingRole[m.id_profil] && editingRole[m.id_profil] !== m.role && (
                                        <button
                                            onClick={() => handleSaveRole(m.id_profil, editingRole[m.id_profil])}
                                            disabled={loading}
                                            style={{
                                                padding: '10px 20px',
                                                background: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Sauvegarder la Modification
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                ) : (
                    // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px' }}>Membre</th>
                                    <th style={{ padding: '20px', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '20px', textAlign: 'center' }}>Rôle Actuel</th>
                                    <th style={{ padding: '20px', textAlign: 'center' }}>Nouveau Rôle</th>
                                    <th style={{ padding: '20px', textAlign: 'center', borderRadius: '0 16px 16px 0' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {membres.map(m => (
                                    <tr key={m.id_profil} style={{ background: '#f8f9fa', borderRadius: '16px' }}>
                                        <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '1.15rem' }}>
                                            {m.prenom} {m.nom}
                                        </td>
                                        <td style={{ padding: '20px' }}>{m.email}</td>
                                        <td style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold', color: '#3498db' }}>
                                            {m.role === 'admin_entite' ? 'Admin' : m.role}
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'center' }}>
                                            <select
                                                value={editingRole[m.id_profil] || m.role}
                                                onChange={(e) => handleRoleChange(m.id_profil, e.target.value)}
                                                style={selectBaseStyle}
                                            >
                                                {roles.map(r => (
                                                    <option key={r} value={r}>
                                                        {r === 'admin_entite' ? 'Admin Entreprise' : r.charAt(0).toUpperCase() + r.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'center' }}>
                                            {editingRole[m.id_profil] && editingRole[m.id_profil] !== m.role && (
                                                <button
                                                    onClick={() => handleSaveRole(m.id_profil, editingRole[m.id_profil])}
                                                    disabled={loading}
                                                    style={{
                                                        padding: '12px 30px',
                                                        background: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '12px',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Sauvegarder
                                                </button>
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
          <p>Gestion multi-utilisateur • RLS Supabase • Invitations sécurisées • Audit complet</p>
        </div>
      </div>
    </div>
  );
}
