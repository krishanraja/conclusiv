/**
 * Font loading utilities for exports
 * Handles Google Fonts and fallback fonts for PDF and PPTX exports
 */

/**
 * Conclusiv default font
 */
export const CONCLUSIV_FONT = 'Plus Jakarta Sans';

/**
 * Standard fallback fonts
 */
export const FALLBACK_FONTS = {
  sans: ['Helvetica', 'Arial', 'sans-serif'],
  serif: ['Times', 'Times New Roman', 'serif'],
  mono: ['Courier', 'Courier New', 'monospace'],
};

/**
 * Extract font family name from Google Font string
 * Handles formats like "Roboto", "Open Sans", "Plus Jakarta Sans"
 */
export const extractFontFamily = (fontString: string | undefined): string => {
  if (!fontString) return CONCLUSIV_FONT;
  
  // Remove quotes if present
  const cleaned = fontString.replace(/['"]/g, '').trim();
  
  // Return the font name (first part if it's a font stack)
  return cleaned.split(',')[0].trim() || CONCLUSIV_FONT;
};

/**
 * Get font family for PDF (jsPDF supports limited fonts)
 * For PDF, we'll use system fonts that map to Google Fonts
 */
export const getPdfFont = (fontFamily: string | undefined): string => {
  const family = extractFontFamily(fontFamily);
  
  // jsPDF built-in fonts
  const builtInFonts = ['helvetica', 'times', 'courier'];
  const lowerFamily = family.toLowerCase();
  
  // Map common Google Fonts to jsPDF fonts
  const fontMap: Record<string, string> = {
    'helvetica': 'helvetica',
    'arial': 'helvetica',
    'times': 'times',
    'times new roman': 'times',
    'courier': 'courier',
    'courier new': 'courier',
  };
  
  // Check if it's a built-in font
  if (builtInFonts.includes(lowerFamily)) {
    return lowerFamily;
  }
  
  // Check font map
  if (fontMap[lowerFamily]) {
    return fontMap[lowerFamily];
  }
  
  // Default to helvetica (sans-serif)
  return 'helvetica';
};

/**
 * Get font family for PPTX (PptxGenJS supports more fonts)
 * For PPTX, we can use the actual font name
 */
export const getPptxFont = (fontFamily: string | undefined): string => {
  const family = extractFontFamily(fontFamily);
  
  // PptxGenJS supports more fonts, but we should still provide fallbacks
  // Common Google Fonts that work well in PowerPoint
  return family || 'Calibri'; // Calibri is a common PowerPoint default
};

/**
 * Get primary and secondary fonts from brand fonts
 */
export const getBrandFonts = (brandFonts?: {
  primary?: string;
  secondary?: string;
}): { primary: string; secondary: string } => {
  return {
    primary: extractFontFamily(brandFonts?.primary) || CONCLUSIV_FONT,
    secondary: extractFontFamily(brandFonts?.secondary) || CONCLUSIV_FONT,
  };
};

/**
 * Get font weight string for PDF
 */
export const getPdfFontWeight = (weight: 'normal' | 'bold' | 'light' = 'normal'): string => {
  return weight;
};

/**
 * Get font size for different text roles
 */
export const getFontSize = (role: 'title' | 'heading' | 'subheading' | 'body' | 'caption'): number => {
  const sizes = {
    title: 28,
    heading: 18,
    subheading: 14,
    body: 11,
    caption: 8,
  };
  return sizes[role];
};

/**
 * Get font size for PPTX
 */
export const getPptxFontSize = (role: 'title' | 'heading' | 'subheading' | 'body' | 'caption'): number => {
  const sizes = {
    title: 44,
    heading: 32,
    subheading: 18,
    body: 14,
    caption: 12,
  };
  return sizes[role];
};

