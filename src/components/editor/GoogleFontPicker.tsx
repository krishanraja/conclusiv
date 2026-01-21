import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Search, Check, Loader2, ChevronUp, Type, Sparkles } from "lucide-react";
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
  
  if (value.startsWith('var(--')) {
    const varMatch = value.match(/var\(--([^)]+)\)/);
    if (varMatch) {
      const varName = varMatch[1];
      if (CSS_VAR_FONT_MAP[`--${varName}`]) {
        return CSS_VAR_FONT_MAP[`--${varName}`];
      }
      try {
        const testEl = document.createElement('div');
        testEl.style.fontFamily = value;
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl).fontFamily;
        document.body.removeChild(testEl);
        const fontName = computed.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (fontName && fontName !== 'serif' && fontName !== 'sans-serif' && fontName !== 'monospace') {
          return fontName;
        }
      } catch {
        // Fall through
      }
      return 'System Font';
    }
  }
  
  return value;
};

// Font categories with curated selections
type FontCategory = "all" | "readable" | "modern" | "elegant" | "playful";

const FONT_CATEGORIES: { id: FontCategory; label: string; description: string }[] = [
  { id: "all", label: "All", description: "All fonts" },
  { id: "readable", label: "Readable", description: "Clear and legible" },
  { id: "modern", label: "Modern", description: "Clean and contemporary" },
  { id: "elegant", label: "Elegant", description: "Sophisticated serif fonts" },
  { id: "playful", label: "Playful", description: "Fun and creative" },
];

// Curated fonts with categories - expanded list with diverse options
const CURATED_FONTS: (GoogleFont & { categories: FontCategory[] })[] = [
  // Readable - Clear and legible
  { family: "Inter", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["readable", "modern"] },
  { family: "Source Sans 3", variants: ["400", "600", "700"], category: "sans-serif", categories: ["readable"] },
  { family: "IBM Plex Sans", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["readable", "modern"] },
  { family: "Nunito", variants: ["400", "600", "700"], category: "sans-serif", categories: ["readable", "playful"] },
  { family: "Lato", variants: ["400", "700"], category: "sans-serif", categories: ["readable"] },
  { family: "Open Sans", variants: ["400", "600", "700"], category: "sans-serif", categories: ["readable"] },
  
  // Modern - Clean and contemporary
  { family: "DM Sans", variants: ["400", "500", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Space Grotesk", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Outfit", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Sora", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Manrope", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "General Sans", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Satoshi", variants: ["400", "500", "700"], category: "sans-serif", categories: ["modern"] },
  { family: "Cabinet Grotesk", variants: ["400", "500", "700"], category: "sans-serif", categories: ["modern"] },
  
  // Elegant - Sophisticated serifs
  { family: "Playfair Display", variants: ["400", "500", "600", "700"], category: "serif", categories: ["elegant"] },
  { family: "Cormorant Garamond", variants: ["400", "500", "600", "700"], category: "serif", categories: ["elegant"] },
  { family: "Libre Baskerville", variants: ["400", "700"], category: "serif", categories: ["elegant", "readable"] },
  { family: "Crimson Text", variants: ["400", "600", "700"], category: "serif", categories: ["elegant", "readable"] },
  { family: "Fraunces", variants: ["400", "500", "600", "700"], category: "serif", categories: ["elegant", "playful"] },
  { family: "Lora", variants: ["400", "500", "600", "700"], category: "serif", categories: ["elegant", "readable"] },
  { family: "EB Garamond", variants: ["400", "500", "600", "700"], category: "serif", categories: ["elegant"] },
  
  // Playful - Fun and creative
  { family: "Quicksand", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["playful", "readable"] },
  { family: "Comfortaa", variants: ["400", "500", "600", "700"], category: "display", categories: ["playful"] },
  { family: "Fredoka", variants: ["400", "500", "600", "700"], category: "display", categories: ["playful"] },
  { family: "Lexend", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["playful", "readable"] },
  { family: "Baloo 2", variants: ["400", "500", "600", "700"], category: "display", categories: ["playful"] },
  { family: "Rubik", variants: ["400", "500", "600", "700"], category: "sans-serif", categories: ["playful", "modern"] },
  
  // Monospace
  { family: "JetBrains Mono", variants: ["400", "500", "600", "700"], category: "monospace", categories: ["modern"] },
  { family: "Fira Code", variants: ["400", "500", "600", "700"], category: "monospace", categories: ["modern"] },
];

// Popular pairings suggestions
const FONT_PAIRINGS: { heading: string; body: string; style: string }[] = [
  { heading: "Playfair Display", body: "Source Sans 3", style: "Classic Editorial" },
  { heading: "Space Grotesk", body: "Inter", style: "Modern Tech" },
  { heading: "Fraunces", body: "Outfit", style: "Creative Bold" },
  { heading: "DM Sans", body: "DM Sans", style: "Clean Minimal" },
];

// Local storage key for recent fonts
const RECENT_FONTS_KEY = "conclusiv-recent-fonts";

// Get recent fonts from localStorage
const getRecentFonts = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_FONTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save font to recent list
const saveRecentFont = (fontFamily: string) => {
  try {
    const recent = getRecentFonts().filter(f => f !== fontFamily);
    recent.unshift(fontFamily);
    localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch {
    // Ignore localStorage errors
  }
};

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
  const [selectedCategory, setSelectedCategory] = useState<FontCategory>("all");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Load recent fonts on mount
  useEffect(() => {
    setRecentFonts(getRecentFonts());
  }, []);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = CURATED_FONTS;
    
    if (selectedCategory !== "all") {
      fonts = fonts.filter(f => f.categories.includes(selectedCategory));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      fonts = fonts.filter(
        (font) =>
          font.family.toLowerCase().includes(query) ||
          font.category.toLowerCase().includes(query)
      );
    }
    
    return fonts;
  }, [searchQuery, selectedCategory]);

  // Recent fonts that exist in our curated list
  const recentFontItems = useMemo(() => {
    return recentFonts
      .map(family => CURATED_FONTS.find(f => f.family === family))
      .filter((f): f is typeof CURATED_FONTS[0] => !!f);
  }, [recentFonts]);

  // Preload currently selected font
  useEffect(() => {
    const fontName = getReadableFontName(value);
    if (fontName && !fontName.startsWith('var(')) {
      loadFont(fontName);
    }
  }, [value]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 380;
      
      // Position above if not enough space below
      const top = spaceBelow < dropdownHeight && rect.top > dropdownHeight
        ? rect.top - dropdownHeight - 8
        : rect.bottom + 8;
      
      setDropdownPosition({
        top,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
      
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setDropdownPosition(null);
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const dropdown = document.querySelector('[data-font-picker-dropdown]');
        if (dropdown && !dropdown.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredFonts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredFonts.length) {
          handleSelect(filteredFonts[focusedIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, focusedIndex, filteredFonts]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-font-item]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Load fonts as they become visible
  useEffect(() => {
    if (isOpen) {
      filteredFonts.slice(0, 8).forEach((font) => loadFont(font.family));
      recentFontItems.forEach((font) => loadFont(font.family));
    }
  }, [isOpen, filteredFonts, recentFontItems]);

  const handleSelect = (font: GoogleFont) => {
    loadFont(font.family);
    onChange(font.family);
    saveRecentFont(font.family);
    setRecentFonts(getRecentFonts());
    setIsOpen(false);
    setSearchQuery("");
    buttonRef.current?.focus();
  };

  // Get display value
  const displayValue = useMemo(() => {
    const readableName = getReadableFontName(value);
    return readableName || placeholder;
  }, [value, placeholder]);

  const fontValueForStyle = useMemo(() => {
    if (!value) return undefined;
    if (!value.startsWith('var(')) return value;
    return getReadableFontName(value);
  }, [value]);

  const dropdownContent = isOpen && dropdownPosition ? (
    <motion.div
      data-font-picker-dropdown
      role="listbox"
      aria-label="Font selection"
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-feedback bg-card border border-border rounded-lg shadow-xl overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        maxHeight: '380px',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="p-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFocusedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search fonts..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border/50 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            aria-label="Search fonts"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 p-2 border-b border-border/50 overflow-x-auto">
        {FONT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.id);
              setFocusedIndex(0);
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title={cat.description}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Font list */}
      <div ref={listRef} className="overflow-y-auto max-h-[260px] p-1">
        {/* Recent fonts section */}
        {recentFontItems.length > 0 && !searchQuery && selectedCategory === "all" && (
          <div className="mb-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
              Recently Used
            </p>
            {recentFontItems.map((font, idx) => {
              const isSelected = getReadableFontName(value) === font.family || value === font.family;
              return (
                <button
                  key={`recent-${font.family}`}
                  type="button"
                  data-font-item
                  onClick={() => handleSelect(font)}
                  onMouseEnter={() => loadFont(font.family)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors text-left",
                    "hover:bg-primary/5 focus:bg-primary/5 focus:outline-none",
                    isSelected && "bg-primary/10"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    className="text-sm truncate"
                    style={{ fontFamily: `"${font.family}", ${font.category}` }}
                  >
                    {font.family}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
            <div className="border-t border-border/30 my-2" />
          </div>
        )}

        {/* Main font list */}
        {filteredFonts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No fonts found
          </div>
        ) : (
          filteredFonts.map((font, idx) => {
            const isSelected = getReadableFontName(value) === font.family || value === font.family;
            const isFocused = focusedIndex === idx;
            return (
              <button
                key={font.family}
                type="button"
                data-font-item
                onClick={() => handleSelect(font)}
                onMouseEnter={() => {
                  loadFont(font.family);
                  setFocusedIndex(idx);
                }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors text-left",
                  "hover:bg-primary/5 focus:outline-none",
                  isSelected && "bg-primary/10",
                  isFocused && "bg-primary/5 ring-1 ring-primary/30"
                )}
                role="option"
                aria-selected={isSelected}
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
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {/* Quick pairings suggestion */}
      {label?.toLowerCase().includes('heading') && !searchQuery && (
        <div className="border-t border-border/50 p-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Perfect Pairings
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FONT_PAIRINGS.map((pair) => (
              <button
                key={pair.heading}
                type="button"
                onClick={() => {
                  loadFont(pair.heading);
                  onChange(pair.heading);
                  saveRecentFont(pair.heading);
                  setRecentFonts(getRecentFonts());
                  setIsOpen(false);
                }}
                className="flex-shrink-0 px-2 py-1 rounded-md text-[10px] bg-muted/50 hover:bg-primary/10 transition-colors"
                title={`${pair.heading} + ${pair.body}`}
              >
                {pair.style}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  ) : null;

  return (
    <div className="relative">
      {label && (
        <label className="text-xs text-muted-foreground mb-1.5 block" id={`${label}-label`}>
          {label}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${label}-label` : undefined}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-2.5 rounded-md transition-colors",
          "border border-border/50 hover:border-primary/50 text-left",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
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
        <ChevronUp
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
            !isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {dropdownContent && createPortal(dropdownContent, document.body)}
      </AnimatePresence>
    </div>
  );
};
