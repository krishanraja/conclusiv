/**
 * Color utility functions for exports
 * Handles color conversion and manipulation for PDF and PPTX exports
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Convert RGB to hex
 */
export const rgbToHex = (rgb: RGB): string => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Convert HSL string (e.g., "199 89% 48%") to hex
 */
export const hslToHex = (hsl: string): string => {
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

/**
 * Convert any color format to RGB
 * Supports hex (#RRGGBB), HSL (h s% l%), and RGB objects
 */
export const toRgb = (color: string | RGB): RGB => {
  if (typeof color === 'object') {
    return color;
  }

  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  if (color.includes('%')) {
    // HSL format
    return hexToRgb(hslToHex(color));
  }

  // Try to parse as hex without #
  if (/^[0-9A-Fa-f]{6}$/.test(color)) {
    return hexToRgb(`#${color}`);
  }

  // Default fallback
  return { r: 139, g: 92, b: 246 }; // Default purple
};

/**
 * Convert any color format to hex (for PPTX)
 */
export const toHex = (color: string | RGB): string => {
  if (typeof color === 'object') {
    return rgbToHex(color);
  }

  if (color.startsWith('#')) {
    return color;
  }

  if (color.includes('%')) {
    return hslToHex(color);
  }

  // Try to parse as hex without #
  if (/^[0-9A-Fa-f]{6}$/.test(color)) {
    return `#${color}`;
  }

  // Default fallback
  return '#8B5CF6';
};

/**
 * Get hex without # prefix (for PPTX)
 */
export const toHexNoHash = (color: string | RGB): string => {
  return toHex(color).replace('#', '');
};

/**
 * Lighten a color by a percentage
 */
export const lighten = (color: string | RGB, percent: number): RGB => {
  const rgb = toRgb(color);
  const factor = percent / 100;
  return {
    r: Math.min(255, rgb.r + (255 - rgb.r) * factor),
    g: Math.min(255, rgb.g + (255 - rgb.g) * factor),
    b: Math.min(255, rgb.b + (255 - rgb.b) * factor),
  };
};

/**
 * Darken a color by a percentage
 */
export const darken = (color: string | RGB, percent: number): RGB => {
  const rgb = toRgb(color);
  const factor = percent / 100;
  return {
    r: Math.max(0, rgb.r * (1 - factor)),
    g: Math.max(0, rgb.g * (1 - factor)),
    b: Math.max(0, rgb.b * (1 - factor)),
  };
};

/**
 * Get a lighter version for backgrounds
 */
export const getBackgroundColor = (color: string | RGB): RGB => {
  return lighten(color, 95);
};

/**
 * Get a darker version for text on light backgrounds
 */
export const getTextColor = (bgColor: string | RGB): RGB => {
  const rgb = toRgb(bgColor);
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? { r: 30, g: 30, b: 30 } : { r: 255, g: 255, b: 255 };
};

/**
 * Conclusiv brand colors
 * Based on the actual logo gradient: light yellowish-green to dark teal-green
 */
export const CONCLUSIV_COLORS = {
  primary: { r: 226, g: 255, b: 196 }, // Light yellowish-green: #E2FFC4 (HSL: 78 100% 83%)
  secondary: { r: 53, g: 116, b: 92 }, // Dark teal-green: #35745C (HSL: 157 35% 28%)
  accent: { r: 53, g: 116, b: 92 }, // Dark teal-green - matches shimmer-end
  background: { r: 5, g: 5, b: 5 }, // Deep dark: #050505 (HSL: 0 0% 2%)
  text: { r: 250, g: 250, b: 250 }, // Light: #FAFAFA (HSL: 0 0% 98%)
} as const;

/**
 * Get Conclusiv gradient colors
 */
export const getConclusivGradient = (): { start: RGB; end: RGB } => {
  return {
    start: CONCLUSIV_COLORS.primary,
    end: CONCLUSIV_COLORS.secondary,
  };
};

