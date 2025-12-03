import { Layers, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              Narrative Builder
            </h1>
            <p className="text-xs text-muted-foreground">AI Story Engine</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary">
            Prezi-style Narratives
          </span>
        </nav>
      </div>
    </motion.header>
  );
};
