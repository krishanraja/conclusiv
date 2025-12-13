import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote, Edit2, Save, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons";

interface PresenterNotesProps {
  narrativeId?: string;
  isPresenting?: boolean;
}

export const PresenterNotes = ({ narrativeId, isPresenting = false }: PresenterNotesProps) => {
  const { narrative, currentSectionIndex, nextSection, prevSection } = useNarrativeStore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const currentSection = narrative?.sections[currentSectionIndex];

  // Timer for presentations
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Load notes on mount
  useEffect(() => {
    if (!narrativeId || !user) return;
    
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("presenter_notes")
        .select("section_id, notes")
        .eq("narrative_id", narrativeId);
      
      if (!error && data) {
        const notesMap: Record<string, string> = {};
        data.forEach(row => {
          notesMap[row.section_id] = row.notes;
        });
        setNotes(notesMap);
      }
    };
    
    loadNotes();
  }, [narrativeId, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = (sectionId: string) => {
    setEditingSection(sectionId);
    setDraftNote(notes[sectionId] || "");
  };

  const handleSave = async () => {
    if (!narrativeId || !editingSection || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("presenter_notes")
        .upsert({
          narrative_id: narrativeId,
          section_id: editingSection,
          notes: draftNote,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'narrative_id,section_id'
        });

      if (error) throw error;

      setNotes(prev => ({ ...prev, [editingSection]: draftNote }));
      setEditingSection(null);
      // Notes saved - inline UI update is sufficient feedback
    } catch (err) {
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setDraftNote("");
  };

  if (!narrative) return null;

  // Presenting mode - split screen view
  if (isPresenting && currentSection) {
    const Icon = iconMap[currentSection.icon] || StickyNote;
    const currentNotes = notes[currentSection.id] || "";
    
    return (
      <div className="fixed inset-0 bg-background z-50 flex">
        {/* Left side - Slide preview */}
        <div className="flex-1 flex flex-col p-8 border-r border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={cn(
                "font-mono text-lg",
                elapsedTime > 300 ? "text-orange-400" : "text-foreground"
              )}>
                {formatTime(elapsedTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? "Pause" : "Start"} Timer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setElapsedTime(0)}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground mb-2">
              Slide {currentSectionIndex + 1} of {narrative.sections.length}
            </span>
            <h1 className="text-3xl font-bold mb-4 text-center">{currentSection.title}</h1>
            {currentSection.content && (
              <p className="text-muted-foreground text-center max-w-lg">
                {currentSection.content}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex gap-1">
              {narrative.sections.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentSectionIndex ? "bg-primary" : "bg-border"
                  )}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={nextSection}
              disabled={currentSectionIndex === narrative.sections.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Right side - Notes */}
        <div className="w-96 flex flex-col p-6 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Speaker Notes
            </h2>
            {!editingSection && currentNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(currentSection.id)}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {editingSection === currentSection.id ? (
            <div className="flex-1 flex flex-col">
              <Textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Add your speaker notes here..."
                className="flex-1 resize-none min-h-[200px]"
              />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" onClick={handleCancel} size="sm">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : currentNotes ? (
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {currentNotes}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <StickyNote className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm text-center mb-3">No notes for this slide</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(currentSection.id)}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Add Notes
              </Button>
            </div>
          )}

          {/* Next slide preview */}
          {currentSectionIndex < narrative.sections.length - 1 && (
            <div className="mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground uppercase mb-2 block">
                Up Next
              </span>
              <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                <p className="text-sm font-medium">
                  {narrative.sections[currentSectionIndex + 1].title}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode - list of all sections with notes
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          Presenter Notes
        </h3>
        <span className="text-xs text-muted-foreground">
          {Object.keys(notes).filter(k => notes[k]).length} / {narrative.sections.length} slides
        </span>
      </div>

      <div className="space-y-2">
        {narrative.sections.map((section, index) => {
          const Icon = iconMap[section.icon] || StickyNote;
          const hasNotes = !!notes[section.id];
          const isEditing = editingSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isEditing 
                  ? "bg-primary/5 border-primary/30"
                  : hasNotes
                  ? "bg-muted/30 border-border/50"
                  : "bg-muted/10 border-border/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{section.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      Slide {index + 1}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        <Textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="Add your speaker notes..."
                          className="min-h-[80px] resize-none text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSave} disabled={isSaving} size="sm">
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button variant="ghost" onClick={handleCancel} size="sm">
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : hasNotes ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notes[section.id]}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleEdit(section.id)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => handleEdit(section.id)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Add notes
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};