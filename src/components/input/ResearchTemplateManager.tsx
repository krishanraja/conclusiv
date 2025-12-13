import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BookmarkPlus, FolderOpen, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResearchTemplate {
  id: string;
  name: string;
  decision_type: string;
  industry: string | null;
  primary_question_template: string | null;
  known_concerns_template: string | null;
  success_criteria_template: string | null;
  red_flags_template: string | null;
  audience: string | null;
}

interface QualificationData {
  companyName: string;
  websiteUrl: string;
  industry: string;
  primaryQuestion: string;
  knownConcerns: string;
  successCriteria: string;
  redFlags: string;
}

interface ResearchTemplateManagerProps {
  userId: string | null;
  decisionType: string;
  audience: string;
  qualification: QualificationData;
  onLoadTemplate: (template: Partial<QualificationData> & { audience?: string }) => void;
}

export const ResearchTemplateManager = ({
  userId,
  decisionType,
  audience,
  qualification,
  onLoadTemplate,
}: ResearchTemplateManagerProps) => {
  const [templates, setTemplates] = useState<ResearchTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchTemplates();
    }
  }, [userId, decisionType]);

  const fetchTemplates = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!userId || !templateName.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('research_templates')
        .insert({
          user_id: userId,
          name: templateName.trim(),
          decision_type: decisionType,
          industry: qualification.industry || null,
          primary_question_template: qualification.primaryQuestion || null,
          known_concerns_template: qualification.knownConcerns || null,
          success_criteria_template: qualification.successCriteria || null,
          red_flags_template: qualification.redFlags || null,
          audience: audience || null,
        });

      if (error) throw error;

      // Dialog closes indicating success - no toast needed
      setShowSaveDialog(false);
      setTemplateName("");
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      toast({
        title: "Failed to save template",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (template: ResearchTemplate) => {
    onLoadTemplate({
      industry: template.industry || "",
      primaryQuestion: template.primary_question_template || "",
      knownConcerns: template.known_concerns_template || "",
      successCriteria: template.success_criteria_template || "",
      redFlags: template.red_flags_template || "",
      audience: template.audience || "",
    });
    // Fields populated indicating success - no toast needed
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    try {
      const { error } = await supabase
        .from('research_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      // Template disappears from list indicating success - no toast needed
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: "Failed to delete template",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!userId) return null;

  const relevantTemplates = templates.filter(t => 
    t.decision_type === decisionType || templates.length <= 5
  );

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Load Template Dropdown */}
        {templates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Load Template</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  {relevantTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      className="flex items-center justify-between group"
                    >
                      <button
                        onClick={() => loadTemplate(template)}
                        className="flex-1 text-left"
                      >
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {template.decision_type}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id, template.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  {relevantTemplates.length === 0 && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No templates for this decision type
                    </div>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Save Template Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowSaveDialog(true)}
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save as Template</span>
        </Button>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current research pattern to reuse for similar decisions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="template-name"
                placeholder="e.g., Partner Due Diligence"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && templateName.trim()) {
                    saveTemplate();
                  }
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>This template will save:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>Decision type: {decisionType}</li>
                {qualification.industry && <li>Industry: {qualification.industry}</li>}
                {qualification.primaryQuestion && <li>Primary question structure</li>}
                {qualification.successCriteria && <li>Success criteria</li>}
                {qualification.redFlags && <li>Red flags to watch</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveTemplate} 
              disabled={!templateName.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
