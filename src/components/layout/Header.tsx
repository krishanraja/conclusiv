import { motion } from "framer-motion";
import conclusivLogo from "@/assets/conclusiv-logo.png";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center">
        <div className="flex items-center">
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-7 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
        </div>
      </div>
    </motion.header>
  );
};