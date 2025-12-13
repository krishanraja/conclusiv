import { motion } from "framer-motion";
import conclusivLogo from "@/assets/conclusiv-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onAnimationComplete={() => {
        // Trigger complete after the full animation sequence
        setTimeout(onComplete, 2000);
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      {/* Logo container with loading ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full bg-primary/10 blur-xl"
        />
        
        {/* Loading ring */}
        <svg
          className="absolute w-28 h-28"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            opacity="0.3"
          />
          
          {/* Animated progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1, rotate: -90 }}
            transition={{ 
              duration: 1.8, 
              ease: "easeInOut",
            }}
            style={{ 
              transformOrigin: "center",
              filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))"
            }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
              <stop offset="50%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.34, 1.56, 0.64, 1], // Spring-like
            delay: 0.2 
          }}
          className="relative z-10"
        >
          <img 
            src={conclusivLogo} 
            alt="Conclusiv" 
            className="w-16 h-16 object-contain"
          />
        </motion.div>
      </div>
      
      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-1/3 flex flex-col items-center gap-2"
      >
        <span className="text-xl font-semibold tracking-wide text-foreground">
          conclusiv
        </span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Crafting your narrative
        </span>
      </motion.div>
    </motion.div>
  );
};
