/**
 * Layout utility functions for exports
 * Provides reusable layout components and helpers for PDF and PPTX
 */

import type { RGB } from './colorUtils';

/**
 * Add a gradient background to PDF page
 * Note: jsPDF doesn't support gradients natively, so we'll use a solid color
 * or create a gradient effect using multiple rectangles
 */
export const addPdfGradientBackground = (
  doc: any,
  startColor: RGB,
  endColor: RGB,
  pageWidth: number,
  pageHeight: number
): void => {
  // Since jsPDF doesn't support gradients, we'll use the start color as a solid background
  // Or create a simple gradient effect with rectangles
  const steps = 10;
  const stepHeight = pageHeight / steps;
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
    
    doc.setFillColor(r, g, b);
    doc.rect(0, i * stepHeight, pageWidth, stepHeight, 'F');
  }
};

/**
 * Add a branded header to PDF page
 */
export const addPdfHeader = (
  doc: any,
  logoUrl: string | null,
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  pageWidth: number,
  margin: number,
  logoHeight: number = 15
): Promise<number> => {
  return new Promise((resolve) => {
    if (!logoUrl) {
      resolve(margin);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const logoWidth = (img.width / img.height) * logoHeight;
      let logoX = margin;
      let logoY = margin / 2;
      
      switch (logoPosition) {
        case 'top-right':
          logoX = pageWidth - margin - logoWidth;
          break;
        case 'bottom-left':
          logoY = doc.internal.pageSize.getHeight() - margin - logoHeight;
          break;
        case 'bottom-right':
          logoX = pageWidth - margin - logoWidth;
          logoY = doc.internal.pageSize.getHeight() - margin - logoHeight;
          break;
      }
      
      try {
        doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (err) {
        console.warn('Failed to add logo to PDF:', err);
      }
      
      resolve(logoPosition.includes('top') ? margin + logoHeight + 5 : margin);
    };
    
    img.onerror = () => {
      resolve(margin);
    };
    
    img.src = logoUrl;
  });
};

/**
 * Add a branded footer to PDF page
 */
export const addPdfFooter = (
  doc: any,
  pageNumber: number,
  totalPages: number,
  brandColor: RGB | null,
  watermark: boolean,
  pageWidth: number,
  pageHeight: number,
  margin: number
): void => {
  // Footer line
  if (brandColor) {
    doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  }
  
  // Page number
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const footerText = watermark
    ? `Page ${pageNumber} of ${totalPages} | Made with Conclusiv - conclusiv.app`
    : `Page ${pageNumber} of ${totalPages}`;
  
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
};

/**
 * Add watermark to PDF page
 */
export const addPdfWatermark = (
  doc: any,
  text: string,
  pageWidth: number,
  pageHeight: number,
  opacity: number = 0.1
): void => {
  doc.setFontSize(48);
  doc.setTextColor(200, 200, 200);
  doc.text(text, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
};

/**
 * Add a branded section divider to PDF
 */
export const addPdfSectionDivider = (
  doc: any,
  brandColor: RGB | null,
  pageWidth: number,
  yPosition: number,
  margin: number
): void => {
  if (brandColor) {
    doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
    doc.setLineWidth(0.5);
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
  }
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
};

/**
 * Add branded bullet point to PDF
 */
export const addPdfBullet = (
  doc: any,
  brandColor: RGB | null,
  x: number,
  y: number,
  size: number = 1.5
): void => {
  if (brandColor) {
    doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  } else {
    doc.setFillColor(100, 100, 100);
  }
  doc.circle(x, y, size, 'F');
};

/**
 * Create gradient background for PPTX slide
 */
export const createPptxGradient = (
  startColor: string,
  endColor: string
): { type: 'solid'; color: string } | { type: 'gradient'; stops: Array<{ position: number; color: string }> } => {
  // PptxGenJS gradient support
  return {
    type: 'gradient',
    stops: [
      { position: 0, color: startColor },
      { position: 100, color: endColor },
    ],
  } as any;
};

/**
 * Get logo position coordinates for PPTX
 */
export const getPptxLogoPosition = (
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  slideWidth: number = 10,
  slideHeight: number = 7.5
): { x: number; y: number } => {
  const margin = 0.5;
  const logoSize = 1;
  
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: slideWidth - margin - logoSize, y: margin };
    case 'bottom-left':
      return { x: margin, y: slideHeight - margin - logoSize * 0.5 };
    case 'bottom-right':
      return { x: slideWidth - margin - logoSize, y: slideHeight - margin - logoSize * 0.5 };
    default:
      return { x: margin, y: margin };
  }
};

/**
 * Get logo size for PPTX based on size preference
 */
export const getPptxLogoSize = (size: 'sm' | 'md' | 'lg'): { w: number; h: number } => {
  const sizes = {
    sm: { w: 1, h: 0.5 },
    md: { w: 1.5, h: 0.75 },
    lg: { w: 2, h: 1 },
  };
  return sizes[size] || sizes.md;
};

