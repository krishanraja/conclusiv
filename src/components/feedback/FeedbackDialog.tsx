import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFeedback } from "@/hooks/useFeedback";
import { Loader2, Bug, Lightbulb, MessageSquare } from "lucide-react";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "bug_report" | "feature_request" | "detailed";
  currentStep?: string;
}

const dialogConfig = {
  bug_report: {
    title: "Report an Issue",
    description: "Help us fix problems by describing what went wrong.",
    placeholder: "Describe the issue you encountered. What were you trying to do? What happened instead?",
    icon: Bug,
    iconColor: "text-red-500",
    buttonText: "Submit Bug Report",
  },
  feature_request: {
    title: "Suggest a Feature",
    description: "We'd love to hear your ideas for improving Conclusiv.",
    placeholder: "Describe the feature you'd like to see. How would it help you?",
    icon: Lightbulb,
    iconColor: "text-primary",
    buttonText: "Submit Suggestion",
  },
  detailed: {
    title: "Share Your Feedback",
    description: "Your feedback helps us make Conclusiv better for everyone.",
    placeholder: "Tell us what you think about Conclusiv. What's working well? What could be improved?",
    icon: MessageSquare,
    iconColor: "text-muted-foreground",
    buttonText: "Send Feedback",
  },
};

export const FeedbackDialog = ({
  isOpen,
  onClose,
  type,
  currentStep,
}: FeedbackDialogProps) => {
  const [message, setMessage] = useState("");
  const { isSubmitting, submitBugReport, submitFeatureRequest, submitDetailedFeedback } = useFeedback();
  
  const config = dialogConfig[type];
  const Icon = config.icon;

  const handleSubmit = async () => {
    if (!message.trim()) return;

    const context = { step: currentStep };
    let success = false;

    if (type === "bug_report") {
      success = await submitBugReport(message, context);
    } else if (type === "feature_request") {
      success = await submitFeatureRequest(message, context);
    } else {
      success = await submitDetailedFeedback(message, undefined, context);
    }

    if (success) {
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-accent/50 ${config.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your message</Label>
            <Textarea
              id="feedback-message"
              placeholder={config.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                config.buttonText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
