import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, BookOpen, Check, Loader2, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { scrapeBusinessContext, fetchBrandData } from "@/lib/api";
import { ArchetypeSelector } from "./ArchetypeSelector";

const SETUP_STORAGE_KEY = "conclusiv_setup_completed";

interface SetupSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const SetupSheet = ({ isOpen, onOpenChange, onComplete }: SetupSheetProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    businessWebsite,
    setBusinessWebsite,
    businessContext,
    setBusinessContext,
    selectedArchetype,
  } = useNarrativeStore();

  const [websiteInput, setWebsiteInput] = useState(businessWebsite || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(!!businessContext);
  const lastFetchedUrl = useRef("");

  // Sync input with store
  useEffect(() => {
    if (businessWebsite && !websiteInput) {
      setWebsiteInput(businessWebsite);
    }
  }, [businessWebsite]);

  // Mark as fetched if context exists
  useEffect(() => {
    if (businessContext) {
      setHasFetched(true);
    }
  }, [businessContext]);

  const handleFetchBrand = async () => {
    const url = websiteInput.trim();
    if (!url.includes(".") || url === lastFetchedUrl.current) return;
    
    lastFetchedUrl.current = url;
    setIsLoading(true);

    try {
      const [scrapeResult, brandResult] = await Promise.all([
        scrapeBusinessContext(url),
        fetchBrandData(url),
      ]);

      if (scrapeResult.context || brandResult.data) {
        setBusinessWebsite(url);
        
        const firmographics = brandResult.data?.firmographics;
        const enrichedContext = {
          ...scrapeResult.context,
          logoUrl: brandResult.data?.logo?.url,
          logoVariants: brandResult.data?.logos || [],
          brandColors: brandResult.data?.colors,
          brandFonts: brandResult.data?.fonts,
          firmographics: firmographics,
          companyName: scrapeResult.context?.companyName || brandResult.data?.companyName || '',
          industry: scrapeResult.context?.industry || '',
        };
        
        setBusinessContext(enrichedContext);
        setHasFetched(true);
        
        // Brand loaded - UI already shows success via the brand preview card
      }
    } catch (err) {
      console.error("Failed to fetch brand:", err);
      toast({
        title: "Could not fetch brand",
        description: "Please try again or enter details manually",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setWebsiteInput("");
    setBusinessWebsite("");
    setBusinessContext(null);
    setHasFetched(false);
    lastFetchedUrl.current = "";
  };

  const handleSave = () => {
    // Mark setup as completed
    localStorage.setItem(SETUP_STORAGE_KEY, "true");
    onOpenChange(false);
    onComplete?.();
  };

  const hasMinimumSetup = businessContext?.companyName || selectedArchetype;

  const content = (
    <div className="p-6 space-y-8 overflow-y-auto flex-1">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Personalize Your Demo</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add your brand to make your demo shine
        </p>
      </div>

      {/* Business URL Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Company Website
        </label>
        <p className="text-xs text-muted-foreground">
          We'll automatically pull your logo, colors, and company info
        </p>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="url"
              value={websiteInput}
              onChange={(e) => setWebsiteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && websiteInput.includes(".")) {
                  handleFetchBrand();
                }
              }}
              placeholder="yourcompany.com"
              className="w-full h-12 px-4 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleFetchBrand}
            disabled={!websiteInput.includes(".") || isLoading}
            className="h-12 px-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </div>

        {/* Brand Preview Card */}
        <AnimatePresence>
          {hasFetched && businessContext && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              {businessContext.logoUrl && (
                <img
                  src={businessContext.logoUrl}
                  alt="Company logo"
                  className="w-8 h-8 object-contain rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {businessContext.companyName || "Company loaded"}
                </p>
                {businessContext.industry && (
                  <p className="text-xs text-muted-foreground truncate">
                    {businessContext.industry}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <button
                  onClick={handleClear}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Story Mode / Archetype */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Story Mode
        </label>
        <p className="text-xs text-muted-foreground">
          Choose a narrative structure for your presentation
        </p>
        <ArchetypeSelector />
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          variant="shimmer"
          size="lg"
          onClick={handleSave}
          className="w-full h-12"
        >
          {hasMinimumSetup ? "Save & Continue" : "Skip for Now"}
        </Button>
        {!hasMinimumSetup && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            You can always add this later
          </p>
        )}
      </div>
    </div>
  );

  // Use Drawer on mobile, Sheet on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="min-h-[70vh] max-h-[90vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            Setup
          </SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

// Hook to check if setup should auto-open
export const useSetupSheet = () => {
  const { businessContext } = useNarrativeStore();
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if this is a first-time visit
    const hasCompletedSetup = localStorage.getItem(SETUP_STORAGE_KEY);
    const hasExistingContext = !!businessContext?.companyName;
    
    // Auto-open if first time AND no context
    if (!hasCompletedSetup && !hasExistingContext) {
      // Delay slightly for smoother UX
      const timer = setTimeout(() => {
        setShouldAutoOpen(true);
        setHasChecked(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    setHasChecked(true);
  }, [businessContext]);

  const markSetupComplete = () => {
    localStorage.setItem(SETUP_STORAGE_KEY, "true");
    setShouldAutoOpen(false);
  };

  return {
    shouldAutoOpen,
    hasChecked,
    markSetupComplete,
  };
};
