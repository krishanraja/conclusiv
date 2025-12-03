import { motion } from "framer-motion";
import conclusivIcon from "@/assets/conclusiv-icon.png";
import conclusivLogo from "@/assets/conclusiv-logo.png";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* C. Icon */}
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-8 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
          {/* Text Logo */}
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-5 w-auto hidden sm:block"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
        
        <nav className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary">
            Research → Story → Impact
          </span>
        </nav>
      </div>
    </motion.header>
  );
};
