import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import type { NarrativeSchema, BusinessContext, PresentationStyle } from '@/lib/types';

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

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Convert HSL string to hex
const hslToHex = (hsl: string): string => {
  // Parse HSL values
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return '#8B5CF6'; // Default purple

  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

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
  let yPosition = margin;

  // Get brand colors
  const primaryColor = options.brandColors?.primary
    ? hexToRgb(options.brandColors.primary.startsWith('#') 
        ? options.brandColors.primary 
        : hslToHex(options.brandColors.primary))
    : { r: 139, g: 92, b: 246 }; // Default purple

  const docTitle = title || businessContext?.companyName || 'Narrative';

  // Add logo if provided
  if (options.logoUrl && options.presentationStyle?.showLogo) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const logoHeight = 15;
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

  // Title with brand color
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text(docTitle, margin, yPosition);
  yPosition += 12;

  // Subtitle
  if (businessContext) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${businessContext.industry} | ${businessContext.brandVoice}`, margin, yPosition);
    yPosition += 8;
  }

  // Branded divider
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Reset text color
  doc.setTextColor(30, 30, 30);

  // Sections
  narrative.sections.forEach((section, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    // Section number with brand color
    doc.setFontSize(10);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(`Section ${index + 1}`, margin, yPosition);
    yPosition += 6;

    // Section title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(section.title, margin, yPosition);
    yPosition += 10;

    // Section content
    if (section.content) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(section.content, contentWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 6 + 5;
    }

    // Section items with branded bullets
    if (section.items && section.items.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      section.items.forEach((item) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = margin;
        }
        // Branded bullet
        doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.circle(margin + 2, yPosition - 1.5, 1.5, 'F');
        
        const bulletLines = doc.splitTextToSize(item, contentWidth - 10);
        doc.text(bulletLines, margin + 8, yPosition);
        yPosition += bulletLines.length * 5 + 3;
      });
    }

    yPosition += 8;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Watermark if needed
    if (options.watermark) {
      doc.setFontSize(48);
      doc.setTextColor(230, 230, 230);
      doc.text('Made with Conclusiv', pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45,
      });
    }
    
    // Branded footer line
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const footerText = options.watermark 
      ? `Page ${i} of ${pageCount} | Made with Conclusiv`
      : `Page ${i} of ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
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

  // Get brand colors
  const primaryHex = options.brandColors?.primary?.startsWith('#')
    ? options.brandColors.primary.slice(1)
    : '8B5CF6';
  
  // Use narrative color theme or custom colors
  const colors = {
    bg: narrative.colorTheme === 'cleanWhite' ? 'FFFFFF' : '0D0D0D',
    text: narrative.colorTheme === 'cleanWhite' ? '1A1A1A' : 'FFFFFF',
    accent: primaryHex,
  };

  // Title slide with logo
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.bg };

  if (options.logoUrl && options.presentationStyle?.showLogo) {
    const logoSize = options.presentationStyle.logoSize === 'lg' ? 1.2 
      : options.presentationStyle.logoSize === 'sm' ? 0.6 : 0.8;
    
    let logoX = 0.5;
    let logoY = 0.3;
    
    switch (options.presentationStyle.logoPosition) {
      case 'top-right':
        logoX = 8;
        break;
      case 'bottom-left':
        logoY = 4.5;
        break;
      case 'bottom-right':
        logoX = 8;
        logoY = 4.5;
        break;
    }

    titleSlide.addImage({
      path: options.logoUrl,
      x: logoX,
      y: logoY,
      h: logoSize,
      sizing: { type: 'contain', w: 2, h: logoSize },
    });
  }

  titleSlide.addText(docTitle, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.text,
    align: 'center',
  });

  if (businessContext) {
    titleSlide.addText(businessContext.industry, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.5,
      fontSize: 18,
      color: colors.accent,
      align: 'center',
    });

    titleSlide.addText(businessContext.brandVoice, {
      x: 0.5,
      y: 4.2,
      w: '90%',
      h: 0.5,
      fontSize: 14,
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
      slide.addImage({
        path: options.logoUrl,
        x: 8.5,
        y: 0.2,
        h: 0.5,
        sizing: { type: 'contain', w: 1, h: 0.5 },
      });
    }

    // Branded section number
    slide.addShape('rect', {
      x: 0.3,
      y: 0.3,
      w: 0.5,
      h: 0.5,
      fill: { color: colors.accent },
    });
    slide.addText(`${index + 1}`, {
      x: 0.3,
      y: 0.3,
      w: 0.5,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: colors.bg,
      align: 'center',
      valign: 'middle',
    });

    // Section title
    slide.addText(section.title, {
      x: 1,
      y: 0.8,
      w: '85%',
      h: 1,
      fontSize: 32,
      bold: true,
      color: colors.text,
    });

    // Content
    if (section.content) {
      slide.addText(section.content, {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 2,
        fontSize: 18,
        color: colors.text,
        valign: 'top',
      });
    }

    // Items with branded bullets
    if (section.items && section.items.length > 0) {
      const bulletText = section.items.map((item) => ({
        text: item,
        options: { 
          bullet: { type: 'number' as const, color: colors.accent },
          fontSize: 14, 
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

  // Thank you slide
  const endSlide = pptx.addSlide();
  endSlide.background = { color: colors.bg };

  if (options.logoUrl && options.presentationStyle?.showLogo) {
    endSlide.addImage({
      path: options.logoUrl,
      x: 4,
      y: 1.5,
      h: 1.5,
      sizing: { type: 'contain', w: 2, h: 1.5 },
    });
  }

  endSlide.addText('Thank You', {
    x: 0.5,
    y: 3,
    w: '90%',
    h: 1,
    fontSize: 44,
    bold: true,
    color: colors.text,
    align: 'center',
  });

  const footerText = options.watermark 
    ? 'Generated with Conclusiv' 
    : businessContext?.companyName || '';
  
  endSlide.addText(footerText, {
    x: 0.5,
    y: 4.2,
    w: '90%',
    h: 0.5,
    fontSize: 12,
    color: colors.accent,
    align: 'center',
  });

  const fileName = `${docTitle.replace(/\s+/g, '-').toLowerCase()}-branded`;
  pptx.writeFile({ fileName });
};