import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, MoreHorizontal, X, FileText, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MobileBottomBarProps {
  onFeedbackClick: () => void;
}

export const MobileBottomBar = ({ onFeedbackClick }: MobileBottomBarProps) => {
  const [isLinksOpen, setIsLinksOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Safe area spacer */}
      <div 
        className="bg-background/80 backdrop-blur-lg border-t border-border/30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Feedback button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFeedbackClick}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Feedback</span>
          </Button>

          {/* More links */}
          <Drawer open={isLinksOpen} onOpenChange={setIsLinksOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="text-xs">More</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-4">
                  © {new Date().getFullYear()} Mindmaker LLC
                </p>
                
                <Link
                  to="/terms"
                  onClick={() => setIsLinksOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Terms of Service</span>
                </Link>
                
                <Link
                  to="/privacy"
                  onClick={() => setIsLinksOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Privacy Policy</span>
                </Link>
                
                <Link
                  to="/contact"
                  onClick={() => setIsLinksOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Contact Us</span>
                </Link>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
};