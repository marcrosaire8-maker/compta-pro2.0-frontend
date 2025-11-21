import { useState } from 'react';
import { supabase } from '../utils/supabaseClient.js';

const styles = {
  // Fond animé avec gradient qui bouge lentement
  loginPageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    // Fond gradient animé
    background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #2d1b69, #3b82f6, #6366f1, #8b5cf6, #ec4899)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 20s ease infinite',
  },

  // Vague animée en arrière-plan (effet subtil)
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3), transparent 50%), radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.25), transparent 50%)',
    animation: 'wave 25s ease-in-out infinite',
    zIndex: 1,
    pointerEvents: 'none',
  },

  // Boîte principale avec glassmorphism
  loginFormBox: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)',
    color: 'white',
    textAlign: 'center',
  },

  title: {
    margin: '0 0 32px 0',
    fontSize: '36px',
    fontWeight: 800,
    background: 'linear-gradient(90deg, #60a5fa, #c084fc, #f472b6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
  },

  formGroup: {
    marginBottom: '24px',
    textAlign: 'left',
  },

  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 600,
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: '0.5px',
  },

  input: {
    width: '100%',
    padding: '16px 18px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    outline: 'none',
  },

  // Effet au focus sur les inputs
  inputFocus: {
    border: '1px solid rgba(139, 92, 246, 0.8)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
    background: 'rgba(255, 255, 255, 0.2)',
  },

  loginButton: {
    width: '100%',
    padding: '16px',
    marginTop: '10px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
    marginBottom: '20px',
  },

  loginButtonHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 15px 35px rgba(139, 92, 246, 0.6)',
  },

  errorMessage: {
    color: '#fca5a5',
    margin: '15px 0',
    fontSize: '14px',
    background: 'rgba(254, 226, 226, 0.15)',
    padding: '10px',
    borderRadius: '8px',
  },

  toggleAuth: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  toggleAuthLink: {
    color: '#c084fc',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};

// Ajouter les animations dans le JSX avec @keyframes via style tag injecté
const keyframesStyle = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes wave {
    0%, 100% { transform: translateX(0) translateY(0); }
    50% { transform: translateX(-50px) translateY(-30px); }
  }
  input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Fonctions inchangées
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    alert('Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      isLoginView ? await handleLogin() : await handleSignUp();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Injection des animations */}
      <style jsx>{keyframesStyle}</style>

      <div style={styles.loginPageContainer}>
        <div style={styles.animatedBackground} />

        <div style={styles.loginFormBox}>
          <h2 style={styles.title}>
            {isLoginView ? 'Bienvenue' : 'Rejoignez-nous'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <input
                type="email"
                id="email"
                style={{
                  ...styles.input,
                  ...(focusedInput === 'email' ? styles.inputFocus : {}),
                }}
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Mot de passe</label>
              <input
                type="password"
                id="password"
                style={{
                  ...styles.input,
                  ...(focusedInput === 'password' ? styles.inputFocus : {}),
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                required
                minLength={6}
              />
            </div>

            {error && <p style={styles.errorMessage}>{error}</p>}

            <button
              type="submit"
              style={{
                ...styles.loginButton,
                ...(isHovered ? styles.loginButtonHover : {}),
                opacity: loading ? 0.8 : 1,
              }}
              disabled={loading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {loading ? 'Patientez...' : (isLoginView ? 'Se connecter' : 'Créer mon compte')}
            </button>
          </form>

          <p style={styles.toggleAuth}>
            {isLoginView ? "Nouveau ici ? " : "Déjà membre ? "}
            <span style={styles.toggleAuthLink} onClick={() => setIsLoginView(!isLoginView)}>
              {isLoginView ? 'Créer un compte' : 'Se connecter'}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
