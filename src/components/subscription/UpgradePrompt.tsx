import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
  const [isLoading, setIsLoading] = useState(false);
  
  const message = TRIGGER_MESSAGES[trigger];

  const handleUpgrade = async () => {
    if (!user) {
      // Redirect to auth with upgrade intent
      navigate('/auth?mode=signup&intent=upgrade');
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="glass-strong rounded-xl p-6 shadow-2xl border border-border/50">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{message.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{message.description}</p>
                  </div>
                </div>

                {/* Features preview */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Unlimited builds', 'All templates', 'PDF & PPTX export', 'No watermark'].map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 text-muted-foreground">
                      <Check className="w-3 h-3 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="shimmer"
                    className="flex-1"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Start 7-day free trial'
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground">$10/mo after</span>
                </div>

                {/* Value prop */}
                <p className="text-xs text-center text-muted-foreground">
                  Less than the cost of one slide designer.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
