import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer 
      className="border-t border-border/30 py-4 px-4 sm:px-6 mt-auto"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-muted-foreground">
        <p className="text-center sm:text-left">© {new Date().getFullYear()} Mindmaker LLC. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link to="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link to="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};
