import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export type UpgradeTrigger = 
  | 'build_limit'
  | 'template'
  | 'export'
  | 'sections'
  | 'presentation'
  | 'icons'
  | 'themes'
  | 'reorder';

const TRIGGER_MESSAGES: Record<UpgradeTrigger, { title: string; description: string }> = {
  build_limit: {
    title: "You've used your free build this week",
    description: 'Unlock unlimited builds to iterate freely on your narratives.',
  },
  template: {
    title: 'This template is Pro-only',
    description: 'Access all 5 templates to tailor stories for any audience.',
  },
  export: {
    title: 'Export your narrative',
    description: 'Download as PDF, PowerPoint, or create shareable links.',
  },
  sections: {
    title: 'Your narrative has been trimmed',
    description: 'Free narratives are limited to 4 sections. Get the full story.',
  },
  presentation: {
    title: 'Unlock full presentation mode',
    description: 'Remove watermark and access cinematic transitions.',
  },
  icons: {
    title: 'Customize section icons',
    description: 'Change icons to better represent your content.',
  },
  themes: {
    title: 'Switch color themes',
    description: 'Access multiple visual themes for your presentation.',
  },
  reorder: {
    title: 'Reorder sections',
    description: 'Drag and drop to arrange your narrative flow.',
  },
};

interface UpgradePromptProps {
  trigger: UpgradeTrigger;
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradePrompt = ({ trigger, isOpen, onClose }: UpgradePromptProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  
  const message = TRIGGER_MESSAGES[trigger];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth?mode=signup&intent=upgrade');
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal - Full-width bottom sheet on mobile, centered card on desktop */}
          <motion.div
            initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={
              isMobile 
                ? "fixed bottom-0 left-0 right-0 z-50"
                : "fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4"
            }
          >
            <div className={
              isMobile
                ? "bg-card rounded-t-2xl p-5 pb-safe shadow-2xl border-t border-x border-border/50"
                : "glass-strong rounded-xl p-6 shadow-2xl border border-border/50"
            }>
              {/* Drag handle for mobile */}
              {isMobile && (
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}

              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="space-y-4">
                <div className={isMobile ? "text-center" : "flex items-start gap-3"}>
                  <div className={`w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 ${isMobile ? 'mx-auto mb-3' : ''}`}>
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-foreground ${isMobile ? 'text-lg' : ''}`}>{message.title}</h3>
                    <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-sm' : 'text-sm'}`}>{message.description}</p>
                  </div>
                </div>

                {/* Features preview - horizontal scroll on mobile */}
                <div className={isMobile ? "flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" : "grid grid-cols-2 gap-2"}>
                  {['Unlimited builds', 'All templates', 'PDF & PPTX export', 'No watermark'].map((feature) => (
                    <div 
                      key={feature} 
                      className={
                        isMobile 
                          ? "flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5 flex-shrink-0"
                          : "flex items-center gap-1.5 text-xs text-muted-foreground"
                      }
                    >
                      <Check className={`text-primary flex-shrink-0 ${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                      <span className={`whitespace-nowrap ${isMobile ? 'text-sm text-foreground' : 'text-xs text-muted-foreground'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className={isMobile ? "space-y-3" : "flex items-center gap-3"}>
                  <Button
                    variant="shimmer"
                    className={isMobile ? "w-full h-12 text-base" : "flex-1"}
                    onClick={handleUpgrade}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Start 7-day free trial'
                    )}
                  </Button>
                  <p className={`text-muted-foreground ${isMobile ? 'text-center text-sm' : 'text-xs'}`}>
                    {isMobile ? 'Then $10/mo • Cancel anytime' : '$10/mo after'}
                  </p>
                </div>

                {/* Value prop - only on desktop */}
                {!isMobile && (
                  <p className="text-xs text-center text-muted-foreground">
                    Less than the cost of one slide designer.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
