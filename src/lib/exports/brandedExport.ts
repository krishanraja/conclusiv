import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import type { NarrativeSchema, BusinessContext, PresentationStyle } from '@/lib/types';
import { toRgb, toHex, toHexNoHash, getBackgroundColor, getTextColor, type RGB } from './colorUtils';
import { getPdfFont, getPptxFont, getFontSize, getPptxFontSize, getBrandFonts, CONCLUSIV_FONT } from './fontLoader';
import { addPdfHeader, addPdfFooter, addPdfWatermark, addPdfSectionDivider, addPdfBullet } from './layoutUtils';

interface BrandedExportOptions {
  watermark?: boolean;
  logoUrl?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  brandFonts?: {
    primary: string;
    secondary: string;
  };
  presentationStyle?: PresentationStyle;
}

export const exportBrandedPDF = async (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  title?: string,
  options: BrandedExportOptions = {}
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  // Get brand colors - use all available colors
  const primaryColor = options.brandColors?.primary 
    ? toRgb(options.brandColors.primary)
    : { r: 139, g: 92, b: 246 };
  const secondaryColor = options.brandColors?.secondary
    ? toRgb(options.brandColors.secondary)
    : primaryColor;
  const accentColor = options.brandColors?.accent
    ? toRgb(options.brandColors.accent)
    : primaryColor;
  
  // Get brand fonts
  const fonts = getBrandFonts(options.brandFonts);
  const primaryFont = getPdfFont(fonts.primary);
  const secondaryFont = getPdfFont(fonts.secondary);
  
  // Get background color from presentation style or use light background
  const bgColor = options.presentationStyle?.backgroundColor
    ? getBackgroundColor(toRgb(options.presentationStyle.backgroundColor))
    : { r: 250, g: 250, b: 252 };
  
  // Add subtle background
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  const docTitle = title || businessContext?.companyName || 'Narrative';
  let yPosition = margin;

  // Add logo if provided
  if (options.logoUrl && options.presentationStyle?.showLogo) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const logoSize = options.presentationStyle?.logoSize || 'md';
          const logoHeight = logoSize === 'lg' ? 18 : logoSize === 'sm' ? 12 : 15;
          const logoWidth = (img.width / img.height) * logoHeight;
          
          let logoX = margin;
          let logoY = margin / 2;
          
          switch (options.presentationStyle?.logoPosition) {
            case 'top-right':
              logoX = pageWidth - margin - logoWidth;
              break;
            case 'bottom-left':
              logoY = pageHeight - margin - logoHeight;
              break;
            case 'bottom-right':
              logoX = pageWidth - margin - logoWidth;
              logoY = pageHeight - margin - logoHeight;
              break;
          }
          
          doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
          resolve();
        };
        img.onerror = reject;
        img.src = options.logoUrl!;
      });
      yPosition = margin + 20;
    } catch (err) {
      console.warn('Failed to load logo for PDF:', err);
    }
  }

  // Title with primary brand color and brand font
  doc.setFontSize(getFontSize('title'));
  doc.setFont(primaryFont, 'bold');
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(docTitle, margin, yPosition);
  yPosition += 18;

  // Subtitle with secondary color
  if (businessContext) {
    doc.setFontSize(getFontSize('subheading'));
    doc.setFont(secondaryFont, 'normal');
    doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    doc.text(`${businessContext.industry} | ${businessContext.brandVoice}`, margin, yPosition);
    yPosition += 10;
  }

  // Branded divider with primary color
  addPdfSectionDivider(doc, primaryColor, pageWidth, yPosition, margin);
  yPosition += 18;

  // Reset text color based on background
  const textColor = getTextColor(bgColor);
  doc.setTextColor(textColor.r, textColor.g, textColor.b);

  // Sections
  narrative.sections.forEach((section, index) => {
    if (yPosition > 250) {
      doc.addPage();
      // Add background and logo to new page
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Re-add logo if enabled
      if (options.logoUrl && options.presentationStyle?.showLogo) {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const logoSize = options.presentationStyle?.logoSize || 'md';
            const logoHeight = logoSize === 'lg' ? 18 : logoSize === 'sm' ? 12 : 15;
            const logoWidth = (img.width / img.height) * logoHeight;
            let logoX = margin;
            let logoY = margin / 2;
            
            switch (options.presentationStyle?.logoPosition) {
              case 'top-right':
                logoX = pageWidth - margin - logoWidth;
                break;
              case 'bottom-left':
                logoY = pageHeight - margin - logoHeight;
                break;
              case 'bottom-right':
                logoX = pageWidth - margin - logoWidth;
                logoY = pageHeight - margin - logoHeight;
                break;
            }
            
            try {
              doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight);
            } catch (err) {
              // Ignore
            }
          };
          img.src = options.logoUrl;
        } catch (err) {
          // Ignore
        }
      }
      yPosition = margin + 5;
    }

    // Section number with accent color
    doc.setFontSize(getFontSize('caption'));
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
    doc.text(`Section ${index + 1}`, margin, yPosition);
    yPosition += 8;

    // Section title with primary color
    doc.setFontSize(getFontSize('heading'));
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(section.title, margin, yPosition);
    yPosition += 12;

    // Section content
    if (section.content) {
      doc.setFontSize(getFontSize('body'));
      doc.setFont(secondaryFont, 'normal');
      doc.setTextColor(textColor.r * 0.8, textColor.g * 0.8, textColor.b * 0.8);
      const lines = doc.splitTextToSize(section.content, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 8;
    }

    // Section items with branded bullets using accent color
    if (section.items && section.items.length > 0) {
      doc.setFontSize(getFontSize('body'));
      doc.setFont(secondaryFont, 'normal');
      doc.setTextColor(textColor.r * 0.8, textColor.g * 0.8, textColor.b * 0.8);
      section.items.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage();
          doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = margin + 5;
        }
        // Branded bullet with accent color
        addPdfBullet(doc, accentColor, margin + 2, yPosition - 1.5, 2);
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
    
    // Elegant watermark if needed
    if (options.watermark) {
      addPdfWatermark(doc, 'Made with Conclusiv', pageWidth, pageHeight, 0.08);
    }
    
    // Branded footer with primary color
    addPdfFooter(
      doc,
      i,
      pageCount,
      primaryColor,
      options.watermark || false,
      pageWidth,
      pageHeight,
      margin
    );
  }

  const fileName = `${docTitle.replace(/\s+/g, '-').toLowerCase()}-branded.pdf`;
  doc.save(fileName);
};

export const exportBrandedPPTX = async (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  title?: string,
  options: BrandedExportOptions = {}
): Promise<void> => {
  const pptx = new PptxGenJS();
  
  const docTitle = title || businessContext?.companyName || 'Narrative';
  pptx.title = docTitle;
  pptx.author = businessContext?.companyName || 'Conclusiv';
  pptx.subject = 'Branded Narrative Presentation';

  // Get all brand colors
  const primaryHex = toHexNoHash(options.brandColors?.primary || '#8B5CF6');
  const secondaryHex = toHexNoHash(options.brandColors?.secondary || primaryHex);
  const accentHex = toHexNoHash(options.brandColors?.accent || primaryHex);
  
  // Get brand fonts
  const fonts = getBrandFonts(options.brandFonts);
  const primaryFont = getPptxFont(fonts.primary);
  const secondaryFont = getPptxFont(fonts.secondary);
  
  // Determine background based on presentation style or narrative theme
  const bgColor = options.presentationStyle?.backgroundColor
    ? toHexNoHash(options.presentationStyle.backgroundColor)
    : narrative.colorTheme === 'cleanWhite' ? 'FAFAFC' : '0D0D0D';
  
  const textColor = options.presentationStyle?.textColor
    ? toHexNoHash(options.presentationStyle.textColor)
    : narrative.colorTheme === 'cleanWhite' ? '1A1A1A' : 'FFFFFF';
  
  // Use narrative color theme or custom colors
  const colors = {
    bg: bgColor,
    text: textColor,
    primary: primaryHex,
    secondary: secondaryHex,
    accent: accentHex,
  };

  // Title slide with gradient background and logo
  const titleSlide = pptx.addSlide();
  
  // Add gradient background using brand colors
  try {
    titleSlide.background = {
      path: 'https://via.placeholder.com/1920x1080.png',
      transparency: 100,
    } as any;
    // Use gradient effect with brand colors
    titleSlide.background = { 
      color: colors.bg,
      // Add subtle gradient effect using shapes
    } as any;
  } catch (err) {
    titleSlide.background = { color: colors.bg };
  }

  if (options.logoUrl && options.presentationStyle?.showLogo) {
    const logoPos = getPptxLogoPosition(
      options.presentationStyle.logoPosition || 'top-right'
    );
    const logoSize = getPptxLogoSize(options.presentationStyle.logoSize || 'md');
    
    titleSlide.addImage({
      path: options.logoUrl,
      x: logoPos.x,
      y: logoPos.y,
      w: logoSize.w,
      h: logoSize.h,
      sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
    });
  }

  // Title with brand font and primary color
  titleSlide.addText(docTitle, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: getPptxFontSize('title'),
    fontFace: primaryFont,
    bold: true,
    color: colors.primary,
    align: 'center',
  });

  if (businessContext) {
    // Industry with secondary color
    titleSlide.addText(businessContext.industry, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.5,
      fontSize: getPptxFontSize('subheading'),
      fontFace: secondaryFont,
      color: colors.secondary,
      align: 'center',
    });

    // Brand voice with text color
    titleSlide.addText(businessContext.brandVoice, {
      x: 0.5,
      y: 4.2,
      w: '90%',
      h: 0.5,
      fontSize: getPptxFontSize('body'),
      fontFace: secondaryFont,
      color: colors.text,
      align: 'center',
      italic: true,
    });
  }

  // Content slides
  narrative.sections.forEach((section, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: colors.bg };

    // Add logo to each slide if enabled
    if (options.logoUrl && options.presentationStyle?.showLogo) {
      const logoPos = getPptxLogoPosition(
        options.presentationStyle.logoPosition || 'top-right'
      );
      const logoSize = getPptxLogoSize('sm');
      slide.addImage({
        path: options.logoUrl,
        x: logoPos.x,
        y: logoPos.y,
        w: logoSize.w,
        h: logoSize.h,
        sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
      });
    }

    // Branded section number badge with accent color
    slide.addShape('rect', {
      x: 0.3,
      y: 0.3,
      w: 0.6,
      h: 0.6,
      fill: { color: colors.accent },
      line: { color: colors.accent, width: 0 },
    });
    slide.addText(`${index + 1}`, {
      x: 0.3,
      y: 0.3,
      w: 0.6,
      h: 0.6,
      fontSize: getPptxFontSize('body'),
      fontFace: primaryFont,
      bold: true,
      color: colors.bg === '0D0D0D' || colors.bg === '0F172A' ? 'FFFFFF' : 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    // Section title with primary color and brand font
    slide.addText(section.title, {
      x: 1,
      y: 0.8,
      w: '85%',
      h: 1,
      fontSize: getPptxFontSize('heading'),
      fontFace: primaryFont,
      bold: true,
      color: colors.primary,
    });

    // Content with secondary font
    if (section.content) {
      slide.addText(section.content, {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 2,
        fontSize: getPptxFontSize('subheading'),
        fontFace: secondaryFont,
        color: colors.text,
        valign: 'top',
      });
    }

    // Items with branded bullets using accent color
    if (section.items && section.items.length > 0) {
      const bulletText = section.items.map((item) => ({
        text: item,
        options: { 
          bullet: { type: 'number' as const, color: colors.accent },
          fontSize: getPptxFontSize('body'),
          fontFace: secondaryFont,
          color: colors.text,
        },
      }));

      slide.addText(bulletText, {
        x: 0.5,
        y: section.content ? 4 : 2,
        w: '90%',
        h: 2.5,
        valign: 'top',
      });
    }
  });

  // Thank you slide with brand styling
  const endSlide = pptx.addSlide();
  endSlide.background = { color: colors.bg };

  if (options.logoUrl && options.presentationStyle?.showLogo) {
    const logoSize = getPptxLogoSize('lg');
    endSlide.addImage({
      path: options.logoUrl,
      x: 4,
      y: 1.5,
      w: logoSize.w,
      h: logoSize.h,
      sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
    });
  }

  endSlide.addText('Thank You', {
    x: 0.5,
    y: 3,
    w: '90%',
    h: 1,
    fontSize: getPptxFontSize('title'),
    fontFace: primaryFont,
    bold: true,
    color: colors.primary,
    align: 'center',
  });

  const footerText = options.watermark 
    ? 'Generated with Conclusiv' 
    : businessContext?.companyName || '';
  
  if (footerText) {
    endSlide.addText(footerText, {
      x: 0.5,
      y: 4.2,
      w: '90%',
      h: 0.5,
      fontSize: getPptxFontSize('caption'),
      fontFace: secondaryFont,
      color: colors.secondary,
      align: 'center',
    });
  }

  const fileName = `${docTitle.replace(/\s+/g, '-').toLowerCase()}-branded`;
  pptx.writeFile({ fileName });
};