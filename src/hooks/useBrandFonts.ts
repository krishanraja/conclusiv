import { useEffect, useCallback } from "react";
import { useNarrativeStore } from "@/store/narrativeStore";

// Cache for loaded fonts (shared across all instances)
const loadedFonts = new Set<string>();

/**
 * Load a Google Font by dynamically injecting a link element
 */
export const loadGoogleFont = (fontFamily: string) => {
  if (!fontFamily || loadedFonts.has(fontFamily)) return;
  
  // Skip CSS variables and system fonts
  if (fontFamily.startsWith('var(') || 
      fontFamily === 'serif' || 
      fontFamily === 'sans-serif' || 
      fontFamily === 'monospace' ||
      fontFamily === 'System Font') {
    return;
  }
  
  const fontName = fontFamily.replace(/ /g, '+');
  const linkId = `brand-font-${fontName}`;
  
  // Check if link already exists in DOM
  if (document.getElementById(linkId)) {
    loadedFonts.add(fontFamily);
    return;
  }
  
  const link = document.createElement('link');
  link.id = linkId;
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
  
  console.log('[useBrandFonts] Loaded font:', fontFamily);
};

/**
 * Hook to ensure brand fonts are loaded for presentation
 * 
 * This hook reads the selected fonts from presentationStyle and ensures
 * they are loaded via Google Fonts API. Should be called in any component
 * that displays content using brand fonts.
 */
export const useBrandFonts = () => {
  const { presentationStyle, businessContext } = useNarrativeStore();
  
  // Load fonts from presentation style
  const primaryFont = presentationStyle?.primaryFont;
  const secondaryFont = presentationStyle?.secondaryFont;
  
  // Also check brand fonts from business context as fallback
  const brandPrimaryFont = businessContext?.brandFonts?.primary;
  const brandSecondaryFont = businessContext?.brandFonts?.secondary;
  
  useEffect(() => {
    // Load presentation style fonts (highest priority)
    if (primaryFont) {
      loadGoogleFont(primaryFont);
    }
    if (secondaryFont) {
      loadGoogleFont(secondaryFont);
    }
    
    // Load brand fonts as fallback
    if (brandPrimaryFont && brandPrimaryFont !== primaryFont) {
      loadGoogleFont(brandPrimaryFont);
    }
    if (brandSecondaryFont && brandSecondaryFont !== secondaryFont) {
      loadGoogleFont(brandSecondaryFont);
    }
  }, [primaryFont, secondaryFont, brandPrimaryFont, brandSecondaryFont]);
  
  // Return a function to manually load additional fonts if needed
  const loadFont = useCallback((fontFamily: string) => {
    loadGoogleFont(fontFamily);
  }, []);
  
  return {
    primaryFont: primaryFont || brandPrimaryFont,
    secondaryFont: secondaryFont || brandSecondaryFont,
    loadFont,
    isLoaded: (fontFamily: string) => loadedFonts.has(fontFamily),
  };
};
