import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NarrativeSchema } from "@/lib/types";
import { iconMap } from "@/lib/icons";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { CollaborativeComments } from "@/components/share/CollaborativeComments";

const Share = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [narrative, setNarrative] = useState<NarrativeSchema | null>(null);
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Password protection
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Analytics tracking
  const { trackSectionView } = useAnalyticsTracker({
    shareId: shareId || "",
    narrativeId: narrativeId || undefined,
    sectionCount: narrative?.sections.length || 0,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!narrative || !isUnlocked) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [narrative, currentIndex, isUnlocked]);

  useEffect(() => {
    const fetchNarrative = async () => {
      if (!shareId) {
        setError("No share ID provided");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("narratives")
        .select("*")
        .eq("share_id", shareId)
        .eq("is_public", true)
        .single();

      if (fetchError || !data) {
        setError("Narrative not found or not public");
        setLoading(false);
        return;
      }

      // Check if password protected
      if (data.share_password) {
        setIsPasswordProtected(true);
        setNarrativeId(data.id);
        setTitle(data.title || "Shared Narrative");
      } else {
        setNarrative(data.narrative_data as unknown as NarrativeSchema);
        setNarrativeId(data.id);
        setTitle(data.title || "Shared Narrative");
        setIsUnlocked(true);
      }
      
      setLoading(false);
    };

    fetchNarrative();
  }, [shareId]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from("narratives")
      .select("narrative_data, share_password")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      setPasswordError(true);
      return;
    }

    if (data.share_password === passwordInput) {
      setNarrative(data.narrative_data as unknown as NarrativeSchema);
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    trackSectionView(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min((narrative?.sections.length || 1) - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    trackSectionView(newIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-shimmer-start border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading narrative...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  // Password gate
  if (isPasswordProtected && !isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm">This narrative is password protected</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-xs space-y-4">
          <Input
            type="password"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setPasswordError(false);
            }}
            placeholder="Enter password"
            className={passwordError ? "border-destructive" : ""}
          />
          {passwordError && (
            <p className="text-destructive text-xs">Incorrect password</p>
          )}
          <Button type="submit" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            View Narrative
          </Button>
        </form>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          Back to Conclusiv
        </Link>
      </div>
    );
  }

  if (!narrative) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Narrative not found</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const currentSection = narrative.sections[currentIndex];
  const IconComponent = iconMap[currentSection?.icon] || Play;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Conclusiv
          </Link>
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="text-xs text-muted-foreground">
            {currentIndex + 1} / {narrative.sections.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 min-h-[400px]"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-shimmer-start/20 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-shimmer-start" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Section {currentIndex + 1}</span>
              <h2 className="text-xl md:text-2xl font-semibold">{currentSection.title}</h2>
            </div>
          </div>

          {currentSection.content && (
            <p className="text-muted-foreground mb-6 text-base md:text-lg leading-relaxed">
              {currentSection.content}
            </p>
          )}

          {currentSection.items && currentSection.items.length > 0 && (
            <ul className="space-y-3">
              {currentSection.items.map((item, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-shimmer-start mt-2.5 flex-shrink-0" />
                  <span className="text-foreground/80">{item}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-1">
            {narrative.sections.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  trackSectionView(idx);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-shimmer-start" : "bg-border"
                }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={currentIndex === narrative.sections.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Comments Section */}
        {narrativeId && (
          <div className="mt-8">
            <CollaborativeComments 
              narrativeId={narrativeId}
              sectionId={currentSection.id}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          Created with{" "}
          <Link to="/" className="text-shimmer-start hover:underline">
            Conclusiv
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Share;