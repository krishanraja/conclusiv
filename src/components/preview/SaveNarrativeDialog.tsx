import { useState } from "react";
import { motion } from "framer-motion";
import { Save, FilePlus, RefreshCw, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { buildNarrative } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SaveNarrativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SaveNarrativeDialog = ({ open, onOpenChange }: SaveNarrativeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildProgress, setRebuildProgress] = useState(0);
  
  const {
    rawText,
    businessContext,
    audienceMode,
    duration,
    includeTensionSlide,
    selectedArchetype,
    themes,
    narrative,
    currentNarrativeId,
    setNarrative,
    setThemes,
    setSelectedTemplate,
    setCurrentNarrativeId,
    snapshotSettings,
  } = useNarrativeStore();

  const handleRebuild = async (saveAsNew: boolean) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your narrative.",
        variant: "destructive",
      });
      return;
    }

    setIsRebuilding(true);
    setRebuildProgress(0);

    try {
      // Get selected story pillars (kept themes)
      const keptThemes = themes.filter(t => t.keep).map(t => t.name);
      
      const handleProgress = (_stage: number, progress: number) => {
        setRebuildProgress(progress);
      };

      // Rebuild the narrative with current Quick Adjustment settings
      const result = await buildNarrative(
        rawText,
        businessContext,
        handleProgress,
        {
          audienceMode: audienceMode || undefined,
          archetype: selectedArchetype || undefined,
          duration,
          includeTensionSlide,
          storyPillars: keptThemes.length > 0 ? keptThemes : undefined,
        }
      );

      if (result.error) {
        toast({
          title: "Rebuild failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Update the narrative in store
      if (result.narrative) {
        setNarrative(result.narrative);
      }
      if (result.themes) {
        setThemes(result.themes);
      }
      if (result.recommendedTemplate) {
        setSelectedTemplate(result.recommendedTemplate);
      }

      // Save to database
      const title = businessContext?.companyName || narrative?.sections?.[0]?.title || 'Untitled Narrative';
      const narrativeData = JSON.parse(JSON.stringify(result.narrative || narrative));

      if (saveAsNew || !currentNarrativeId) {
        // Create new narrative
        const { data: insertData, error: insertError } = await supabase
          .from("narratives")
          .insert([{
            user_id: user.id,
            narrative_data: narrativeData,
            title,
            is_public: false,
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        
        if (insertData?.id) {
          setCurrentNarrativeId(insertData.id);
        }
        
        toast({
          title: "Saved as new",
          description: "Your narrative has been rebuilt and saved.",
        });
      } else {
        // Update existing narrative
        const { error: updateError } = await supabase
          .from("narratives")
          .update({
            narrative_data: narrativeData,
            title,
          })
          .eq('id', currentNarrativeId);

        if (updateError) throw updateError;
        
        toast({
          title: "Narrative updated",
          description: "Your changes have been saved.",
        });
      }

      // Snapshot the new settings as the baseline
      snapshotSettings();
      
      onOpenChange(false);
    } catch (err) {
      console.error("Save/rebuild error:", err);
      toast({
        title: "Save failed",
        description: "There was an error saving your narrative.",
        variant: "destructive",
      });
    } finally {
      setIsRebuilding(false);
      setRebuildProgress(0);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-shimmer-start" />
            Save Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your Quick Adjustments will be applied and the narrative will be regenerated with the new settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRebuilding ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-shimmer-start" />
              <span className="text-sm text-muted-foreground">
                Rebuilding narrative...
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-shimmer-start to-shimmer-end"
                initial={{ width: 0 }}
                animate={{ width: `${rebuildProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {rebuildProgress < 30 && "Analyzing your content..."}
              {rebuildProgress >= 30 && rebuildProgress < 60 && "Applying audience adjustments..."}
              {rebuildProgress >= 60 && rebuildProgress < 90 && "Generating sections..."}
              {rebuildProgress >= 90 && "Finalizing..."}
            </p>
          </div>
        ) : (
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {currentNarrativeId && (
              <Button
                variant="outline"
                onClick={() => handleRebuild(false)}
                className="w-full sm:w-auto gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Overwrite Current
              </Button>
            )}
            
            <Button
              onClick={() => handleRebuild(true)}
              className="w-full sm:w-auto gap-2 bg-shimmer-start hover:bg-shimmer-start/90 text-background"
            >
              <FilePlus className="w-4 h-4" />
              Save as New
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

