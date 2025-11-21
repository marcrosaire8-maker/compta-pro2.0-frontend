// src/pages/BalancePage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

export default function BalancePage() {
  const { isMobile } = useWindowWidth(); // <-- Détection mobile
    
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [exercices, setExercices] = useState([]);
  const [balanceData, setBalanceData] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);

  const [selectedExercice, setSelectedExercice] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Formatage
  const formatNumber = (num) => {
    if (!num || num === 0) return '0,00';
    return parseFloat(num).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // 1. Chargement des exercices
  useEffect(() => {
    const fetchExercices = async () => {
      const { data, error } = await supabase
        .from('exercicescomptables')
        .select('id_exercice, libelle, date_debut, date_fin')
        .order('date_debut', { ascending: false });

      if (error) {
        setError("Impossible de charger les exercices");
        console.error(error);
      } else {
        setExercices(data || []);
        if (data?.length > 0) {
          setSelectedExercice(data[0].id_exercice);
        }
      }
    };
    fetchExercices();
  }, []);

  // 2. Chargement de la balance
  useEffect(() => {
    if (!selectedExercice) return;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      setBalanceData([]);
      setLedgerData([]);
      setSelectedAccount(null);

      const { data, error } = await supabase
        .from('vue_balance')
        .select('*')
        .eq('id_exercice', selectedExercice)
        .order('numero_compte');

      if (error) {
        setError("Erreur lors du chargement de la balance");
        console.error(error);
      } else {
        setBalanceData(data || []);
      }
      setLoading(false);
    };

    fetchBalance();
  }, [selectedExercice]);

  // 3. Chargement du grand livre
  const handleAccountClick = async (compte) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedAccount({
      numero: compte.numero_compte,
      libelle: compte.libelle_compte,
      solde: compte.solde_debit > 0 ? compte.solde_debit : -compte.solde_credit
    });

    const { data, error } = await supabase
      .from('vue_grandlivre')
      .select('*')
      .eq('id_exercice', selectedExercice)
      .eq('id_compte', compte.id_compte)
      .order('date_ecriture', { ascending: true });

    if (error) {
      setError("Erreur lors du chargement du grand livre");
      console.error(error);
    } else {
      setLedgerData(data || []);
    }
    setLoading(false);
  };

  const currentExercice = exercices.find(e => e.id_exercice === selectedExercice);
  
  // --- STYLES CONDITIONNELS ---
  const headerTitleSize = isMobile ? '2.5rem' : '3.4rem';
  const headerSubtitleSize = isMobile ? '1rem' : '1.4rem';
  const containerPadding = isMobile ? '15px 0' : '32px';

  return (
    <div style={{
      fontFamily: "'Poppins', sans-serif",
      padding: containerPadding,
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '30px 20px' : '50px 40px',
        borderRadius: '24px',
        textAlign: 'center',
        marginBottom: '30px',
        boxShadow: '0 30px 70px rgba(102, 126, 234, 0.4)',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <h1 style={{ fontSize: headerTitleSize, fontWeight: 800, margin: 0, letterSpacing: isMobile ? '-1px' : '-1.5px' }}>
          Balance & Grand-Livre
        </h1>
        <p style={{ fontSize: headerSubtitleSize, margin: '16px 0 0', opacity: 0.95 }}>
          Analyse détaillée des comptes • Traçabilité totale • Conformité SYSCOA
        </p>
      </div>

      {/* Sélecteur d'exercice */}
      <div style={{
        background: '#ffffff',
        padding: isMobile ? '15px' : '25px',
        borderRadius: '20px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
        marginBottom: '35px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '15px',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? '10px' : '20px', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ width: isMobile ? '100%' : 'auto' }}>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#666', marginBottom: '8px' }}>
              Exercice comptable
            </div>
            <select
              value={selectedExercice}
              onChange={(e) => setSelectedExercice(e.target.value)}
              style={{
                padding: isMobile ? '10px 15px' : '14px 20px',
                borderRadius: '14px',
                border: '2px solid #0d6efd',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 600,
                width: isMobile ? '100%' : '300px',
                background: 'white'
              }}
            >
              {exercices.map(ex => (
                <option key={ex.id_exercice} value={ex.id_exercice}>
                  {ex.libelle} ({formatDate(ex.date_debut)} → {formatDate(ex.date_fin)})
                </option>
              ))}
            </select>
          </div>
          {currentExercice && (
            <div style={{
              background: '#e3f2fd',
              color: '#0d6efd',
              padding: '10px 15px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              {currentExercice.libelle}
            </div>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div style={{
          padding: '20px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '16px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          margin: isMobile ? '0 15px 25px' : '0 auto 25px'
        }}>
          ⚠️ Erreur : {error}
        </div>
      )}

      {/* Balance */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
        marginBottom: selectedAccount ? '40px' : '0',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <div style={{
          background: '#0d6efd',
          color: 'white',
          padding: isMobile ? '15px' : '25px 30px',
          fontSize: isMobile ? '1.2rem' : '1.6rem',
          fontWeight: 700
        }}>
          Balance des comptes
        </div>

        {loading && balanceData.length === 0 ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" style={{ width: '4rem', height: '4rem' }}></div>
          </div>
        ) : balanceData.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#888' }}>
            <p style={{ fontSize: '1.4rem' }}>Aucune donnée pour cet exercice</p>
          </div>
        ) : (
          isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES (Balance) ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px' }}>
                    {balanceData.map((c) => {
                        const hasMovements = c.total_debit > 0 || c.total_credit > 0;
                        const soldeAbs = Math.abs(c.solde_debit > 0 ? c.solde_debit : c.solde_credit);

                        return (
                            <div
                                key={c.id_compte}
                                onClick={() => hasMovements && handleAccountClick(c)}
                                style={{
                                    background: '#f8f9fa',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                    borderLeft: `5px solid ${c.solde_debit > 0 ? '#28a745' : c.solde_credit > 0 ? '#dc3545' : '#6c757d'}`,
                                    cursor: hasMovements ? 'pointer' : 'default',
                                    opacity: hasMovements ? 1 : 0.7,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{c.numero_compte}</p>
                                        <p style={{ margin: '3px 0 0', fontSize: '0.9rem', color: '#666' }}>{c.libelle_compte}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Solde Final</strong>
                                        <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', color: c.solde_debit > 0 ? '#28a745' : '#dc3545' }}>
                                            {formatNumber(soldeAbs)}
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#666' }}>
                                            {c.solde_debit > 0 ? 'Débiteur' : c.solde_credit > 0 ? 'Créditeur' : 'Zéro'}
                                        </span>
                                    </div>
                                </div>
                                <hr style={{ margin: '10px 0' }}/>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#777' }}>
                                    <div>Débit Mouvements: <span style={{ fontWeight: 600 }}>{formatNumber(c.total_debit)}</span></div>
                                    <div>Crédit Mouvements: <span style={{ fontWeight: 600 }}>{formatNumber(c.total_credit)}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '18px', textAlign: 'left', fontWeight: 600 }}>Compte</th>
                    <th style={{ padding: '18px', textAlign: 'left', fontWeight: 600 }}>Libellé</th>
                    <th style={{ padding: '18px', textAlign: 'right', fontWeight: 600 }}>Total Débit</th>
                    <th style={{ padding: '18px', textAlign: 'right', fontWeight: 600 }}>Total Crédit</th>
                    <th style={{ padding: '18px', textAlign: 'right', fontWeight: 600, color: '#28a745' }}>Solde Débit</th>
                    <th style={{ padding: '18px', textAlign: 'right', fontWeight: 600, color: '#dc3545' }}>Solde Crédit</th>
                </tr>
                </thead>
                <tbody>
                  {balanceData.map((c, i) => {
                    const hasMovements = c.total_debit > 0 || c.total_credit > 0;
                    return (
                      <tr
                        key={c.id_compte}
                        style={{
                          background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                          cursor: hasMovements ? 'pointer' : 'default',
                          transition: 'all 0.3s',
                          opacity: hasMovements ? 1 : 0.6
                        }}
                        onClick={() => hasMovements && handleAccountClick(c)}
                        onMouseEnter={(e) => hasMovements && (e.currentTarget.style.background = '#e3f2fd')}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : '#ffffff'}
                      >
                        <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 700 }}>
                          {c.numero_compte}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        {c.libelle_compte}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(c.total_debit)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(c.total_credit)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#28a745' }}>
                        {c.solde_debit > 0 ? formatNumber(c.solde_debit) : '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#dc3545' }}>
                        {c.solde_credit > 0 ? formatNumber(c.solde_credit) : '—'}
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

      {/* Grand-Livre */}
      {selectedAccount && (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
          marginTop: isMobile ? '30px' : '40px',
          margin: isMobile ? '0 15px' : '0 auto'
        }}>
          <div style={{
            background: selectedAccount.solde >= 0 ? '#28a745' : '#dc3545',
            color: 'white',
            padding: isMobile ? '20px' : '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '10px' : '0'
          }}>
            <div style={{textAlign: isMobile ? 'center' : 'left'}}>
              <h2 style={{ margin: '0', fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 700 }}>
                Grand-Livre : {selectedAccount.numero} - {selectedAccount.libelle}
              </h2>
            </div>
            <div style={{ textAlign: 'right', marginTop: isMobile ? '10px' : '0' }}>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', opacity: 0.9 }}>Solde final</div>
              <div style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 800 }}>
                {selectedAccount.solde >= 0 ? '+' : ''}{formatNumber(Math.abs(selectedAccount.solde))} FCFA
              </div>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', opacity: 0.9 }}>
                {selectedAccount.solde >= 0 ? 'Débiteur' : 'Créditeur'}
              </div>
            </div>
          </div>

          {ledgerData.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#888' }}>
              <p style={{ fontSize: '1.2rem' }}>Aucune écriture pour ce compte</p>
            </div>
          ) : (
            isMobile ? (
                // --- 📱 VUE MOBILE / CARTES EMPILÉES (Grand Livre) ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px' }}>
                    {ledgerData.map((l, i) => (
                        <div key={i} style={{
                            background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                            padding: '15px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            borderLeft: '4px solid #0d6efd'
                        }}>
                            <p style={{ margin: '0 0 5px 0', fontWeight: 700, fontSize: '1rem', color: '#333' }}>
                                {formatDate(l.date_ecriture)} ({l.reference_piece || '—'})
                            </p>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>
                                {l.libelle_operation}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                <div>
                                    <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Débit:</strong>
                                    <span style={{ fontWeight: 700, color: '#28a745', fontFamily: 'monospace' }}>
                                        {l.montant_debit > 0 ? formatNumber(l.montant_debit) : '—'}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>Crédit:</strong>
                                    <span style={{ fontWeight: 700, color: '#dc3545', fontFamily: 'monospace' }}>
                                        {l.montant_credit > 0 ? formatNumber(l.montant_credit) : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '18px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '18px', textAlign: 'left' }}>Libellé</th>
                    <th style={{ padding: '18px', textAlign: 'left' }}>Pièce</th>
                    <th style={{ padding: '18px', textAlign: 'right', color: '#28a745' }}>Débit</th>
                    <th style={{ padding: '18px', textAlign: 'right', color: '#dc3545' }}>Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((l, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        {formatDate(l.date_ecriture)}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        {l.libelle_operation}
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', color: '#666' }}>
                        {l.reference_piece || '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#28a745' }}>
                        {l.montant_debit > 0 ? formatNumber(l.montant_debit) : '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#dc3545' }}>
                        {l.montant_credit > 0 ? formatNumber(l.montant_credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )
          )}
        </div>
      )}

      {/* Pied de page */}
      <div style={{
        marginTop: '40px',
        padding: isMobile ? '20px' : '40px',
        background: '#f8f9fa',
        borderRadius: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '1rem',
        margin: isMobile ? '0 15px' : '0 auto'
      }}>
        <p>
          Données issues des vues SQL • Mise à jour en temps réel • Conformité SYSCOA Révisé
        </p>
      </div>
    </div>
  );
}
