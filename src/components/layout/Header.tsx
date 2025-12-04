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
      <div className="container mx-auto px-6 h-20 flex items-center">
        <div className="flex items-center gap-4">
          {/* C. Icon - Large and commanding */}
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-12 md:h-14 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
          {/* Text Logo - Large and commanding */}
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-8 md:h-10 w-auto hidden sm:block"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
      </div>
    </motion.header>
  );
};
