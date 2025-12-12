import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X, Users, Clock, Sparkles, AlertTriangle } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { AudienceSelector } from "./AudienceSelector";
import { DurationSelector } from "./DurationSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export const MobileQuickSettings = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { tensions, includeTensionSlide, setIncludeTensionSlide } = useNarrativeStore();
  const { toast } = useToast();

  const handleSettingChange = (setting: string) => {
    toast({
      title: "Setting updated",
      description: `${setting} changed. Tap "Rebuild" to apply changes.`,
    });
  };

  return (
    <>
      {/* Floating Action Button - visible on mobile only */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-shimmer-start text-white shadow-lg shadow-shimmer-start/30 flex items-center justify-center"
      >
        <Settings2 className="w-5 h-5" />
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h2 className="font-semibold">Quick Settings</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-background"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings */}
              <div className="p-4 space-y-6">
                {/* Audience */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-shimmer-start" />
                    <span>Audience</span>
                  </div>
                  <AudienceSelector onSelect={() => handleSettingChange("Audience")} />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4 text-shimmer-start" />
                    <span>Duration</span>
                  </div>
                  <DurationSelector onSelect={() => handleSettingChange("Duration")} />
                </div>

                {/* Tensions Toggle */}
                {tensions.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm">Include tension slide</span>
                    </div>
                    <Switch
                      checked={includeTensionSlide}
                      onCheckedChange={(checked) => {
                        setIncludeTensionSlide(checked);
                        handleSettingChange("Tension slide");
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
