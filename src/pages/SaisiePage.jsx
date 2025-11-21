// src/pages/SaisiePage.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);
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

export default function SaisiePage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [header, setHeader] = useState({
    date_ecriture: new Date().toISOString().split('T')[0],
    journal_id: '',
    libelle_operation: ''
  });

  const [lines, setLines] = useState([
    { compte_id: '', montant_debit: '', montant_credit: '' },
    { compte_id: '', montant_debit: '', montant_credit: '' }
  ]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: j }, { data: a }] = await Promise.all([
          supabase.from('journaux').select('*').order('code_journal'),
          supabase.from('plancomptableentreprise').select('*').order('numero_compte')
        ]);
        setJournals(j || []);
        setAccounts(a || []);
      } catch (err) {
        setError("Erreur de chargement des données : " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const addNewLine = () => {
    setLines([...lines, { compte_id: '', montant_debit: '', montant_credit: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) {
      alert("Vous devez garder au moins 2 lignes");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + parseFloat(line.montant_debit || 0), 0);
    const credit = lines.reduce((sum, line) => sum + parseFloat(line.montant_credit || 0), 0);
    return {
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      balance: (debit - credit).toFixed(2),
      isBalanced: Math.abs(debit - credit) < 0.01
    };
  }, [lines]);

  const handleSave = async (statut) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!header.journal_id || !header.libelle_operation) {
      setError("Veuillez remplir le journal et le libellé");
      setLoading(false);
      return;
    }

    if (!totals.isBalanced && statut === 'Validee') {
      setError("L'écriture doit être équilibrée (Débit = Crédit) pour être validée");
      setLoading(false);
      return;
    }

    try {
      const { data: ecriture, error: eErr } = await supabase
        .from('ecritures')
        .insert({
          date_ecriture: header.date_ecriture,
          journal_id: header.journal_id,
          libelle_operation: header.libelle_operation.trim(),
          statut: statut
        })
        .select()
        .single();

      if (eErr) throw eErr;

      const preparedLines = lines
        .filter(l => l.compte_id && (l.montant_debit || l.montant_credit))
        .map(l => ({
          ecriture_id: ecriture.id_ecriture,
          compte_id: l.compte_id,
          montant_debit: parseFloat(l.montant_debit || 0),
          montant_credit: parseFloat(l.montant_credit || 0)
        }));

      const { error: lErr } = await supabase
        .from('lignesecriture')
        .insert(preparedLines);

      if (lErr) throw lErr;

      setSuccess(`Écriture ${statut === 'Validee' ? 'validée' : 'enregistrée en brouillon'} avec succès !`);
      setTimeout(() => setSuccess(null), 5000);

      // Reset
      setHeader({
        date_ecriture: new Date().toISOString().split('T')[0],
        journal_id: '',
        libelle_operation: ''
      });
      setLines([
        { compte_id: '', montant_debit: '', montant_credit: '' },
        { compte_id: '', montant_debit: '', montant_credit: '' }
      ]);

    } catch (err) {
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && journals.length === 0) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', border: '8px solid #f3f3f3', borderTop: '8px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.8rem', color: '#2c3e50' }}>Chargement du module de saisie...</p>
      </div>
    );
  }

    // --- STYLES CONDITIONNELS POUR RESPONSIVITÉ MAXIMALE ---
    const headerTitleSize = isMobile ? '2.5rem' : '5.8rem'; 
    const headerSubtitleSize = isMobile ? '1.2rem' : '2.2rem'; 
    const formPadding = isMobile ? '15px' : '60px';
    const inputPadding = isMobile ? '14px' : '18px';
    const inputFontSize = isMobile ? '1rem' : '1.1rem';
    const totalFontSize = isMobile ? '1.4rem' : '1.8rem';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      // Pleine largeur mobile
      padding: isMobile ? '15px 0' : '40px 20px'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER ÉPIQUE */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: isMobile ? '30px 20px' : '80px 60px',
          borderRadius: '32px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 40px 90px rgba(102,126,234,0.5)'
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-2px' : '-5px' }}>
            Saisie Comptable
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
            Enregistrement des opérations • Contrôle Débit/Crédit • Validation instantanée
          </p>
        </div>

        {/* Messages */}
        {error && <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>{error}</div>}
        {success && <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '18px', marginBottom: '30px', fontWeight: 'bold', margin: isMobile ? '0 15px' : '0 auto' }}>{success}</div>}

        {/* FORMULAIRE PRINCIPAL */}
        <div style={{
          background: '#ffffff',
          borderRadius: '32px',
          padding: formPadding,
          boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
          marginBottom: '50px',
          margin: isMobile ? '0 15px' : '0 auto' // Marge latérale compensatoire sur mobile
        }}>
          {/* EN-TÊTE DE L'ÉCRITURE */}
          <div style={{ 
                // La grille s'empile sur mobile, sinon 3 colonnes 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '200px 300px 1fr', 
                gap: isMobile ? '20px' : '30px', 
                marginBottom: '50px' 
            }}>
            <div>
              <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '12px', display: 'block', fontSize: inputFontSize }}>Date</label>
              <input
                type="date"
                name="date_ecriture"
                value={header.date_ecriture}
                onChange={handleHeaderChange}
                style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '12px', display: 'block', fontSize: inputFontSize }}>Journal</label>
              <select
                name="journal_id"
                value={header.journal_id}
                onChange={handleHeaderChange}
                style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
              >
                <option value="">-- Choisir --</option>
                {journals.map(j => (
                  <option key={j.id_journal} value={j.id_journal}>
                    {j.code_journal} - {j.libelle_journal}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '12px', display: 'block', fontSize: inputFontSize }}>Libellé de l'opération</label>
              <input
                type="text"
                name="libelle_operation"
                value={header.libelle_operation}
                onChange={handleHeaderChange}
                placeholder="Ex: Achat de fournitures de bureau"
                style={{ ...inputBaseStyle, padding: inputPadding, fontSize: inputFontSize }}
              />
            </div>
          </div>

          {/* LIGNES DE SAISIE */}
          {isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {lines.map((line, i) => (
                        <div key={i} style={{ 
                            background: '#f8fafc', 
                            padding: '15px', 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            borderLeft: '5px solid #667eea'
                        }}>
                            {/* Ligne 1: Compte */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>Compte</label>
                                <select
                                    value={line.compte_id}
                                    onChange={(e) => handleLineChange(i, 'compte_id', e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                >
                                    <option value="">-- Choisir un compte --</option>
                                    {accounts.map(a => (
                                        <option key={a.id_compte} value={a.id_compte}>
                                            {a.numero_compte} - {a.libelle_compte}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Ligne 2: Débit / Crédit (Flex) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>Débit</label>
                                    <input
                                        type="number"
                                        value={line.montant_debit}
                                        onChange={(e) => handleLineChange(i, 'montant_debit', e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', textAlign: 'right', fontSize: '1rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>Crédit</label>
                                    <input
                                        type="number"
                                        value={line.montant_credit}
                                        onChange={(e) => handleLineChange(i, 'montant_credit', e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e1', textAlign: 'right', fontSize: '1rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Ligne 3: Suppression */}
                            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                <button
                                    onClick={() => removeLine(i)}
                                    disabled={lines.length <= 2}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: lines.length <= 2 ? '#94a3b8' : '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: lines.length <= 2 ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Supprimer la ligne {i + 1}
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Bouton Ajouter ligne mobile (Pleine largeur) */}
                    <button
                        onClick={addNewLine}
                        style={{
                            marginTop: '10px',
                            padding: '15px 32px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(16,185,129,0.3)'
                        }}
                    >
                        + Ajouter une ligne
                    </button>
                </div>
            ) : (
                // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px', fontWeight: 700, width: '45%' }}>Compte</th>
                                <th style={{ padding: '20px', textAlign: 'right', fontWeight: 700, width: '20%' }}>Débit</th>
                                <th style={{ padding: '20px', textAlign: 'right', fontWeight: 700, width: '20%' }}>Crédit</th>
                                <th style={{ padding: '20px', textAlign: 'center', borderRadius: '0 16px 16px 0', width: '15%' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => (
                                <tr key={i} style={{ background: '#f8fafc' }}>
                                    <td style={{ padding: '10px' }}>
                                        <select
                                            value={line.compte_id}
                                            onChange={(e) => handleLineChange(i, 'compte_id', e.target.value)}
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '1rem' }}
                                        >
                                            <option value="">-- Choisir un compte --</option>
                                            {accounts.map(a => (
                                                <option key={a.id_compte} value={a.id_compte}>
                                                    {a.numero_compte} - {a.libelle_compte}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="number"
                                            value={line.montant_debit}
                                            onChange={(e) => handleLineChange(i, 'montant_debit', e.target.value)}
                                            placeholder="0.00"
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #cbd5e1', textAlign: 'right', fontSize: '1.1rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <input
                                            type="number"
                                            value={line.montant_credit}
                                            onChange={(e) => handleLineChange(i, 'montant_credit', e.target.value)}
                                            placeholder="0.00"
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #cbd5e1', textAlign: 'right', fontSize: '1.1rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeLine(i)}
                                            disabled={lines.length <= 2}
                                            style={{
                                                padding: '12px 16px',
                                                background: lines.length <= 2 ? '#94a3b8' : '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: lines.length <= 2 ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button
                        onClick={addNewLine}
                        style={{
                            marginTop: '20px',
                            padding: '16px 32px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(16,185,129,0.3)'
                        }}
                    >
                        + Ajouter une ligne
                    </button>
                </div>
            )}


          {/* TOTAUX & ACTIONS */}
          <div style={{ 
                marginTop: '50px', 
                display: isMobile ? 'flex' : 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '25px' : '0'
            }}>
            <div style={{ fontSize: totalFontSize, fontWeight: 'bold' }}>
              <div style={{ marginBottom: '10px' }}>
                Total Débit : <span style={{ color: '#059669', fontFamily: 'monospace' }}>{formatNumber(totals.debit)}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                Total Crédit : <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>{formatNumber(totals.credit)}</span>
              </div>
              <div style={{
                padding: isMobile ? '12px 20px' : '15px 30px',
                background: totals.isBalanced ? '#d4edda' : '#fee2e2',
                color: totals.isBalanced ? '#166534' : '#991b1b',
                borderRadius: '16px',
                fontSize: isMobile ? '1.6rem' : '2rem',
                fontWeight: 900,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Solde : {totals.balance === '0.00' ? 'Équilibré' : totals.balance}
              </div>
            </div>

            <div style={{ 
                // Conteneur des boutons: s'étend sur mobile
                width: isMobile ? '100%' : 'auto', 
                display: isMobile ? 'flex' : 'block',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '15px' : '0' 
            }}>
              <button
                onClick={() => handleSave('Brouillon')}
                disabled={loading}
                style={{
                  padding: isMobile ? '14px 25px' : '18px 36px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: isMobile ? '1.1rem' : '1.4rem',
                  fontWeight: 800,
                  marginRight: isMobile ? '0' : '15px',
                  cursor: 'pointer',
                  boxShadow: '0 15px 40px rgba(99,102,241,0.4)'
                }}
              >
                {loading ? 'Enregistrement...' : 'Brouillon'}
              </button>

              <button
                onClick={() => handleSave('Validee')}
                disabled={loading || !totals.isBalanced}
                style={{
                  padding: isMobile ? '16px 25px' : '18px 36px',
                  background: totals.isBalanced ? '#059669' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: isMobile ? '1.4rem' : '1.6rem',
                  fontWeight: 900,
                  cursor: totals.isBalanced ? 'pointer' : 'not-allowed',
                  boxShadow: totals.isBalanced ? '0 15px 40px rgba(5,150,105,0.5)' : 'none'
                }}
              >
                {loading ? 'Validation...' : 'Valider l\'écriture'}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: '60px',
          padding: isMobile ? '30px' : '50px',
          background: '#f8fafc',
          borderRadius: '24px',
          textAlign: 'center',
          color: '#64748b',
            margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <p style={{ fontSize: '1.2rem' }}>
            Saisie intuitive • Contrôle automatique Débit = Crédit • Compatible SYSCOA Révisé • Historique complet
          </p>
        </div>
      </div>
    </div>
  );
}
