// src/pages/StocksPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient.js';
import useWindowWidth from '../hooks/useWindowWidth.js'; // <-- NOUVEL IMPORT

// --- STYLES RÉUTILISABLES ---
const inputBaseStyle = {
    width: '100%',
    padding: '18px',
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    fontSize: '1.2rem',
    boxSizing: 'border-box', // Crucial pour le responsive
};

export default function StocksPage() {
    const { isMobile } = useWindowWidth(); // <-- Utilisation du Hook
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [articles, setArticles] = useState([]);

    const [newArticle, setNewArticle] = useState({
        reference: '',
        denomination: '',
        unite_stockage: 'unité'
    });

    const [mouvement, setMouvement] = useState({
        article_id: '',
        type_mouvement: 'entree',
        quantite: '',
        cout_unitaire: '',
        libelle: ''
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('articles')
          .select('*, quantite_en_stock, valeur_stock') 
          .order('denomination'); 

        if (error) {
            setError("Impossible de charger les articles. Code: " + error.code);
            console.error("Erreur de chargement Supabase (Détail) :", error.message);
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    };

    const handleChangeNewArticle = (e) => {
        setNewArticle({ ...newArticle, [e.target.name]: e.target.value });
    };

    const handleChangeMouvement = (e) => {
        setMouvement({ ...mouvement, [e.target.name]: e.target.value });
    };

    const handleCreateArticle = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const { error } = await supabase
          .from('articles')
          .insert([{ 
            ...newArticle, 
            quantite_en_stock: 0, 
            valeur_stock: 0 
          }]);

        if (error) {
            setError("Erreur création article : " + error.message);
        } else {
            setSuccess("Article créé avec succès !");
            setNewArticle({ reference: '', denomination: '', unite_stockage: 'unité' });
            fetchArticles();
            setTimeout(() => setSuccess(null), 4000);
        }
        setLoading(false);
    };

    const handleMouvement = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        const finalCoutUnitaire = mouvement.type_mouvement === 'sortie' 
          ? null 
          : parseFloat(mouvement.cout_unitaire);

        const { error } = await supabase.rpc('enregistrer_mouvement_stock', {
            p_article_id: parseInt(mouvement.article_id),
            p_type_mouvement: mouvement.type_mouvement,
            p_quantite: parseFloat(mouvement.quantite),
            p_cout_unitaire: finalCoutUnitaire, 
            p_libelle: mouvement.libelle.trim()
        });

        if (error) {
            setError("Erreur mouvement : " + error.message);
        } else {
            setSuccess(
                mouvement.type_mouvement === 'entree'
                    ? "Entrée enregistrée !"
                    : "Sortie enregistrée !"
            );
            setMouvement({
                article_id: '',
                type_mouvement: 'entree',
                quantite: '',
                cout_unitaire: '',
                libelle: ''
            });
            fetchArticles();
            setTimeout(() => setSuccess(null), 4000);
        }
        setLoading(false);
    };

    const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

    // --- STYLES CONDITIONNELS POUR RESPONSIVITÉ MAXIMALE ---
    const headerTitleSize = isMobile ? '2.5rem' : '5.8rem'; 
    const headerSubtitleSize = isMobile ? '1.2rem' : '2.2rem'; 
    const cardTitleSize = isMobile ? '1.8rem' : '2.6rem';
    const formPadding = isMobile ? '25px' : '50px';

    // --- RENDU ---
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: "'Poppins', sans-serif",
            // Pleine largeur sur mobile
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
                        Gestion des Stocks
                    </h1>
                    <p style={{ fontSize: headerSubtitleSize, margin: '15px 0 0', opacity: 0.95 }}>
                        Suivi en temps réel • Méthode CMP • Valorisation automatique
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div style={{
                        padding: '20px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '18px',
                        marginBottom: '30px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        margin: isMobile ? '0 15px' : '0'
                    }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{
                        padding: '20px',
                        background: '#d4edda',
                        color: '#155724',
                        borderRadius: '18px',
                        marginBottom: '30px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        margin: isMobile ? '0 15px' : '0'
                    }}>
                        {success}
                    </div>
                )}

                {/* LAYOUT PRINCIPAL (Responsif) */}
                <div style={{ 
                    display: isMobile ? 'block' : 'grid', // Empilement sur mobile
                    gridTemplateColumns: '1fr 2fr', 
                    gap: isMobile ? '30px' : '40px',
                    margin: isMobile ? '0 15px' : '0'
                }}>

                    {/* === COLONNE GAUCHE : FORMULAIRES === */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '30px' : '40px' }}>

                        {/* Créer un article */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '32px',
                            padding: formPadding,
                            boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <h2 style={{ fontSize: cardTitleSize, color: '#2c3e50', marginBottom: '30px' }}>
                                Nouvel Article
                            </h2>
                            <form onSubmit={handleCreateArticle}>
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                        Désignation *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        name="denomination"
                                        value={newArticle.denomination}
                                        onChange={handleChangeNewArticle}
                                        placeholder="Ex: Ciment Portland 42.5R - Sac 50kg"
                                        style={{ ...inputBaseStyle, backgroundColor: '#f8fafc', fontSize: isMobile ? '1rem' : '1.2rem', padding: isMobile ? '14px' : '18px' }}
                                    />
                                </div>

                                {/* Référence et Unité: s'empilent sur mobile, sinon 2 colonnes */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                    gap: '20px', 
                                    marginBottom: '30px' 
                                }}>
                                    <div>
                                        <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                            Référence
                                        </label>
                                        <input
                                            type="text"
                                            name="reference"
                                            value={newArticle.reference}
                                            onChange={handleChangeNewArticle}
                                            placeholder="Optionnel"
                                            style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.1rem', padding: isMobile ? '14px' : '18px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                            Unité de stockage
                                        </label>
                                        <input
                                            type="text"
                                            name="unite_stockage"
                                            value={newArticle.unite_stockage}
                                            onChange={handleChangeNewArticle}
                                            placeholder="sac, carton, kg..."
                                            style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.1rem', padding: isMobile ? '14px' : '18px' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: isMobile ? '15px' : '20px',
                                        background: '#6366f1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: isMobile ? '1.2rem' : '1.5rem',
                                        fontWeight: 800,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 15px 40px rgba(99,102,241,0.4)',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    {loading ? 'Création...' : 'Créer l\'Article'}
                                </button>
                            </form>
                        </div>

                        {/* Mouvement de stock */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '32px',
                            padding: formPadding,
                            boxShadow: '0 40px 90px rgba(0,0,0,0.15)'
                        }}>
                            <h2 style={{ fontSize: cardTitleSize, color: '#2c3e50', marginBottom: '30px' }}>
                                Mouvement de Stock
                            </h2>
                            <form onSubmit={handleMouvement}>
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                        Article *
                                    </label>
                                    <select
                                        required
                                        name="article_id"
                                        value={mouvement.article_id}
                                        onChange={handleChangeMouvement}
                                        style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.2rem', padding: isMobile ? '14px' : '18px' }}
                                    >
                                        <option value="">Choisir un article</option>
                                        {articles.map(a => (
                                            <option key={a.id_article} value={a.id_article}>
                                                {a.denomination} ({a.reference || 'sans réf'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Type et Quantité: s'empilent sur mobile, sinon 2 colonnes */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                    gap: '20px', 
                                    marginBottom: '25px' 
                                }}>
                                    <div>
                                        <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                            Type
                                        </label>
                                        <select
                                            name="type_mouvement"
                                            value={mouvement.type_mouvement}
                                            onChange={handleChangeMouvement}
                                            style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.2rem', padding: isMobile ? '14px' : '18px' }}
                                        >
                                            <option value="entree">Entrée (achat)</option>
                                            <option value="sortie">Sortie (vente/consommation)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                            Quantité *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            name="quantite"
                                            min="0.001"
                                            step="any"
                                            value={mouvement.quantite}
                                            onChange={handleChangeMouvement}
                                            style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.2rem', padding: isMobile ? '14px' : '18px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                        Libellé (facture, bon de livraison...) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        name="libelle"
                                        value={mouvement.libelle}
                                        onChange={handleChangeMouvement}
                                        placeholder="Ex: Facture n°2025-048 du 15/04/2025"
                                        style={{ ...inputBaseStyle, fontSize: isMobile ? '1rem' : '1.1rem', padding: isMobile ? '14px' : '18px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ fontWeight: 700, color: '#2c3e50', display: 'block', marginBottom: '12px', fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                                        Coût unitaire HT {mouvement.type_mouvement === 'entree' && '*'}
                                    </label>
                                    <input
                                        type="number"
                                        name="cout_unitaire"
                                        required={mouvement.type_mouvement === 'entree'}
                                        min="0"
                                        step="any"
                                        value={mouvement.cout_unitaire}
                                        onChange={handleChangeMouvement}
                                        disabled={mouvement.type_mouvement === 'sortie'}
                                        style={{
                                            ...inputBaseStyle,
                                            fontSize: isMobile ? '1.2rem' : '1.3rem',
                                            padding: isMobile ? '14px' : '18px',
                                            fontWeight: 'bold',
                                            backgroundColor: mouvement.type_mouvement === 'sortie' ? '#f0f4f8' : '#ffffff', 
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        loading || 
                                        !mouvement.article_id || 
                                        (mouvement.type_mouvement === 'entree' && !mouvement.cout_unitaire)
                                    }
                                    style={{
                                        width: '100%',
                                        padding: isMobile ? '18px' : '22px',
                                        background: mouvement.type_mouvement === 'entree' ? '#10b981' : '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: isMobile ? '1.4rem' : '1.6rem',
                                        fontWeight: 900,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.3s',
                                        boxShadow: mouvement.type_mouvement === 'entree'
                                            ? '0 15px 40px rgba(16,185,129,0.5)'
                                            : '0 15px 40px rgba(239,68,68,0.5)'
                                    }}
                                >
                                    {loading
                                        ? 'Enregistrement...'
                                        : mouvement.type_mouvement === 'entree'
                                            ? "Enregistrer l'Entrée"
                                            : "Enregistrer la Sortie"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* === ÉTAT DU STOCK (COLONNE DROITE / RESPONSIVE TABLEAU) === */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '32px',
                        padding: formPadding,
                        boxShadow: '0 40px 90px rgba(0,0,0,0.15)',
                        // Marge sur mobile pour séparer les formulaires des stocks
                        marginTop: isMobile ? '30px' : '0', 
                    }}>
                        <h2 style={{ fontSize: cardTitleSize, color: '#2c3e50', marginBottom: '40px' }}>
                            État Actuel du Stock
                        </h2>

                        {articles.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                                <div style={{ fontSize: '6rem', marginBottom: '20px' }}>📦</div>
                                <p style={{ fontSize: '1.6rem' }}>Aucun article en stock</p>
                                <p>Commencez par créer votre premier article</p>
                            </div>
                        ) : (
                            isMobile ? (
                                // --- 📱 VUE MOBILE / CARTES EMPILÉES ---
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {articles.map(a => (
                                        <div key={a.id_article} style={{
                                            background: '#f8fafc',
                                            padding: '15px',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                            borderLeft: `5px solid ${a.quantite_en_stock > 0 ? '#10b981' : '#dc2626'}`
                                        }}>
                                            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '5px', color: '#1e40af' }}>
                                                {a.denomination}
                                            </p>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontFamily: 'monospace' }}>
                                                Réf: {a.reference || '—'}
                                            </p>
                                            <hr style={{ margin: '10px 0', borderTop: '1px solid #e5e7eb' }}/>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ display: 'block', color: '#64748b', fontSize: '0.9rem' }}>Stock Disponible:</strong>
                                                    <span style={{ 
                                                        fontSize: '1.8rem', 
                                                        fontWeight: 900, 
                                                        color: a.quantite_en_stock > 0 ? '#059669' : '#dc2626' 
                                                    }}>
                                                        {formatNumber(a.quantite_en_stock)} {a.unite_stockage}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <strong style={{ display: 'block', color: '#64748b', fontSize: '0.9rem' }}>Valeur CMP:</strong>
                                                    <span style={{ 
                                                        fontSize: '1.2rem', 
                                                        fontWeight: 'bold', 
                                                        fontFamily: 'monospace', 
                                                        color: '#1e40af' 
                                                    }}>
                                                        {formatNumber(a.valeur_stock)} FCFA
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // --- 💻 VUE DESKTOP / TABLEAU CLASSIQUE ---
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9' }}>
                                                <th style={{ padding: '20px', textAlign: 'left', borderRadius: '16px 0 0 16px' }}>Réf.</th>
                                                <th style={{ padding: '20px', textAlign: 'left' }}>Désignation</th>
                                                <th style={{ padding: '20px', textAlign: 'center' }}>Stock</th>
                                                <th style={{ padding: '20px', textAlign: 'center' }}>Unité</th>
                                                <th style={{ padding: '20px', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>Valeur Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {articles.map(a => (
                                                <tr key={a.id_article} style={{ background: '#f8fafc', borderRadius: '16px' }}>
                                                    <td style={{ padding: '20px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                        {a.reference || '—'}
                                                    </td>
                                                    <td style={{ padding: '20px', fontWeight: 600, fontSize: '1.1rem' }}>
                                                        {a.denomination}
                                                    </td>
                                                    <td style={{
                                                        padding: '20px',
                                                        textAlign: 'center',
                                                        fontSize: '2rem',
                                                        fontWeight: 900,
                                                        color: a.quantite_en_stock > 0 ? '#059669' : '#dc2626'
                                                    }}>
                                                        {formatNumber(a.quantite_en_stock)}
                                                    </td>
                                                    <td style={{ padding: '20px', textAlign: 'center', fontWeight: 600 }}>
                                                        {a.unite_stockage}
                                                    </td>
                                                    <td style={{
                                                        padding: '20px',
                                                        textAlign: 'right',
                                                        fontFamily: 'monospace',
                                                        fontSize: '1.3rem',
                                                        fontWeight: 'bold',
                                                        color: '#1e40af'
                                                    }}>
                                                        {formatNumber(a.valeur_stock)} FCFA
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

                {/* FOOTER */}
                <div style={{
                    marginTop: '60px', // Marge réduite pour l'alignement mobile
                    padding: isMobile ? '30px' : '50px',
                    background: '#f8fafc',
                    borderRadius: '24px',
                    textAlign: 'center',
                    color: '#64748b',
                    margin: isMobile ? '0 15px' : '0 auto'
                }}>
                    <p style={{ fontSize: '1.2rem' }}>
                        Gestion des stocks en temps réel • Méthode du Coût Moyen Pondéré (CMP) • Compatible SYSCOA Révisé
                    </p>
                </div>
            </div>
        </div>
    );
}
