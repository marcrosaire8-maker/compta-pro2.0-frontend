import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // État pour l'administrateur
  const [loading, setLoading] = useState(true);

  // Fonction stable (useCallback) pour chercher le profil et l'entreprise
  // Ceci corrige l'erreur de "scope" précédente (fetchUserProfile is not defined)
  const fetchUserProfile = useCallback(async (userId) => {
    setLoading(true);
    try {
      // 1. Récupérer le profil et l'entreprise (en gérant les doublons potentiels avec .single())
      const { data: profileData, error: profileError } = await supabase
        .from('profilsutilisateurs')
        .select('*, entreprise:entreprises (*)')
        .eq('user_id', userId)
        .single(); // On utilise .single() car la BDD est censée avoir une contrainte UNIQUE
        
      if (profileError) {
          // Si le profil n'existe pas (0 lignes), on suppose qu'il a été supprimé ou est en cours de création
          if (profileError.code === 'PGRST116') { // Erreur "single row expected but got 0"
              setProfile(null);
              setCompany(null);
              setIsSuperAdmin(false);
              return; // Sortir proprement
          }
          throw profileError;
      }

      // 2. VÉRIFIER SI L'UTILISATEUR EST UN SUPER ADMIN
      // On utilise .maybeSingle() pour tolérer 0 résultat (s'il n'est pas admin)
      const { data: adminData } = await supabase
        .from('superadmins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle(); 

      // On stocke les données
      setProfile(profileData);
      setCompany(profileData.entreprise);
      setIsSuperAdmin(!!adminData); // Est un admin si adminData n'est pas null
      
    } catch (error) {
      console.error("Erreur fatale de données dans fetchUserProfile:", error.message);
      // Ceci couvre l'erreur "Cannot coerce..." (plusieurs lignes) : on déconnecte pour forcer le nettoyage.
      supabase.auth.signOut(); 
      setSession(null);
      setIsSuperAdmin(false);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Gérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Écouter les changements (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user.id);
        } else {
          // Réinitialiser les états à la déconnexion
          setProfile(null);
          setCompany(null);
          setIsSuperAdmin(false); 
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile est une dépendance car il est dans useCallback

  // Le "value" est ce que l'on partage
  const value = {
    session,
    profile,
    company,
    isSuperAdmin, // On partage l'info Super Admin
    loading,
    refreshProfile: () => {
      if (session) fetchUserProfile(session.user.id);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
