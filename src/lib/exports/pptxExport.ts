import PptxGenJS from 'pptxgenjs';
import type { NarrativeSchema, BusinessContext } from '@/lib/types';
import { criticalImages } from '@/lib/imagePreloader';
import { CONCLUSIV_COLORS, rgbToHex } from './colorUtils';
import { getPptxFont, getPptxFontSize, CONCLUSIV_FONT } from './fontLoader';
import { getPptxLogoPosition, getPptxLogoSize } from './layoutUtils';

export const exportToPPTX = async (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  title?: string
): Promise<void> => {
  const pptx = new PptxGenJS();
  
  const docTitle = title || businessContext?.companyName || 'Narrative';
  pptx.title = docTitle;
  pptx.author = 'Conclusiv';
  pptx.subject = 'Narrative Presentation';

  // Use Conclusiv brand colors
  const conclusivPrimaryHex = rgbToHex(CONCLUSIV_COLORS.primary).replace('#', '');
  const conclusivSecondaryHex = rgbToHex(CONCLUSIV_COLORS.secondary).replace('#', '');
  
  // Define colors based on narrative color theme with Conclusiv accents
  const colors = {
    darkCinematic: { bg: '0D0D0D', text: 'FFFFFF', accent: conclusivPrimaryHex },
    cleanWhite: { bg: 'FAFAFC', text: '1A1A1A', accent: conclusivPrimaryHex },
    warmNeutral: { bg: 'F5F5F4', text: '292524', accent: conclusivPrimaryHex },
    deepOcean: { bg: '0F172A', text: 'F1F5F9', accent: conclusivPrimaryHex },
  };

  const theme = colors[narrative.colorTheme] || colors.darkCinematic;

  // Title slide with Conclusiv branding
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: theme.bg };
  
  // Preload and add Conclusiv logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'Anonymous';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        try {
          const logoPos = getPptxLogoPosition('top-right');
          const logoSize = getPptxLogoSize('md');
          titleSlide.addImage({
            path: criticalImages.conclusivLogo,
            x: logoPos.x,
            y: logoPos.y,
            w: logoSize.w,
            h: logoSize.h,
            sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
          });
        } catch (err) {
          console.warn('Failed to add Conclusiv logo to title slide:', err);
        }
        resolve();
      };
      logoImg.onerror = () => {
        console.warn('Failed to load Conclusiv logo for title slide');
        resolve(); // Continue even if logo fails
      };
      logoImg.src = criticalImages.conclusivLogo;
    });
  } catch (err) {
    console.warn('Logo loading failed:', err);
  }
  
  // Title with Conclusiv styling
  titleSlide.addText(docTitle, {
    x: 0.5,
    y: 2,
    w: '90%',
    h: 1.5,
    fontSize: getPptxFontSize('title'),
    fontFace: getPptxFont(CONCLUSIV_FONT),
    bold: true,
    color: theme.text,
    align: 'center',
  });

  if (businessContext) {
    titleSlide.addText(`${businessContext.industry}`, {
      x: 0.5,
      y: 3.5,
      w: '90%',
      h: 0.5,
      fontSize: getPptxFontSize('subheading'),
      fontFace: getPptxFont(CONCLUSIV_FONT),
      color: theme.accent,
      align: 'center',
    });

    titleSlide.addText(businessContext.brandVoice, {
      x: 0.5,
      y: 4.2,
      w: '90%',
      h: 0.5,
      fontSize: getPptxFontSize('body'),
      fontFace: getPptxFont(CONCLUSIV_FONT),
      color: theme.text,
      align: 'center',
      italic: true,
    });
  }

  // Content slides for each section
  for (const [index, section] of narrative.sections.entries()) {
    const slide = pptx.addSlide();
    slide.background = { color: theme.bg };

    // Preload and add Conclusiv logo to each slide
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'Anonymous';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          try {
            const logoPos = getPptxLogoPosition('top-right');
            const logoSize = getPptxLogoSize('sm');
            slide.addImage({
              path: criticalImages.conclusivLogo,
              x: logoPos.x,
              y: logoPos.y,
              w: logoSize.w,
              h: logoSize.h,
              sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
            });
          } catch (err) {
            // Ignore logo errors
          }
          resolve();
        };
        logoImg.onerror = () => resolve(); // Continue even if logo fails
        logoImg.src = criticalImages.conclusivLogo;
      });
    } catch (err) {
      // Ignore logo errors
    }

    // Branded section number badge
    slide.addShape('rect', {
      x: 0.3,
      y: 0.3,
      w: 0.6,
      h: 0.6,
      fill: { color: theme.accent },
      line: { color: theme.accent, width: 0 },
    });
    slide.addText(`${index + 1}`, {
      x: 0.3,
      y: 0.3,
      w: 0.6,
      h: 0.6,
      fontSize: getPptxFontSize('body'),
      fontFace: getPptxFont(CONCLUSIV_FONT),
      bold: true,
      color: theme.bg === '0D0D0D' ? 'FFFFFF' : 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    // Section title
    slide.addText(section.title, {
      x: 1,
      y: 0.8,
      w: '85%',
      h: 1,
      fontSize: getPptxFontSize('heading'),
      fontFace: getPptxFont(CONCLUSIV_FONT),
      bold: true,
      color: theme.text,
    });

    // Section content
    if (section.content) {
      slide.addText(section.content, {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 2,
        fontSize: getPptxFontSize('subheading'),
        fontFace: getPptxFont(CONCLUSIV_FONT),
        color: theme.text,
        valign: 'top',
      });
    }

    // Section items as branded bullet points
    if (section.items && section.items.length > 0) {
      const bulletText = section.items.map((item) => ({
        text: item,
        options: { 
          bullet: { type: 'number' as const, color: theme.accent },
          fontSize: getPptxFontSize('body'),
          fontFace: getPptxFont(CONCLUSIV_FONT),
          color: theme.text,
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
  }

  // Thank you slide with Conclusiv branding
  const endSlide = pptx.addSlide();
  endSlide.background = { color: theme.bg };
  
  // Preload and add Conclusiv logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'Anonymous';
    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        try {
          const logoSize = getPptxLogoSize('lg');
          endSlide.addImage({
            path: criticalImages.conclusivLogo,
            x: 4,
            y: 1.5,
            w: logoSize.w,
            h: logoSize.h,
            sizing: { type: 'contain', w: logoSize.w, h: logoSize.h },
          });
        } catch (err) {
          // Ignore
        }
        resolve();
      };
      logoImg.onerror = () => resolve(); // Continue even if logo fails
      logoImg.src = criticalImages.conclusivLogo;
    });
  } catch (err) {
    // Ignore
  }
  
  endSlide.addText('Thank You', {
    x: 0.5,
    y: 3,
    w: '90%',
    h: 1,
    fontSize: getPptxFontSize('title'),
    fontFace: getPptxFont(CONCLUSIV_FONT),
    bold: true,
    color: theme.text,
    align: 'center',
  });

  endSlide.addText('Generated by Conclusiv', {
    x: 0.5,
    y: 4.2,
    w: '90%',
    h: 0.5,
    fontSize: getPptxFontSize('caption'),
    fontFace: getPptxFont(CONCLUSIV_FONT),
    color: theme.accent,
    align: 'center',
  });

  // Save the presentation
  const fileName = `${docTitle.replace(/\s+/g, '-').toLowerCase()}-presentation`;
  pptx.writeFile({ fileName });
};
