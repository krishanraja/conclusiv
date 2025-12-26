import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Palette, Type, ImageIcon, Check, Plus } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorPickerInput } from "./ColorPickerInput";
import { GoogleFontPicker } from "./GoogleFontPicker";
import { CompanyLogoUpload } from "@/components/input/CompanyLogoUpload";
import type { LogoPosition, LogoSize, PresentationStyle, ColorRole } from "@/lib/types";

const logoPositions: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const logoSizes: { value: LogoSize; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
];

// All available color roles with their display info
const colorRoles: { role: ColorRole; label: string; description: string }[] = [
  { role: 'primary', label: 'Primary', description: 'Main brand color' },
  { role: 'secondary', label: 'Secondary', description: 'Supporting color' },
  { role: 'accent', label: 'Accent', description: 'Highlight elements' },
  { role: 'background', label: 'Background', description: 'Slide backgrounds' },
  { role: 'text', label: 'Text', description: 'Main text color' },
  { role: 'highlight', label: 'Highlight', description: 'Call-out areas' },
];

// Map CSS variables to readable font names
const CSS_VAR_FONT_MAP: Record<string, string> = {
  '--font-sans': 'Plus Jakarta Sans',
  '--font-serif': 'serif',
  '--font-mono': 'monospace',
  '--brand-heading-font': 'Plus Jakarta Sans',
  '--brand-body-font': 'Plus Jakarta Sans',
};

// Extract readable font name from value (handles CSS variables)
const getReadableFontName = (value?: string | null): string => {
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

export const BrandStyleEditor = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const { 
    businessContext, 
    presentationStyle, 
    setPresentationStyle,
    userUploadedLogoUrl,
    setUserUploadedLogoUrl,
  } = useNarrativeStore();

  const hasLogo = !!(businessContext?.logoUrl || userUploadedLogoUrl);
  const hasBrandColors = !!businessContext?.brandColors;
  const hasBrandFonts = !!businessContext?.brandFonts;

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  // Unified style update with auto-save indicator
  const updateStyle = useCallback((updates: Partial<PresentationStyle>) => {
    setPresentationStyle(updates);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  }, [setPresentationStyle]);

  const applyBrandColor = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    updateStyle({ [`${colorType}Color`]: color });
  };

  const applyBrandFont = (fontType: 'primary' | 'secondary', font: string) => {
    updateStyle({ [`${fontType}Font`]: font });
  };

  // Get color value for a role (from presentation style or brand colors)
  const getColorValue = (role: ColorRole): string => {
    const styleKey = `${role}Color` as keyof PresentationStyle;
    const styleValue = presentationStyle?.[styleKey];
    if (styleValue && typeof styleValue === 'string') return styleValue;
    
    // Fall back to brand colors for primary/secondary/accent
    if (role === 'primary' || role === 'secondary' || role === 'accent') {
      return businessContext?.brandColors?.[role] || '';
    }
    
    return '';
  };

  // Get active colors count for preview
  const activeColors = colorRoles.filter(({ role }) => getColorValue(role)).slice(0, 6);

  return (
    <div className="space-y-1">
      {/* Auto-save indicator */}
      <AnimatePresence>
        {showSaved && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center justify-end gap-1.5 text-xs text-green-500 pb-1"
          >
            <Check className="w-3 h-3" />
            <span>Auto-saved</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Colors Panel */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => togglePanel("colors")}
          className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span>Brand Colors</span>
            {activeColors.length > 0 && (
              <div className="flex gap-1 ml-1">
                {activeColors.map(({ role }) => {
                  const color = getColorValue(role);
                  return color ? (
                    <div
                      key={role}
                      className="w-3 h-3 rounded-full border border-border/50"
                      style={{ backgroundColor: color }}
                    />
                  ) : null;
                })}
              </div>
            )}
          </div>
          <motion.div
            animate={{ rotate: expandedPanel === "colors" ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedPanel === "colors" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-3">
                {/* Brand Colors from Brandfetch */}
                {hasBrandColors && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Quick apply from your brand
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['primary', 'secondary', 'accent'] as const).map((colorType) => {
                        const color = businessContext?.brandColors?.[colorType];
                        if (!color) return null;
                        const isSelected = presentationStyle?.[`${colorType}Color`] === color;
                        return (
                          <button
                            key={colorType}
                            onClick={() => applyBrandColor(colorType, color)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-2 rounded-md transition-colors",
                              "border border-border/50 hover:border-primary/50",
                              isSelected && "border-primary bg-primary/5"
                            )}
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all relative",
                                isSelected ? "border-primary" : "border-border/50"
                              )}
                              style={{ backgroundColor: color }}
                            >
                              {isSelected && (
                                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                              )}
                            </div>
                            <span className="text-xs capitalize">{colorType}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border/30 my-2" />
                  </>
                )}

                {/* Custom Color Pickers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Customize colors
                    </p>
                    {!showAllColors && (
                      <button
                        onClick={() => setShowAllColors(true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        More colors
                      </button>
                    )}
                  </div>

                  {/* Primary colors always shown */}
                  <div className="space-y-2">
                    {colorRoles.slice(0, showAllColors ? 6 : 3).map(({ role, label }) => (
                      <ColorPickerInput
                        key={role}
                        label={label}
                        value={getColorValue(role)}
                        onChange={(color) => updateStyle({ [`${role}Color`]: color })}
                      />
                    ))}
                  </div>

                  {showAllColors && (
                    <button
                      onClick={() => setShowAllColors(false)}
                      className="text-xs text-muted-foreground hover:text-foreground w-full text-center py-1"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fonts Panel */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => togglePanel("fonts")}
          className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <Type className="w-4 h-4 text-muted-foreground" />
            <span>Brand Fonts</span>
            {(presentationStyle?.primaryFont || hasBrandFonts) && (
              <span className="text-xs text-muted-foreground ml-1 truncate max-w-[100px]">
                {getReadableFontName(presentationStyle?.primaryFont || businessContext?.brandFonts?.primary)}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: expandedPanel === "fonts" ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedPanel === "fonts" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-3">
                {/* Brand fonts from Brandfetch */}
                {hasBrandFonts && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Quick apply from your brand
                    </p>
                    <div className="space-y-2">
                      {(['primary', 'secondary'] as const).map((fontType) => {
                        const font = businessContext?.brandFonts?.[fontType];
                        if (!font) return null;
                        const isSelected = presentationStyle?.[`${fontType}Font`] === font;
                        return (
                          <button
                            key={fontType}
                            onClick={() => applyBrandFont(fontType, font)}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-md transition-colors",
                              "border border-border/50 hover:border-primary/50 text-left",
                              isSelected && "border-primary bg-primary/5"
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium">{font}</p>
                              <p className="text-xs text-muted-foreground capitalize">{fontType} font</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border/30 my-2" />
                  </>
                )}

                {/* Google Fonts Picker */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Choose from Google Fonts
                  </p>
                  <GoogleFontPicker
                    label="Heading Font"
                    value={presentationStyle?.primaryFont}
                    onChange={(font) => updateStyle({ primaryFont: font })}
                    placeholder="Select heading font..."
                  />
                  <GoogleFontPicker
                    label="Body Font"
                    value={presentationStyle?.secondaryFont}
                    onChange={(font) => updateStyle({ secondaryFont: font })}
                    placeholder="Select body font..."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logo Panel */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => togglePanel("logo")}
          className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <span>Logo</span>
            {hasLogo && presentationStyle?.showLogo && (
              <span className="text-xs text-shimmer-start">
                {presentationStyle?.logoPosition?.replace('-', ' ')}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: expandedPanel === "logo" ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedPanel === "logo" && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-4">
                {/* Logo Upload */}
                <CompanyLogoUpload
                  currentLogoUrl={userUploadedLogoUrl || undefined}
                  brandfetchLogoUrl={businessContext?.logoUrl}
                  onUpload={(url) => setUserUploadedLogoUrl(url)}
                  onRemove={() => setUserUploadedLogoUrl(null)}
                />

                {hasLogo && (
                  <>
                    <div className="border-t border-border/30" />
                    
                    {/* Show/Hide toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-logo" className="text-sm">Show logo on slides</Label>
                      <Switch
                        id="show-logo"
                        checked={presentationStyle?.showLogo ?? true}
                        onCheckedChange={(checked) => updateStyle({ showLogo: checked })}
                      />
                    </div>

                    {presentationStyle?.showLogo && (
                      <>
                        {/* Position */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {logoPositions.map((pos) => (
                              <button
                                key={pos.value}
                                onClick={() => updateStyle({ logoPosition: pos.value })}
                                className={cn(
                                  "px-2 py-1.5 text-xs rounded transition-colors",
                                  presentationStyle?.logoPosition === pos.value
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-card/50 text-muted-foreground hover:text-foreground border border-border/50"
                                )}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Size</Label>
                          <div className="flex gap-1.5">
                            {logoSizes.map((size) => (
                              <button
                                key={size.value}
                                onClick={() => updateStyle({ logoSize: size.value })}
                                className={cn(
                                  "flex-1 px-3 py-1.5 text-xs rounded transition-colors",
                                  presentationStyle?.logoSize === size.value
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-card/50 text-muted-foreground hover:text-foreground border border-border/50"
                                )}
                              >
                                {size.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
