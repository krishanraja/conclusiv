import { useMemo } from "react";
import { useNarrativeStore } from "@/store/narrativeStore";
import type { LogoVariant } from "@/lib/types";

/**
 * Hook to get the appropriate logo URL based on:
 * 1. User-uploaded logo (highest priority)
 * 2. Dark mode preference (auto-detect from system/app theme)
 * 3. Available logo variants from Brandfetch
 */
export const useBrandLogo = () => {
  const { businessContext, userUploadedLogoUrl, presentationStyle } = useNarrativeStore();
  
  // Detect if we're in dark mode
  const isDarkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }, []);

  // Get the best logo URL based on context
  const logoUrl = useMemo(() => {
    // User-uploaded logo takes highest priority
    if (userUploadedLogoUrl) {
      return userUploadedLogoUrl;
    }
    
    // If we have logo variants, pick the best one for the current theme
    if (businessContext?.logoVariants && businessContext.logoVariants.length > 0) {
      const variants = businessContext.logoVariants;
      const targetTheme = isDarkMode ? 'dark' : 'light';
      
      // Priority: 1. Exact theme match + logo type, 2. Any logo type with theme, 3. Fallback
      const preferredVariant = 
        // First try: logo type with matching theme
        variants.find(v => v.type === 'logo' && v.theme === targetTheme) ||
        // Second try: any type with matching theme
        variants.find(v => v.theme === targetTheme) ||
        // Third try: logo type regardless of theme
        variants.find(v => v.type === 'logo') ||
        // Fallback: first available
        variants[0];
      
      if (preferredVariant) {
        return preferredVariant.url;
      }
    }
    
    // Fallback to simple logoUrl
    return businessContext?.logoUrl;
  }, [userUploadedLogoUrl, businessContext?.logoVariants, businessContext?.logoUrl, isDarkMode]);

  // Get logo for a specific theme (useful for explicit dark/light contexts)
  const getLogoForTheme = (theme: 'light' | 'dark'): string | undefined => {
    if (userUploadedLogoUrl) {
      return userUploadedLogoUrl;
    }
    
    if (businessContext?.logoVariants && businessContext.logoVariants.length > 0) {
      const variants = businessContext.logoVariants;
      
      const preferredVariant = 
        variants.find(v => v.type === 'logo' && v.theme === theme) ||
        variants.find(v => v.theme === theme) ||
        variants.find(v => v.type === 'logo') ||
        variants[0];
      
      if (preferredVariant) {
        return preferredVariant.url;
      }
    }
    
    return businessContext?.logoUrl;
  };

  // Get all available variants
  const logoVariants = businessContext?.logoVariants || [];
  
  // Check if we have theme-specific variants
  const hasDarkVariant = logoVariants.some(v => v.theme === 'dark');
  const hasLightVariant = logoVariants.some(v => v.theme === 'light');

  return {
    logoUrl,
    isDarkMode,
    getLogoForTheme,
    logoVariants,
    hasDarkVariant,
    hasLightVariant,
    showLogo: presentationStyle?.showLogo ?? true,
    logoPosition: presentationStyle?.logoPosition ?? 'top-right',
    logoSize: presentationStyle?.logoSize ?? 'md',
  };
};
