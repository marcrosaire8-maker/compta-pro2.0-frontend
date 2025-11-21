import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Importer les Layouts et le "Cerveau"
import AdminLayout from './components/AdminLayout.jsx'; 
import { useAuth } from './contexts/AuthContext.jsx'; 
import AppLayout from './components/AppLayout.jsx'; 

// 2. Importer toutes les Pages
import LoginPage from './pages/LoginPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx'; 
import FacturationPage from './pages/FacturationPage.jsx';
import AchatsPage from './pages/AchatsPage.jsx';
import SaisiePage from './pages/SaisiePage.jsx';
import StocksPage from './pages/StocksPage.jsx';
import ImmobilisationsPage from './pages/ImmobilisationsPage.jsx';
import PlanComptablePage from './pages/PlanComptablePage.jsx';
import PaiePage from './pages/PaiePage.jsx';
import BalancePage from './pages/BalancePage.jsx';
import CompteResultatPage from './pages/CompteResultatPage.jsx';
import BilanPage from './pages/BilanPage.jsx';
import SuperAdminPage from './pages/SuperAdminPage.jsx';
import ExercicesPage from './pages/ExercicesPage.jsx';
import MembresPage from './pages/MembresPage.jsx';
import AdminCompanyManagerPage from './pages/AdminCompanyManagerPage.jsx';
import AdminMasterPlanPage from './pages/AdminMasterPlanPage.jsx';
import AdminActivityLogPage from './pages/AdminActivityLogPage.jsx';
import AdminConfigurationPage from './pages/AdminConfigurationPage.jsx';
import AdminMonetizationPage from './pages/AdminMonetizationPage.jsx';
import AdminGlobalUsersPage from './pages/AdminGlobalUsersPage.jsx';


function App() {
  const { session, loading, company, isSuperAdmin } = useAuth(); 

  // --- FILTRE 1: CHARGEMENT ---
  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Chargement de l'application...</div>;
  }

  // --- FILTRE 2: ONBOARDING (Priorité 1) ---
  // SI connecté ET (pas d'entreprise OU nom par défaut) -> Direction SetupPage
  if (session && (!company || company.nom_entreprise === '__DEFAULT_NAME__')) {
    return (
      <Routes>
        <Route path="*" element={<SetupPage />} />
      </Routes>
    );
  }

  // --- FILTRE 3: ESPACE ADMINISTRATEUR (Isolation totale) ---
  if (session && isSuperAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<SuperAdminPage />} />
          <Route path="companies" element={<AdminCompanyManagerPage />} />
          <Route path="master-plan" element={<AdminMasterPlanPage />} /> 
          <Route path="audit" element={<AdminActivityLogPage />} /> 
          <Route path="config" element={<AdminConfigurationPage />} /> 
          <Route path="monetization" element={<AdminMonetizationPage />} />
          <Route path="users" element={<AdminGlobalUsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} /> 
      </Routes>
    );
  }

  // --- FILTRE 4: ESPACE ENTREPRISE STANDARD (Utilisateurs normaux) ---
  return (
    <Routes>
      
      <Route
        path="/"
        element={
          !session ? <Navigate to="/login" replace /> : <AppLayout />
        }
      >
        <Route index element={<DashboardPage />} /> 
        <Route path="facturation" element={<FacturationPage />} />
        <Route path="achats" element={<AchatsPage />} /> 
        <Route path="saisie" element={<SaisiePage />} />
        <Route path="stocks" element={<StocksPage />} /> 
        <Route path="immobilisations" element={<ImmobilisationsPage />} /> 
        <Route path="paie" element={<PaiePage />} /> 
        <Route path="mon-plan" element={<PlanComptablePage />} />
        <Route path="exercices" element={<ExercicesPage />} /> 
        <Route path="membres" element={<MembresPage />} />
        <Route path="balance" element={<BalancePage />} /> 
        <Route path="compte-resultat" element={<CompteResultatPage />} /> 
        <Route path="bilan" element={<BilanPage />} /> 
        
        {/* Bloque l'accès /admin aux utilisateurs normaux */}
        <Route path="admin" element={<Navigate to="/" replace />} />
      </Route>
      
      {/* Route publique (connexion) */}
      <Route
        path="/login"
        element={
          !session ? <LoginPage /> : <Navigate to="/" replace />
        }
      />

      <Route path="*" element={<h1>404 | Page non trouvée</h1>} />
      
    </Routes>
  );
}

export default App;
