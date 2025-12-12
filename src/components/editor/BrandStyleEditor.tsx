import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Palette, Type, ImageIcon, Check } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LogoPosition, LogoSize, PresentationStyle } from "@/lib/types";

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

export const BrandStyleEditor = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const { 
    businessContext, 
    presentationStyle, 
    setPresentationStyle,
    userUploadedLogoUrl,
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
            {hasBrandColors && (
              <div className="flex gap-1 ml-1">
                {Object.values(businessContext?.brandColors || {}).slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-border/50"
                    style={{ backgroundColor: color }}
                  />
                ))}
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
                {hasBrandColors ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Click a color to apply it to your presentation
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
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    Add a business website to fetch brand colors automatically
                  </p>
                )}
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
            {hasBrandFonts && (
              <span className="text-xs text-muted-foreground ml-1">
                {businessContext?.brandFonts?.primary}
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
                {hasBrandFonts ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Click to apply your brand fonts
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
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    Add a business website to fetch brand fonts automatically
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logo Placement Panel */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <button
          onClick={() => togglePanel("logo")}
          className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <span>Logo Placement</span>
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
                {hasLogo ? (
                  <>
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
                ) : (
                  <p className="text-xs text-muted-foreground py-2">
                    Add a business website or upload a logo to enable logo placement
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
