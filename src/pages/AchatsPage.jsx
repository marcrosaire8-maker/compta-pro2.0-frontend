// src/pages/AchatsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import useWindowWidth from '../hooks/useWindowWidth.js'; // Assurez-vous que ce hook existe

// --- STYLES CENTRALISÉS ET DE BASE ---
const styles = {
  inputBase: {
    width: '100%', 
    padding: '18px', 
    borderRadius: '16px', 
    border: '2px solid #ddd', 
    fontSize: '1.1rem',
    boxSizing: 'border-box'
  },
};

export default function AchatsPage() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const { isMobile } = useWindowWidth(); // Détection de la largeur d'écran

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [fournisseurs, setFournisseurs] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [comptesCharge, setComptesCharge] = useState([]);

  const [header, setHeader] = useState({
    tiers_id: '',
    numero_facture: '',
    date_facture: new Date().toISOString().split('T')[0],
    date_echeance: '',
    exercice_id: ''
  });

  const [lines, setLines] = useState([
    { compte_id: '', description: '', montant_ht: 0, taux_tva: 18 }
  ]);

  // Formatage
  const formatNumber = (num) => {
    return parseFloat(num || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fournRes, exerRes, comptesRes] = await Promise.all([
          supabase.from('tiers').select('id_tiers, nom_tiers').eq('type_tiers', 'Fournisseur'),
          supabase.from('exercicescomptables').select('*').eq('statut', 'Ouvert').order('date_debut', { ascending: false }),
          supabase.from('plancomptableentreprise').select('id_compte, numero_compte, libelle_compte').like('numero_compte', '6%').order('numero_compte')
        ]);

        if (fournRes.error) throw fournRes.error;
        if (exerRes.error) throw exerRes.error;
        if (comptesRes.error) throw comptesRes.error;

        setFournisseurs(fournRes.data || []);
        setExercices(exerRes.data || []);
        setComptesCharge(comptesRes.data || []);

        if (exerRes.data?.length > 0) {
          setHeader(h => ({ ...h, exercice_id: exerRes.data[0].id_exercice }));
        }

        // Numéro automatique (ACH-YYYY-XXXX)
        const year = new Date().getFullYear();
        const { data: last } = await supabase
          .from('factures')
          .select('numero_facture')
          .ilike('numero_facture', `ACH-${year}-%`)
          .order('created_at', { ascending: false })
          .limit(1);

        const nextNum = last?.[0]?.numero_facture
          ? (parseInt(last[0].numero_facture.split('-')[2] || 0) + 1).toString().padStart(4, '0')
          : '0001';

        setHeader(h => ({ ...h, numero_facture: `ACH-${year}-${nextNum}` }));
      } catch (err) {
        setError("Erreur de chargement : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculs en temps réel
  const totals = useMemo(() => {
    let ht = 0, tva = 0;
    lines.forEach(l => {
      const ligneHT = parseFloat(l.montant_ht) || 0; 
      const ligneTVA = ligneHT * (parseFloat(l.taux_tva) || 0) / 100;
      ht += ligneHT;
      tva += ligneTVA;
    });
    return { ht: ht.toFixed(2), tva: tva.toFixed(2), ttc: (parseFloat(ht) + parseFloat(tva)).toFixed(2) };
  }, [lines]);

  // Gestion lignes
  const updateLine = (i, field, value) => {
    const newLines = [...lines];
    newLines[i][field] = field === 'description' ? value : value; 
    setLines(newLines);
  };
  
  const addLine = () => setLines([...lines, { compte_id: '', description: '', montant_ht: 0, taux_tva: 18 }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));
  
  // Sauvegarde
  const handleSave = async (statut) => {
    if (!header.tiers_id || !header.numero_facture || !header.exercice_id) {
      setError("Fournisseur, numéro et exercice obligatoires");
      return;
    }
    
    const validLines = lines.map(l => ({
        ...l,
        montant_ht: parseFloat(l.montant_ht) || 0,
        taux_tva: parseFloat(l.taux_tva) || 0,
    }));

    if (validLines.every(l => !l.description || !l.compte_id || l.montant_ht <= 0)) {
      setError("Au moins une ligne valide requise (compte + description + montant HT > 0)");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: facture, error: err1 } = await supabase
        .from('factures')
        .insert({
          tiers_id: header.tiers_id,
          numero_facture: header.numero_facture,
          date_facture: header.date_facture,
          date_echeance: header.date_echeance || null,
          exercice_id: header.exercice_id,
          montant_ht: totals.ht,
          montant_tva: totals.tva,
          montant_ttc: totals.ttc,
          statut: statut,
          type_document: 'ACHAT',
          entreprise_id: company?.id_entreprise
        })
        .select()
        .single();
        
      if (err1) throw err1;

      const lignesToInsert = validLines
        .filter(l => l.description && l.compte_id && l.montant_ht > 0)
        .map(l => ({
          facture_id: facture.id_facture,
          compte_id: l.compte_id,
          description: l.description,
          quantite: 1, 
          prix_unitaire_ht: l.montant_ht, 
          taux_tva: l.taux_tva,
          total_ht: l.montant_ht.toFixed(2)
        }));

      const { error: err2 } = await supabase.from('facturelignes').insert(lignesToInsert);
      if (err2) throw err2;

      setSuccess(`Facture d'achat ${header.numero_facture} ${statut === 'Validee' ? 'validée et comptabilisée' : 'en brouillon'} !`);
      setTimeout(() => navigate('/achats'), 2000);
    } catch (err) {
      setError("Échec : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" style={{ width: '5rem', height: '5rem' }}></div>
        <p style={{ marginTop: '30px', fontSize: '1.6rem' }}>Chargement du module achats...</p>
      </div>
    );
  }

  // --- STYLES CONDITIONNELS POUR RESPONSIVITÉ MAXIMALE ---
  const headerTitleSize = isMobile ? '1.8rem' : '4.5rem'; 
  const headerSubtitleSize = isMobile ? '0.9rem' : '1.8rem'; 
  const buttonPadding = isMobile ? '12px 20px' : '18px 50px';
  const buttonFontSize = isMobile ? '1rem' : '1.4rem';
  const totalsFontSize = isMobile ? '1.3rem' : '1.8rem'; 

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Poppins', sans-serif",
      // Pleine largeur sur mobile
      padding: isMobile ? '15px 0' : '40px 20px' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* En-tête premium */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: isMobile ? '15px 10px' : '60px 50px',
          borderRadius: '32px',
          textAlign: 'center',
          marginBottom: '30px',
          boxShadow: '0 40px 90px rgba(102, 126, 234, 0.5)'
        }}>
          <h1 style={{ fontSize: headerTitleSize, fontWeight: 900, margin: 0, letterSpacing: isMobile ? '-0.5px' : '-3px' }}>
            Nouvelle Facture d'Achat
          </h1>
          <p style={{ fontSize: headerSubtitleSize, margin: '10px 0 0', opacity: 0.95 }}>
            Saisie des charges • Comptabilisation automatique • SYSCOA Révisé
          </p>
        </div>
        
        {/* Messages d'alerte */}
        {error && (
          <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', borderRadius: '18px', marginBottom: '30px', margin: isMobile ? '0 15px' : '0 0' }}>
            <strong>Erreur :</strong> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '20px', background: '#d4edda', color: '#155724', borderRadius: '18px', marginBottom: '30px', margin: isMobile ? '0 15px' : '0 0' }}>
            {success}
          </div>
        )}

        {/* Bloc Blanc Principal (Conteneur du formulaire) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '28px',
          padding: isMobile ? '15px' : '50px', 
          boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
          marginBottom: '30px',
          // Correction de la marge latérale sur mobile
          margin: isMobile ? '0' : '0 auto' 
        }}>
          {/* En-tête facture (Inputs) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: isMobile ? '15px' : '30px',
            marginBottom: '40px'
          }}>
            {/* Fournisseur */}
            <div>
              <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px' }}>Fournisseur</label>
              <select
                value={header.tiers_id}
                onChange={(e) => setHeader({ ...header, tiers_id: e.target.value })}
                style={styles.inputBase}
              >
                <option value="">-- Choisir un fournisseur --</option>
                {fournisseurs.map(f => (
                  <option key={f.id_tiers} value={f.id_tiers}>{f.nom_tiers}</option>
                ))}
              </select>
            </div>
            
            {/* N° Facture Fournisseur */}
            <div>
              <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px' }}>N° Facture Fournisseur</label>
              <input
                type="text"
                value={header.numero_facture}
                readOnly
                style={{ ...styles.inputBase, background: '#f8f9fa', fontWeight: 700, fontSize: '1.2rem', border: '2px solid #ddd' }}
              />
            </div>

            {/* Exercice */}
            <div>
              <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px' }}>Exercice</label>
              <select
                value={header.exercice_id}
                onChange={(e) => setHeader({ ...header, exercice_id: e.target.value })}
                style={styles.inputBase}
              >
                <option value="">-- Choisir un exercice --</option>
                {exercices.map(e => (
                  <option key={e.id_exercice} value={e.id_exercice}>{e.libelle}</option>
                ))}
              </select>
            </div>
            
            {/* Date Facture */}
            <div>
              <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px' }}>Date Facture</label>
              <input
                type="date"
                value={header.date_facture}
                onChange={(e) => setHeader({ ...header, date_facture: e.target.value })}
                style={styles.inputBase}
              />
            </div>
            
            {/* Date Échéance */}
            <div>
              <label style={{ fontWeight: 700, color: '#333', display: 'block', marginBottom: '12px' }}>Date Échéance</label>
              <input
                type="date"
                value={header.date_echeance}
                onChange={(e) => setHeader({ ...header, date_echeance: e.target.value })}
                style={styles.inputBase}
              />
            </div>
          </div>
          
          {/* Section Lignes : Vue Conditionnelle Mobile/Desktop */}
          {isMobile ? (
            // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
            <div style={{ marginBottom: '30px' }}>
                <button
                    onClick={addLine}
                    style={{
                        marginTop: '10px',
                        padding: '10px 15px', 
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        width: '100%',
                        marginBottom: '15px'
                    }}
                >
                    <i className="bi bi-plus-circle me-2"></i> Ajouter une ligne de charge
                </button>
                
                {lines.map((line, i) => {
                    const totalLigne = parseFloat(line.montant_ht) || 0;
                    
                    return (
                        <div key={i} style={{ 
                            background: '#ffffff', 
                            padding: '10px', 
                            borderRadius: '16px', 
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)', 
                            marginBottom: '10px', 
                            borderLeft: '5px solid #fd7e14' 
                        }}>
                            {/* Bouton de suppression */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                                <button
                                    onClick={() => removeLine(i)}
                                    style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '0.9rem', cursor: 'pointer' }}
                                ><i className="bi bi-x"></i></button>
                            </div>

                            {/* Ligne : Compte de Charge */}
                            <div style={{ marginBottom: '10px' }}>
                                <strong style={{ display: 'block', color: '#6c757d', fontSize: '0.9rem' }}>Compte de Charge (6)</strong>
                                <select
                                    value={line.compte_id}
                                    onChange={(e) => updateLine(i, 'compte_id', e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                >
                                    <option value="">-- Choisir compte --</option>
                                    {comptesCharge.map(c => (
                                        <option key={c.id_compte} value={c.id_compte}>
                                            {c.numero_compte} - {c.libelle_compte}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ligne : Description */}
                            <div style={{ marginBottom: '10px' }}>
                                <strong style={{ display: 'block', color: '#6c757d', fontSize: '0.9rem' }}>Description</strong>
                                <input
                                    type="text"
                                    value={line.description}
                                    onChange={(e) => updateLine(i, 'description', e.target.value)}
                                    placeholder="Ex: Achat de fournitures de bureau"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Ligne : Montant HT & TVA (Flex pour alignement) */}
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                {/* Montant HT */}
                                <div style={{ flex: 2 }}>
                                    <strong style={{ display: 'block', color: '#6c757d', fontSize: '0.9rem' }}>Montant HT</strong>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={line.montant_ht}
                                        onChange={(e) => updateLine(i, 'montant_ht', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'right', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {/* TVA % */}
                                <div style={{ flex: 1 }}>
                                    <strong style={{ display: 'block', color: '#6c757d', fontSize: '0.9rem' }}>TVA %</strong>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={line.taux_tva}
                                        onChange={(e) => updateLine(i, 'taux_tva', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>
                            
                            {/* Ligne : Total HT (Affichage) */}
                            <div style={{ padding: '8px', background: '#e9ecef', borderRadius: '8px' }}>
                                <strong style={{ display: 'block', color: '#333', fontSize: '0.9rem' }}>Total HT :</strong>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                                    {formatNumber(totalLigne)} FCFA
                                </span>
                            </div>

                        </div>
                    );
                })}
            </div>

          ) : (
            // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
            <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
              <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                <thead>
                  <tr style={{ background: '#e9ecef', borderRadius: '16px' }}>
                    <th style={{ padding: '20px', textAlign: 'left', fontWeight: 700, borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', width: '250px' }}>Compte de Charge (6)</th>
                    <th style={{ padding: '20px', textAlign: 'left', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '20px', textAlign: 'right', width: '150px' }}>Montant HT</th>
                    <th style={{ padding: '20px', textAlign: 'center', width: '100px' }}>TVA %</th>
                    <th style={{ padding: '20px', textAlign: 'right', width: '150px' }}>Total HT</th>
                    <th style={{ padding: '20px', width: '60px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const totalLigne = parseFloat(line.montant_ht) || 0;
                    return (
                      <tr key={i} style={{ background: '#f8f9fa', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '20px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                            <select
                                value={line.compte_id}
                                onChange={(e) => updateLine(i, 'compte_id', e.target.value)}
                                style={{ width: '100%', padding: '14px', border: 'none', background: 'transparent', fontSize: '1.1rem' }}
                            >
                                <option value="">-- Choisir compte --</option>
                                {comptesCharge.map(c => (
                                    <option key={c.id_compte} value={c.id_compte}>
                                        {c.numero_compte} - {c.libelle_compte}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td style={{ padding: '20px' }}>
                          <input type="text" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Ex: Achat de marchandises" style={{ width: '100%', padding: '14px', border: 'none', background: 'transparent', fontSize: '1.1rem' }} />
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <input type="number" min="0" step="0.01" value={line.montant_ht} onChange={(e) => updateLine(i, 'montant_ht', e.target.value)} style={{ width: '140px', padding: '12px', borderRadius: '12px', border: '2px solid #ddd', textAlign: 'right', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '20px', textAlign: 'center' }}>
                          <input type="number" min="0" step="0.01" value={line.taux_tva} onChange={(e) => updateLine(i, 'taux_tva', e.target.value)} style={{ width: '100px', padding: '12px', borderRadius: '12px', border: '2px solid #ddd', textAlign: 'center', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.2rem' }}>
                          {formatNumber(totalLigne)} FCFA
                        </td>
                        <td style={{ padding: '20px', textAlign: 'center', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                          <button onClick={() => removeLine(i)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.4rem', cursor: 'pointer', transition: 'background 0.3s' }}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button
                onClick={addLine}
                style={{
                  marginTop: '20px', padding: '16px 32px', background: '#28a745', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(40,167,69,0.3)', transition: 'background 0.3s'
                }}
              >
                <i className="bi bi-plus-circle me-2"></i> Ajouter une ligne de charge
              </button>
            </div>
          )}


          {/* Totaux (Styles conditionnels) */}
          <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '20px',
              padding: isMobile ? '15px' : '30px 40px', 
              minWidth: isMobile ? '100%' : '400px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
              width: '100%', 
              maxWidth: '450px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
                <span>Total HT</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatNumber(totals.ht)} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
                <span>Total TVA</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{formatNumber(totals.tva)} FCFA</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px',
                background: '#333',
                color: 'white',
                borderRadius: '16px',
                marginTop: '15px',
                fontSize: totalsFontSize,
                fontWeight: 900
              }}>
                <span>TOTAL TTC</span>
                <span style={{ fontFamily: 'monospace' }}>{formatNumber(totals.ttc)} FCFA</span>
              </div>
            </div>
          </div>

          {/* Boutons action (Styles conditionnels) */}
          <div style={{ 
            marginTop: '30px', 
            textAlign: isMobile ? 'center' : 'right',
            display: isMobile ? 'flex' : 'block',
            flexDirection: 'column',
            gap: '10px' 
          }}>
            <button
              onClick={() => handleSave('Brouillon')}
              disabled={saving}
              style={{
                padding: buttonPadding,
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: buttonFontSize,
                fontWeight: 700,
                marginRight: isMobile ? '0' : '20px',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto', 
                marginBottom: isMobile ? '10px' : '0', 
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer Brouillon'}
            </button>
            <button
              onClick={() => handleSave('Validee')}
              disabled={saving}
              style={{
                padding: buttonPadding,
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: buttonFontSize,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 15px 40px rgba(40,167,69,0.4)',
                width: isMobile ? '100%' : 'auto', 
              }}
            >
              Valider & Comptabiliser
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '60px',
          padding: '40px',
          background: '#f8f9fa',
          borderRadius: '24px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '1.1rem' }}>
            Saisie conforme SYSCOA Révisé • Ventilation analytique • Écritures automatiques en classe 6 & 445
          </p>
        </div>
      </div>
    </div>
  );
}
