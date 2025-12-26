import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Search, Check, Loader2, ChevronDown, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoogleFont } from "@/lib/types";

interface GoogleFontPickerProps {
  value?: string;
  onChange: (font: string) => void;
  label?: string;
  placeholder?: string;
}

// Map CSS variables to readable font names
const CSS_VAR_FONT_MAP: Record<string, string> = {
  '--font-sans': 'Plus Jakarta Sans',
  '--font-serif': 'serif',
  '--font-mono': 'monospace',
  '--brand-heading-font': 'Plus Jakarta Sans',
  '--brand-body-font': 'Plus Jakarta Sans',
};

// Extract readable font name from value (handles CSS variables)
const getReadableFontName = (value?: string): string => {
  if (!value) return '';
  
  // If it's a CSS variable, try to extract the font name
  if (value.startsWith('var(--')) {
    const varMatch = value.match(/var\(--([^)]+)\)/);
    if (varMatch) {
      const varName = varMatch[1];
      // Check our map first
      if (CSS_VAR_FONT_MAP[`--${varName}`]) {
        return CSS_VAR_FONT_MAP[`--${varName}`];
      }
      // Try to get computed value from DOM
      try {
        const testEl = document.createElement('div');
        testEl.style.fontFamily = value;
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl).fontFamily;
        document.body.removeChild(testEl);
        // Extract font family name (remove quotes if present)
        const fontName = computed.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (fontName && fontName !== 'serif' && fontName !== 'sans-serif' && fontName !== 'monospace') {
          return fontName;
        }
      } catch (e) {
        // Fall through to default
      }
      // Default fallback for common variables
      return 'System Font';
    }
  }
  
  // Return the value as-is if it's already a font name
  return value;
};

// Popular fonts to show by default (curated list)
const POPULAR_FONTS: GoogleFont[] = [
  { family: "Inter", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Roboto", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Open Sans", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Lato", variants: ["400", "700"], category: "sans-serif" },
  { family: "Montserrat", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Poppins", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Playfair Display", variants: ["400", "500", "600", "700"], category: "serif" },
  { family: "Merriweather", variants: ["400", "700"], category: "serif" },
  { family: "Source Sans Pro", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Raleway", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Nunito", variants: ["400", "600", "700"], category: "sans-serif" },
  { family: "Oswald", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Quicksand", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Work Sans", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "DM Sans", variants: ["400", "500", "700"], category: "sans-serif" },
  { family: "Space Grotesk", variants: ["400", "500", "600", "700"], category: "sans-serif" },
  { family: "Crimson Text", variants: ["400", "600", "700"], category: "serif" },
  { family: "Libre Baskerville", variants: ["400", "700"], category: "serif" },
  { family: "Fira Code", variants: ["400", "500", "600", "700"], category: "monospace" },
  { family: "JetBrains Mono", variants: ["400", "500", "600", "700"], category: "monospace" },
];

// Cache for loaded fonts
const loadedFonts = new Set<string>();

const loadFont = (fontFamily: string) => {
  if (loadedFonts.has(fontFamily)) return;
  
  const fontName = fontFamily.replace(/ /g, '+');
  const linkId = `font-preview-${fontName}`;
  
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
};

export const GoogleFontPicker = ({
  value,
  onChange,
  label,
  placeholder = "Select a font...",
}: GoogleFontPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fonts, setFonts] = useState<GoogleFont[]>(POPULAR_FONTS);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Fetch fonts from Google Fonts API
  const fetchFonts = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
    
    if (!apiKey) {
      console.info("Google Fonts API key not configured. Using curated fonts list.");
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Google Fonts API error:", errorData);
        throw new Error(errorData.error?.message || "Failed to fetch fonts");
      }
      
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Invalid response from Google Fonts API");
      }
      
      const fetchedFonts: GoogleFont[] = data.items.slice(0, 150).map((item: { family: string; variants: string[]; category: string }) => ({
        family: item.family,
        variants: item.variants || [],
        category: item.category || "sans-serif",
      }));
      
      setFonts(fetchedFonts);
      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching Google Fonts:", error);
      // Fall back to curated popular fonts
      setFonts(POPULAR_FONTS);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load fonts list when dropdown opens
  useEffect(() => {
    if (isOpen && !hasSearched) {
      fetchFonts();
    }
  }, [isOpen, hasSearched, fetchFonts]);

  // Preload currently selected font
  useEffect(() => {
    const fontName = getReadableFontName(value);
    if (fontName && !fontName.startsWith('var(')) {
      loadFont(fontName);
    }
  }, [value]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        // Check if click is outside the dropdown (which is portaled to body)
        const dropdown = document.querySelector('[data-font-picker-dropdown]');
        if (dropdown && !dropdown.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!searchQuery) return fonts;
    
    const query = searchQuery.toLowerCase();
    return fonts.filter(
      (font) =>
        font.family.toLowerCase().includes(query) ||
        font.category.toLowerCase().includes(query)
    );
  }, [fonts, searchQuery]);

  // Load fonts as they become visible
  useEffect(() => {
    if (isOpen) {
      // Load first 10 fonts for previews
      filteredFonts.slice(0, 10).forEach((font) => loadFont(font.family));
    }
  }, [isOpen, filteredFonts]);

  const handleSelect = (font: GoogleFont) => {
    loadFont(font.family);
    onChange(font.family);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Get display value (readable font name)
  const displayValue = useMemo(() => {
    const readableName = getReadableFontName(value);
    return readableName || placeholder;
  }, [value, placeholder]);

  // Get actual font value for styling (use original value if it's a font name, otherwise use readable name)
  const fontValueForStyle = useMemo(() => {
    if (!value) return undefined;
    // If it's already a font name (not a CSS var), use it directly
    if (!value.startsWith('var(')) {
      return value;
    }
    // Otherwise use the readable name
    return getReadableFontName(value);
  }, [value]);

  const dropdownContent = isOpen && dropdownPosition ? (
    <motion.div
      data-font-picker-dropdown
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[100] bg-card border border-border rounded-lg shadow-xl max-h-[300px] overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
    >
            {/* Search input */}
            <div className="p-2 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border/50 rounded-md focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

      {/* Font list */}
      <div className="overflow-y-auto max-h-[240px] p-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFonts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No fonts found
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isSelected = getReadableFontName(value) === font.family || value === font.family;
            return (
              <button
                key={font.family}
                type="button"
                onClick={() => handleSelect(font)}
                onMouseEnter={() => loadFont(font.family)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors text-left",
                  "hover:bg-primary/5",
                  isSelected && "bg-primary/10"
                )}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm truncate"
                    style={{ fontFamily: `"${font.family}", ${font.category}` }}
                  >
                    {font.family}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {font.category}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  ) : null;

  return (
    <div className="relative">
      {label && (
        <label className="text-xs text-muted-foreground mb-1.5 block">
          {label}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-2.5 rounded-md transition-colors",
          "border border-border/50 hover:border-primary/50 text-left",
          isOpen && "border-primary bg-primary/5"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Type className="w-4 h-4 text-muted-foreground shrink-0" />
          <span
            className="text-sm truncate"
            style={fontValueForStyle ? { fontFamily: `"${fontValueForStyle}", sans-serif` } : undefined}
          >
            {displayValue}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {dropdownContent && createPortal(dropdownContent, document.body)}
      </AnimatePresence>
    </div>
  );
};

