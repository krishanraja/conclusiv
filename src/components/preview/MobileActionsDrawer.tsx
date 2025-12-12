import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Sliders, 
  FileText, 
  X, 
  ChevronUp,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNarrativeStore } from "@/store/narrativeStore";
import { NarrativeQualityScore } from "@/components/intelligence/NarrativeQualityScore";
import { ExecutiveSummary } from "@/components/intelligence/ExecutiveSummary";
import { QuickAdjustments } from "./QuickAdjustments";

type DrawerTab = "score" | "summary" | "adjustments";

export const MobileActionsDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("score");
  const { narrative } = useNarrativeStore();

  if (!narrative) return null;

  const tabs: { id: DrawerTab; label: string; icon: typeof BarChart3 }[] = [
    { id: "score", label: "Score", icon: BarChart3 },
    { id: "summary", label: "Summary", icon: FileText },
    { id: "adjustments", label: "Adjust", icon: Sliders },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          "lg:hidden"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Tools</span>
        <ChevronUp className="w-4 h-4" />
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-xl lg:hidden max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Narrative Tools</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-border">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                        activeTab === tab.id
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {activeTab === "score" && (
                    <motion.div
                      key="score"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <NarrativeQualityScore />
                    </motion.div>
                  )}
                  {activeTab === "summary" && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ExecutiveSummary />
                    </motion.div>
                  )}
                  {activeTab === "adjustments" && (
                    <motion.div
                      key="adjustments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <QuickAdjustments />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
