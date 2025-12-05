import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WatermarkProps {
  onUpgrade?: () => void;
}

export const Watermark = ({ onUpgrade }: WatermarkProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <button
        onClick={onUpgrade}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all group"
      >
        <span className="opacity-70">Made with</span>
        <span className="font-medium text-foreground">Conclusiv</span>
        <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </motion.div>
  );
};
