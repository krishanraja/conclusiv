import jsPDF from 'jspdf';
import type { NarrativeSchema, BusinessContext } from '@/lib/types';
import { criticalImages } from '@/lib/imagePreloader';
import { CONCLUSIV_COLORS, getConclusivGradient } from './colorUtils';
import { getPdfFont, getFontSize, CONCLUSIV_FONT } from './fontLoader';
import { addPdfHeader, addPdfFooter, addPdfWatermark, addPdfSectionDivider, addPdfBullet } from './layoutUtils';

interface ExportOptions {
  watermark?: boolean;
}

export const exportToPDF = async (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  title?: string,
  options: ExportOptions = {}
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // Add subtle gradient background (using Conclusiv colors)
  const gradient = getConclusivGradient();
  doc.setFillColor(250, 250, 252); // Light background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add Conclusiv logo to header
  let yPosition = margin;
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'Anonymous';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        const logoHeight = 12;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        try {
          doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin / 2, logoWidth, logoHeight);
        } catch (err) {
          console.warn('Failed to add Conclusiv logo:', err);
        }
        resolve();
      };
      logoImg.onerror = () => resolve();
      logoImg.src = criticalImages.conclusivLogo;
    });
    yPosition = margin + 5;
  } catch (err) {
    console.warn('Logo loading failed:', err);
  }

  // Title with Conclusiv brand color
  const docTitle = title || businessContext?.companyName || 'Narrative';
  doc.setFontSize(getFontSize('title'));
  doc.setFont(getPdfFont(CONCLUSIV_FONT), 'bold');
  doc.setTextColor(CONCLUSIV_COLORS.primary.r, CONCLUSIV_COLORS.primary.g, CONCLUSIV_COLORS.primary.b);
  doc.text(docTitle, margin, yPosition);
  yPosition += 18;

  // Subtitle with company context
  if (businessContext) {
    doc.setFontSize(getFontSize('subheading'));
    doc.setFont(getPdfFont(CONCLUSIV_FONT), 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${businessContext.industry} | ${businessContext.brandVoice}`, margin, yPosition);
    yPosition += 10;
  }

  // Branded divider with Conclusiv gradient effect
  doc.setDrawColor(CONCLUSIV_COLORS.primary.r, CONCLUSIV_COLORS.primary.g, CONCLUSIV_COLORS.primary.b);
  doc.setLineWidth(1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 18;

  // Reset text color
  doc.setTextColor(30, 30, 30);

  // Sections
  narrative.sections.forEach((section, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      // Add background and logo to new page
      doc.setFillColor(250, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'Anonymous';
        logoImg.onload = () => {
          const logoHeight = 12;
          const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
          try {
            doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin / 2, logoWidth, logoHeight);
          } catch (err) {
            // Ignore
          }
        };
        logoImg.src = criticalImages.conclusivLogo;
      } catch (err) {
        // Ignore
      }
      yPosition = margin + 5;
    }

    // Section number with Conclusiv brand color
    doc.setFontSize(getFontSize('caption'));
    doc.setFont(getPdfFont(CONCLUSIV_FONT), 'bold');
    doc.setTextColor(CONCLUSIV_COLORS.primary.r, CONCLUSIV_COLORS.primary.g, CONCLUSIV_COLORS.primary.b);
    doc.text(`Section ${index + 1}`, margin, yPosition);
    yPosition += 8;

    // Section title
    doc.setFontSize(getFontSize('heading'));
    doc.setFont(getPdfFont(CONCLUSIV_FONT), 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(section.title, margin, yPosition);
    yPosition += 12;

    // Section content
    if (section.content) {
      doc.setFontSize(getFontSize('body'));
      doc.setFont(getPdfFont(CONCLUSIV_FONT), 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(section.content, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 8;
    }

    // Section items with branded bullets
    if (section.items && section.items.length > 0) {
      doc.setFontSize(getFontSize('body'));
      doc.setFont(getPdfFont(CONCLUSIV_FONT), 'normal');
      doc.setTextColor(60, 60, 60);
      section.items.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage();
          doc.setFillColor(250, 250, 252);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = margin + 5;
        }
        // Branded bullet with Conclusiv color
        addPdfBullet(doc, CONCLUSIV_COLORS.primary, margin + 2, yPosition - 1.5, 2);
        const bulletLines = doc.splitTextToSize(item, contentWidth - 10);
        doc.text(bulletLines, margin + 8, yPosition);
        yPosition += bulletLines.length * 5 + 4;
      });
    }

    yPosition += 12;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Elegant watermark for free tier
    if (options.watermark) {
      doc.setFontSize(42);
      doc.setTextColor(240, 240, 242);
      doc.setFont(getPdfFont(CONCLUSIV_FONT), 'normal');
      doc.text(
        'Made with Conclusiv',
        pageWidth / 2,
        pageHeight / 2,
        { 
          align: 'center',
          angle: 45,
        }
      );
    }
    
    // Branded footer with Conclusiv colors
    addPdfFooter(
      doc,
      i,
      pageCount,
      CONCLUSIV_COLORS.primary,
      options.watermark || false,
      pageWidth,
      pageHeight,
      margin
    );
  }

  // Save the PDF
  const fileName = `${docTitle.replace(/\s+/g, '-').toLowerCase()}-narrative.pdf`;
  doc.save(fileName);
};
