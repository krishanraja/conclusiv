import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { BusinessContext } from "@/lib/types";
import { LogoVariantSelector } from "./LogoVariantSelector";

interface BrandPreviewCardProps {
  context: BusinessContext;
  userLogoUrl?: string;
  onPreviewClick?: () => void;
  onLogoSelect?: (url: string) => void;
}

export const BrandPreviewCard = ({
  context,
  userLogoUrl,
  onPreviewClick,
  onLogoSelect,
}: BrandPreviewCardProps) => {
  const logoUrl = userLogoUrl || context.logoUrl;
  const colors = context.brandColors;
  const initials = context.companyName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const hasLogoVariants = context.logoVariants && context.logoVariants.length > 1;

  const handleLogoVariantSelect = (url: string) => {
    if (onLogoSelect) {
      onLogoSelect(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-card/30 rounded-lg border border-border/30"
    >
      <div className="flex items-start gap-3">
        {/* Logo preview - show initials as fallback */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-lg border border-border/50 bg-background flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={context.companyName}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Hide image on error to show fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            {/* Fallback initials - always rendered but may be covered by image */}
            <span 
              className="text-sm font-semibold text-primary absolute"
              style={{ display: logoUrl ? 'none' : 'block' }}
            >
              {initials}
            </span>
          </div>
          
          {/* Logo variant selector */}
          {hasLogoVariants && !userLogoUrl && (
            <LogoVariantSelector
              variants={context.logoVariants!}
              selectedUrl={context.logoUrl}
              onSelect={handleLogoVariantSelect}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Company name */}
          <p className="text-sm font-medium text-foreground truncate">
            {context.companyName}
          </p>

          {/* Firmographics */}
          {context.firmographics && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {[
                context.firmographics.employeeCount && `${context.firmographics.employeeCount} employees`,
                context.firmographics.foundedYear && `Est. ${context.firmographics.foundedYear}`,
                context.industry,
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Color palette */}
          {colors && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mr-1">
                Brand
              </span>
              {colors.primary && (
                <div
                  className="w-4 h-4 rounded-full border border-border/30"
                  style={{ backgroundColor: colors.primary }}
                  title="Primary color"
                />
              )}
              {colors.secondary && (
                <div
                  className="w-4 h-4 rounded-full border border-border/30"
                  style={{ backgroundColor: colors.secondary }}
                  title="Secondary color"
                />
              )}
              {colors.accent && (
                <div
                  className="w-4 h-4 rounded-full border border-border/30"
                  style={{ backgroundColor: colors.accent }}
                  title="Accent color"
                />
              )}
            </div>
          )}

          {/* Font preview */}
          {context.brandFonts?.primary && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Font: {context.brandFonts.primary}
            </p>
          )}
        </div>

        {/* Preview button */}
        {onPreviewClick && (
          <button
            type="button"
            onClick={onPreviewClick}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            <Play className="w-3 h-3" />
            Preview
          </button>
        )}
      </div>
    </motion.div>
  );
};