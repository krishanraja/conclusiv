# Export Quality Improvements: Technical Implementation Guide

## Overview

This document provides detailed technical guidance for implementing CEO-ready quality improvements to PDF and PowerPoint exports.

---

## 📐 Typography Improvements

### Current Issues
- Line spacing too tight (currently ~1.0x)
- Inconsistent heading sizes
- Poor visual hierarchy
- Default font rendering

### Recommended Changes

#### 1. Font Size System
```typescript
// Enhanced font sizing with better hierarchy
export const PDF_FONT_SIZES = {
  // Document title
  title: 32,

  // Section headers
  h1: 24,
  h2: 20,
  h3: 16,

  // Body text
  body: 12,
  bodyLarge: 14,

  // Secondary text
  subheading: 14,
  caption: 10,
  footnote: 9,
} as const;

export const PPTX_FONT_SIZES = {
  title: 44,      // Title slide
  h1: 32,         // Section headers
  h2: 24,         // Slide titles
  body: 18,       // Bullet points
  caption: 14,    // Footnotes
} as const;
```

#### 2. Line Height System
```typescript
export const LINE_HEIGHTS = {
  tight: 1.2,    // Headings
  normal: 1.5,   // Body text
  loose: 1.8,    // Important callouts
} as const;

// Implementation in PDF
doc.setFontSize(PDF_FONT_SIZES.body);
const lineHeight = PDF_FONT_SIZES.body * LINE_HEIGHTS.normal; // 12 * 1.5 = 18pt
```

#### 3. Font Weight System
```typescript
export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Usage
doc.setFont(primaryFont, 'bold');     // Headers
doc.setFont(secondaryFont, 'normal'); // Body
```

#### 4. Professional Font Pairings
```typescript
export const FONT_PAIRINGS = {
  // Classic professional
  classic: {
    primary: 'Georgia',     // Serif for headers
    secondary: 'Arial',     // Sans for body
  },

  // Modern tech
  modern: {
    primary: 'Helvetica',   // Sans for headers
    secondary: 'Helvetica', // Sans for body
  },

  // Executive formal
  executive: {
    primary: 'Times',       // Serif for headers
    secondary: 'Arial',     // Sans for body
  },

  // Startup casual
  startup: {
    primary: 'Arial',       // Sans for headers
    secondary: 'Arial',     // Sans for body
  },
} as const;

// Apply based on business context
const fonts = businessContext?.industry?.includes('finance')
  ? FONT_PAIRINGS.executive
  : FONT_PAIRINGS.modern;
```

---

## 🎨 Layout Improvements

### Cover Page Enhancement

#### Current Implementation
```typescript
// Simple title + subtitle
titleSlide.addText(docTitle, { x: 0.5, y: 2, ... });
```

#### Enhanced Implementation
```typescript
// Create visually impactful cover page
export const createCoverPage = (
  doc: jsPDF | PptxGenJS,
  title: string,
  businessContext: BusinessContext,
  options: ExportOptions
) => {
  if (doc instanceof jsPDF) {
    // PDF Cover Page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Full-bleed brand color background
    const bgColor = options.brandColors?.primary
      ? toRgb(options.brandColors.primary)
      : CONCLUSIV_COLORS.primary;

    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // White overlay for text readability
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageHeight * 0.4, pageWidth, pageHeight * 0.3, 'F');

    // Logo in top corner (white version)
    if (options.logoUrl) {
      // Add logo with white background
      const logoSize = 20;
      doc.addImage(options.logoUrl, 'PNG', pageWidth - 30, 10, logoSize, logoSize);
    }

    // Large title in center
    doc.setFontSize(48);
    doc.setFont(primaryFont, 'bold');
    doc.setTextColor(bgColor.r, bgColor.g, bgColor.b);
    doc.text(title, pageWidth / 2, pageHeight / 2, { align: 'center' });

    // Subtitle below
    doc.setFontSize(18);
    doc.setFont(secondaryFont, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(businessContext.industry, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });

    // Date footer
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(today, pageWidth / 2, pageHeight - 20, { align: 'center' });

  } else {
    // PPTX Cover Page
    const slide = doc.addSlide();

    // Gradient background
    slide.background = {
      fill: options.brandColors?.primary || CONCLUSIV_COLORS.primary,
    };

    // Large centered title
    slide.addText(title, {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1.5,
      fontSize: 54,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });

    // Subtitle with glass morphism effect
    slide.addShape('rect', {
      x: 2,
      y: 4,
      w: 6,
      h: 0.8,
      fill: { color: 'FFFFFF', transparency: 20 },
    });

    slide.addText(businessContext.industry, {
      x: 2,
      y: 4,
      w: 6,
      h: 0.8,
      fontSize: 20,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
  }
};
```

### Table of Contents (PDF)

```typescript
export const addTableOfContents = (
  doc: jsPDF,
  sections: Array<{ title: string; page: number }>,
  startY: number
) => {
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = startY;

  // TOC Header
  doc.setFontSize(24);
  doc.setFont(primaryFont, 'bold');
  doc.setTextColor(CONCLUSIV_COLORS.primary);
  doc.text('Table of Contents', margin, yPosition);
  yPosition += 20;

  // TOC Divider
  doc.setDrawColor(CONCLUSIV_COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // TOC Entries
  sections.forEach((section, index) => {
    // Section number circle
    doc.setFillColor(CONCLUSIV_COLORS.primary);
    doc.circle(margin + 5, yPosition - 2, 4, 'F');

    // Section number text
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${index + 1}`, margin + 5, yPosition + 1, { align: 'center' });

    // Section title
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont(secondaryFont, 'normal');
    doc.text(section.title, margin + 15, yPosition);

    // Page number with dots
    const dots = '.'.repeat(50);
    doc.setTextColor(150, 150, 150);
    doc.text(dots, margin + 15, yPosition);

    doc.setTextColor(CONCLUSIV_COLORS.primary);
    doc.setFont(secondaryFont, 'bold');
    doc.text(`${section.page}`, pageWidth - margin - 10, yPosition);

    yPosition += 12;
  });
};
```

### Headers & Footers

```typescript
export const addPageHeader = (
  doc: jsPDF,
  title: string,
  logoUrl?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Subtle top border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, 15, pageWidth - margin, 15);

  // Document title in header
  doc.setFontSize(9);
  doc.setFont(secondaryFont, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(title, margin, 12);

  // Logo in top right
  if (logoUrl) {
    // Small logo (10mm height)
    doc.addImage(logoUrl, 'PNG', pageWidth - margin - 15, 8, 15, 10);
  }
};

export const addPageFooter = (
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  options: ExportOptions
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Subtle bottom border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  // Page number
  doc.setFontSize(9);
  doc.setFont(secondaryFont, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Company name or Conclusiv branding
  const footerText = options.watermark
    ? 'Made with Conclusiv'
    : options.businessContext?.companyName || '';

  doc.text(footerText, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Date
  const today = new Date().toLocaleDateString();
  doc.text(today, margin, pageHeight - 10);
};
```

---

## 📊 PowerPoint Enhancements

### Master Slide Templates

```typescript
export const SLIDE_LAYOUTS = {
  // Title slide
  TITLE: {
    name: 'Title',
    background: true,
    elements: ['title', 'subtitle', 'logo', 'date'],
  },

  // Section divider
  SECTION_DIVIDER: {
    name: 'Section Divider',
    background: true,
    elements: ['sectionNumber', 'sectionTitle', 'icon'],
  },

  // Content slide with bullets
  CONTENT: {
    name: 'Content',
    background: false,
    elements: ['logo', 'slideNumber', 'title', 'bullets'],
  },

  // Two column layout
  TWO_COLUMN: {
    name: 'Two Column',
    background: false,
    elements: ['logo', 'slideNumber', 'title', 'leftContent', 'rightContent'],
  },

  // Image with caption
  IMAGE_CAPTION: {
    name: 'Image with Caption',
    background: false,
    elements: ['logo', 'slideNumber', 'title', 'image', 'caption'],
  },

  // Quote/callout
  QUOTE: {
    name: 'Quote',
    background: true,
    elements: ['quote', 'author', 'logo'],
  },

  // Thank you / contact
  CLOSING: {
    name: 'Closing',
    background: true,
    elements: ['thankYou', 'contactInfo', 'logo'],
  },
} as const;

// Implementation
export const createSectionDividerSlide = (
  pptx: PptxGenJS,
  sectionNumber: number,
  sectionTitle: string,
  colors: ColorScheme,
  icon?: string
) => {
  const slide = pptx.addSlide();

  // Full-bleed gradient background
  slide.background = {
    fill: colors.primary,
  };

  // Large section number (watermark style)
  slide.addText(`${sectionNumber}`, {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fontSize: 200,
    bold: true,
    color: 'FFFFFF',
    transparency: 10,
    align: 'center',
    valign: 'middle',
  });

  // Section title overlay
  slide.addShape('rect', {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.5,
    fill: { color: 'FFFFFF', transparency: 15 },
  });

  slide.addText(sectionTitle, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // Icon if provided
  if (icon) {
    slide.addText(icon, {
      x: 4.5,
      y: 4.5,
      w: 1,
      h: 1,
      fontSize: 72,
      align: 'center',
    });
  }

  return slide;
};

export const createTwoColumnSlide = (
  pptx: PptxGenJS,
  title: string,
  leftContent: string[],
  rightContent: string[],
  colors: ColorScheme,
  options: ExportOptions
) => {
  const slide = pptx.addSlide();
  slide.background = { color: colors.bg };

  // Logo
  if (options.logoUrl) {
    const logoPos = getPptxLogoPosition('top-right');
    const logoSize = getPptxLogoSize('sm');
    slide.addImage({
      path: options.logoUrl,
      x: logoPos.x,
      y: logoPos.y,
      w: logoSize.w,
      h: logoSize.h,
    });
  }

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.5,
    w: '90%',
    h: 0.75,
    fontSize: 32,
    bold: true,
    color: colors.primary,
  });

  // Divider line
  slide.addShape('line', {
    x: 0.5,
    y: 1.35,
    w: 9,
    h: 0,
    line: { color: colors.primary, width: 2 },
  });

  // Left column
  const leftBullets = leftContent.map(item => ({
    text: item,
    options: {
      bullet: { type: 'bullet' as const, color: colors.accent },
      fontSize: 16,
      color: colors.text,
    },
  }));

  slide.addText(leftBullets, {
    x: 0.5,
    y: 1.75,
    w: 4.25,
    h: 3.5,
    valign: 'top',
  });

  // Vertical separator
  slide.addShape('line', {
    x: 5,
    y: 1.75,
    w: 0,
    h: 3.5,
    line: { color: colors.accent, width: 1, dashType: 'dash' },
  });

  // Right column
  const rightBullets = rightContent.map(item => ({
    text: item,
    options: {
      bullet: { type: 'bullet' as const, color: colors.accent },
      fontSize: 16,
      color: colors.text,
    },
  }));

  slide.addText(rightBullets, {
    x: 5.25,
    y: 1.75,
    w: 4.25,
    h: 3.5,
    valign: 'top',
  });

  return slide;
};
```

### Speaker Notes

```typescript
export const addSpeakerNotes = (
  slide: PptxGenJS.Slide,
  section: NarrativeSection
) => {
  // Generate speaker notes from section content
  let notes = '';

  // Main talking point from content
  if (section.content) {
    notes += `Main Point:\n${section.content}\n\n`;
  }

  // Key items to cover
  if (section.items && section.items.length > 0) {
    notes += 'Key Items to Cover:\n';
    section.items.forEach((item, index) => {
      notes += `${index + 1}. ${item}\n`;
    });
    notes += '\n';
  }

  // Estimated timing
  const wordCount = (section.content?.split(' ').length || 0) +
                    (section.items?.join(' ').split(' ').length || 0);
  const estimatedMinutes = Math.ceil(wordCount / 150); // 150 words per minute
  notes += `Estimated Time: ${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''}\n`;

  // Add notes to slide
  slide.addNotes(notes);
};
```

### Professional Animations

```typescript
export const SLIDE_TRANSITIONS = {
  // Subtle professional transitions
  FADE: { type: 'fade', duration: 0.5 },
  WIPE: { type: 'wipe', duration: 0.6, direction: 'fromLeft' },
  PUSH: { type: 'push', duration: 0.7, direction: 'fromRight' },
  COVER: { type: 'cover', duration: 0.5, direction: 'fromBottom' },
  NONE: { type: 'none', duration: 0 },
} as const;

export const addSlideTransition = (
  slide: PptxGenJS.Slide,
  transitionType: keyof typeof SLIDE_TRANSITIONS = 'FADE'
) => {
  const transition = SLIDE_TRANSITIONS[transitionType];

  // PptxGenJS API for slide transitions
  slide.transition = {
    type: transition.type,
    duration: transition.duration,
  };
};

// Apply to all content slides
export const applyConsistentTransitions = (
  pptx: PptxGenJS,
  slides: PptxGenJS.Slide[]
) => {
  slides.forEach((slide, index) => {
    if (index === 0) {
      // No transition on title slide
      addSlideTransition(slide, 'NONE');
    } else if (index === slides.length - 1) {
      // Subtle fade on closing slide
      addSlideTransition(slide, 'FADE');
    } else {
      // Consistent wipe for content
      addSlideTransition(slide, 'WIPE');
    }
  });
};
```

---

## 🎯 Bullet Point Styling

### Current Implementation (Basic)
```typescript
// Simple circle bullets
doc.circle(x, y, 2, 'F');
```

### Enhanced Implementation

```typescript
export const BULLET_STYLES = {
  // Solid circle (default)
  CIRCLE: (doc: jsPDF, color: RGB, x: number, y: number, size: number = 2) => {
    doc.setFillColor(color.r, color.g, color.b);
    doc.circle(x, y, size, 'F');
  },

  // Square bullet
  SQUARE: (doc: jsPDF, color: RGB, x: number, y: number, size: number = 3) => {
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(x - size/2, y - size/2, size, size, 'F');
  },

  // Triangle bullet
  TRIANGLE: (doc: jsPDF, color: RGB, x: number, y: number, size: number = 3) => {
    doc.setFillColor(color.r, color.g, color.b);
    doc.triangle(
      x, y - size,           // Top point
      x - size, y + size,    // Bottom left
      x + size, y + size,    // Bottom right
      'F'
    );
  },

  // Arrow bullet
  ARROW: (doc: jsPDF, color: RGB, x: number, y: number, size: number = 3) => {
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(1.5);
    doc.line(x, y, x + size, y);           // Horizontal line
    doc.line(x + size, y, x + size - 2, y - 2); // Arrow head top
    doc.line(x + size, y, x + size - 2, y + 2); // Arrow head bottom
  },

  // Checkmark bullet
  CHECK: (doc: jsPDF, color: RGB, x: number, y: number, size: number = 3) => {
    doc.setDrawColor(color.r, color.g, color.b);
    doc.setLineWidth(1.5);
    doc.line(x - size, y, x - size/2, y + size);     // Left part
    doc.line(x - size/2, y + size, x + size, y - size); // Right part
  },
} as const;

// Usage
const bulletStyle = businessContext?.industry?.includes('tech')
  ? BULLET_STYLES.ARROW
  : BULLET_STYLES.CIRCLE;

bulletStyle(doc, accentColor, margin + 2, yPosition - 1.5, 2);
```

---

## 🖼️ Image Handling

### Image Optimization

```typescript
export const optimizeImage = async (
  imageUrl: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to optimized data URL
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(optimizedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Usage in export
if (section.image) {
  const optimizedImage = await optimizeImage(section.image);
  doc.addImage(optimizedImage, 'JPEG', x, y, width, height);
}
```

---

## 📦 Metadata & Accessibility

### PDF Metadata

```typescript
export const setPDFMetadata = (
  doc: jsPDF,
  title: string,
  author: string,
  businessContext: BusinessContext | null
) => {
  doc.setProperties({
    title: title,
    subject: businessContext?.industry || 'Business Narrative',
    author: author,
    keywords: [
      businessContext?.industry,
      'narrative',
      'presentation',
      'strategy',
    ].filter(Boolean).join(', '),
    creator: 'Conclusiv',
    creationDate: new Date(),
  });
};
```

### PPTX Metadata

```typescript
export const setPPTXMetadata = (
  pptx: PptxGenJS,
  title: string,
  author: string,
  businessContext: BusinessContext | null
) => {
  pptx.title = title;
  pptx.subject = businessContext?.industry || 'Business Narrative';
  pptx.author = author;
  pptx.company = businessContext?.companyName || 'Conclusiv';
  pptx.revision = '1';
  pptx.creationDate = new Date().toISOString();
};
```

---

## 🚦 Color Contrast Validation

### WCAG AA Compliance

```typescript
export const getContrastRatio = (color1: RGB, color2: RGB): number => {
  const getLuminance = (rgb: RGB) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const ensureReadableContrast = (
  textColor: RGB,
  backgroundColor: RGB,
  minRatio: number = 4.5 // WCAG AA for normal text
): RGB => {
  const contrast = getContrastRatio(textColor, backgroundColor);

  if (contrast >= minRatio) {
    return textColor;
  }

  // Adjust text color to meet contrast ratio
  // Try making it darker first
  let adjusted = { ...textColor };
  for (let i = 0; i < 10; i++) {
    adjusted = {
      r: Math.max(0, adjusted.r - 25),
      g: Math.max(0, adjusted.g - 25),
      b: Math.max(0, adjusted.b - 25),
    };

    if (getContrastRatio(adjusted, backgroundColor) >= minRatio) {
      return adjusted;
    }
  }

  // If darkening didn't work, try lightening
  adjusted = { ...textColor };
  for (let i = 0; i < 10; i++) {
    adjusted = {
      r: Math.min(255, adjusted.r + 25),
      g: Math.min(255, adjusted.g + 25),
      b: Math.min(255, adjusted.b + 25),
    };

    if (getContrastRatio(adjusted, backgroundColor) >= minRatio) {
      return adjusted;
    }
  }

  // Fallback to black or white
  return getContrastRatio({ r: 0, g: 0, b: 0 }, backgroundColor) >
         getContrastRatio({ r: 255, g: 255, b: 255 }, backgroundColor)
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 };
};

// Usage
const safeTextColor = ensureReadableContrast(textColor, backgroundColor);
doc.setTextColor(safeTextColor.r, safeTextColor.g, safeTextColor.b);
```

---

## ⚡ Performance Optimization

### Export Progress Tracking

```typescript
export interface ExportProgress {
  stage: 'initializing' | 'rendering' | 'generating' | 'complete';
  progress: number; // 0-100
  message: string;
}

export const exportWithProgress = async (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  options: ExportOptions,
  onProgress: (progress: ExportProgress) => void
): Promise<void> => {
  // Stage 1: Initialize (0-10%)
  onProgress({ stage: 'initializing', progress: 0, message: 'Initializing export...' });
  const doc = new jsPDF();
  await new Promise(resolve => setTimeout(resolve, 100));
  onProgress({ stage: 'initializing', progress: 10, message: 'Loading assets...' });

  // Stage 2: Render content (10-70%)
  onProgress({ stage: 'rendering', progress: 10, message: 'Rendering cover page...' });
  await createCoverPage(doc, narrative, businessContext, options);

  const sectionProgress = 60 / narrative.sections.length;
  for (let i = 0; i < narrative.sections.length; i++) {
    onProgress({
      stage: 'rendering',
      progress: 10 + (i * sectionProgress),
      message: `Rendering section ${i + 1} of ${narrative.sections.length}...`,
    });
    await renderSection(doc, narrative.sections[i], options);
  }

  // Stage 3: Generate file (70-100%)
  onProgress({ stage: 'generating', progress: 70, message: 'Generating PDF...' });
  await addMetadata(doc, narrative, businessContext);
  onProgress({ stage: 'generating', progress: 90, message: 'Finalizing...' });
  doc.save(`${narrative.title}.pdf`);

  onProgress({ stage: 'complete', progress: 100, message: 'Export complete!' });
};
```

### Background Export Processing

```typescript
export const exportInBackground = (
  narrative: NarrativeSchema,
  businessContext: BusinessContext | null,
  options: ExportOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Use Web Worker for heavy processing
    const worker = new Worker('/export-worker.js');

    worker.postMessage({
      narrative,
      businessContext,
      options,
    });

    worker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.blob);
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
  });
};
```

---

## ✅ Quality Checklist

Before releasing export improvements, verify:

### PDF Exports
- [ ] Line spacing is 1.5x for body text
- [ ] Headings have clear size hierarchy (32/24/20/16pt)
- [ ] Logo appears on all pages (if enabled)
- [ ] Page numbers show "Page X of Y"
- [ ] Table of contents with clickable links
- [ ] Metadata is set (title, author, keywords)
- [ ] Watermark is subtle but visible (free tier)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] File size under 5MB for typical 10-page document
- [ ] No content is cut off at page boundaries
- [ ] Bullet points are visually distinct
- [ ] Footer shows company name/date consistently

### PowerPoint Exports
- [ ] Master slide templates defined
- [ ] Multiple slide layouts available
- [ ] Speaker notes added to all content slides
- [ ] Slide transitions are subtle and professional
- [ ] Logo appears consistently (same position/size)
- [ ] Slide numbers on all non-title slides
- [ ] Brand colors applied consistently
- [ ] Bullet points use accent color
- [ ] Section divider slides between major sections
- [ ] Thank you slide at end with contact info
- [ ] File compatible with PowerPoint 2016+
- [ ] File compatible with Google Slides
- [ ] File size under 10MB for typical 15-slide deck

### User Experience
- [ ] Export completes in under 5 seconds
- [ ] Progress indicator shows during export
- [ ] Clear error messages if export fails
- [ ] Download filename is descriptive
- [ ] Free users see upgrade prompt after PDF export
- [ ] Pro users don't see watermark
- [ ] Logo loads correctly from URL
- [ ] Brand colors apply correctly
- [ ] Preview before export option available
- [ ] Cancel export option available

---

## 📚 References

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [PptxGenJS Documentation](https://gitbrent.github.io/PptxGenJS/)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [PDF/A Standard](https://www.pdfa.org/)
- [PowerPoint OOXML Spec](https://learn.microsoft.com/en-us/office/open-xml/structure-of-a-presentationml-document)

---

**Last Updated:** 2026-01-21
**Implemented:** Core export functionality
**In Progress:** Typography & layout improvements
**Next:** Master slide templates & speaker notes
