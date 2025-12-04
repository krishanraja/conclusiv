import { motion } from "framer-motion";
import conclusivIcon from "@/assets/conclusiv-icon.png";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center">
        <div className="flex items-center gap-3">
          {/* C. Icon only in header */}
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-10 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
      </div>
    </motion.header>
  );
};