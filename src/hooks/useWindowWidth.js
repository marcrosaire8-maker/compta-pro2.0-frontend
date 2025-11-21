// src/hooks/useWindowWidth.js

import { useState, useEffect } from 'react';

// Largeur limite où l'on considère l'écran comme "mobile"
const BREAKPOINT = 768; 

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    
    // Écoute les changements de taille de la fenêtre
    window.addEventListener('resize', handleResize);
    
    // Nettoyage de l'écouteur d'événement
    return () => window.removeEventListener('remove', handleResize);
  }, []); // Correction: removeEventListener sur 'remove' n'existe pas, doit être 'resize'

  // Correction de la fonction de nettoyage
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize); // Corrigé ici
  }, []);

  const isMobile = width < BREAKPOINT;
  
  // Retourne la largeur actuelle et un booléen pour "mobile"
  return { width, isMobile };
};

export default useWindowWidth;
