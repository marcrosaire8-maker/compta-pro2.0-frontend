// src/pages/SetupPage.jsx
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SetupPage() {
  const { session, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Veuillez saisir le nom de votre entreprise");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Démarrage de l'installation...");

    try {
      const userId = session.user.id;
      const userEmail = session.user.email;

      // 1. Création de l'entreprise
      setStatus("Création de votre entreprise...");
      const { data: entreprise, error: entError } = await supabase
        .from('entreprises')
        .insert({ nom_entreprise: companyName.trim(), plan_id: 1 })
        .select()
        .single();

      if (entError) throw entError;
      const entrepriseId = entreprise.id_entreprise;

      // 2. Profil utilisateur (admin)
      setStatus("Vous nommez administrateur...");
      const { data: existing } = await supabase
        .from('profilsutilisateurs')
        .select('id_profil')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('profilsutilisateurs').insert({
          user_id: userId,
          email: userEmail,
          role: 'admin_entite',
          entreprise_id: entrepriseId,
          nom: 'Admin',
          prenom: 'Principal'
        });
      } else {
        await supabase
          .from('profilsutilisateurs')
          .update({ entreprise_id: entrepriseId })
          .eq('user_id', userId);
      }

      // 3. Plan comptable SYSCOHADA
      setStatus("Import du plan comptable SYSCOHADA...");
      const { error: rpcError } = await supabase.rpc('copier_plan_comptable_pour_entreprise', {
        p_entreprise_id: entrepriseId
      });
      if (rpcError) console.warn("RPC non trouvée (normal si pas encore créée)", rpcError);

      // 4. Exercice comptable
      setStatus("Ouverture de l'exercice en cours...");
      const year = new Date().getFullYear();
      await supabase.from('exercicescomptables').insert({
        entreprise_id: entrepriseId,
        libelle: `Exercice ${year}`,
        date_debut: `${year}-01-01`,
        date_fin: `${year}-12-31`,
        statut: 'Ouvert'
      });

      // 5. Journaux par défaut
      setStatus("Création des journaux standards...");
      await supabase.from('journaux').insert([
        { entreprise_id: entrepriseId, code_journal: 'VT', libelle_journal: 'Ventes' },
        { entreprise_id: entrepriseId, code_journal: 'AC', libelle_journal: 'Achats' },
        { entreprise_id: entrepriseId, code_journal: 'BQ', libelle_journal: 'Banque' },
        { entreprise_id: entrepriseId, code_journal: 'OD', libelle_journal: 'Opérations Diverses' },
        { entreprise_id: entrepriseId, code_journal: 'PA', libelle_journal: 'Paie' }
      ]);

      setStatus("Installation terminée ! Bienvenue !");
      setTimeout(() => refreshProfile(), 2000);

    } catch (err) {
      console.error("Setup error:", err);
      setError(err.message || "Une erreur est survenue lors de l'installation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'float 20s infinite linear'
      }}></div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '70px 60px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.3)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '5.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 20px 0',
            letterSpacing: '-3px'
          }}>
            ComptaPro
          </h1>
          <p style={{ fontSize: '2rem', color: '#4c1d95', fontWeight: 700, margin: 0 }}>
            Bienvenue, futur expert-comptable !
          </p>
          <p style={{ fontSize: '1.3rem', color: '#6366f1', margin: '20px 0 0', fontWeight: 500 }}>
            Configuration en 30 secondes chrono
          </p>
        </div>

        <form onSubmit={handleSetup}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '15px'
            }}>
              Nom de votre entreprise
            </label>
            <input
              type="text"
              placeholder="Ex: WARA SARL, Alpha Services..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '18px',
                border: '2px solid #e2e8f0',
                fontSize: '1.3rem',
                backgroundColor: '#f8fafc',
                transition: 'border 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{
              padding: '18px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '16px',
              marginBottom: '20px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{
              padding: '20px',
              background: '#e0e7ff',
              color: '#4338ca',
              borderRadius: '16px',
              marginBottom: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '1.2rem'
            }}>
              {status}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '22px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '18px',
              fontSize: '1.6rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 20px 50px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Installation en cours...' : 'Créer mon espace ComptaPro'}
          </button>
        </form>

        <div style={{
          marginTop: '50px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '1rem'
        }}>
          <p>Plan comptable SYSCOHADA • Journaux automatiques • Sécurité RLS • 100% Afrique</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(100px, 100px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
