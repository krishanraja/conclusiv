import { useState, useRef, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Camera, Image, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CompanyLogoUploadProps {
  currentLogoUrl?: string;
  brandfetchLogoUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  compact?: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const CompanyLogoUpload = ({
  currentLogoUrl,
  brandfetchLogoUrl,
  onUpload,
  onRemove,
  compact = false,
}: CompanyLogoUploadProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Priority: user uploaded > brandfetch
  const displayUrl = currentLogoUrl || brandfetchLogoUrl;
  const isUserUploaded = !!currentLogoUrl;

  const handleFileSelect = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, SVG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to save your logo for future sessions.",
      });
      // Still show preview but don't upload
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete existing logo first
      await supabase.storage.from('company-logos').remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.svg`, `${user.id}/logo.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Add cache buster
      const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      // Update profile
      await supabase
        .from('profiles')
        .update({ company_logo_url: finalUrl })
        .eq('id', user.id);

      onUpload(finalUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Logo uploaded",
        description: "Your logo has been saved.",
      });
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (user && currentLogoUrl) {
      await supabase
        .from('profiles')
        .update({ company_logo_url: null })
        .eq('id', user.id);
    }
    setPreviewUrl(null);
    onRemove();
  };

  // Compact mode - small circle with logo or upload icon
  if (compact && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="relative w-10 h-10 rounded-full border border-border/50 bg-card/50 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors"
      >
        {displayUrl || previewUrl ? (
          <img
            src={previewUrl || displayUrl}
            alt="Company logo"
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <Camera className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-3"
      >
        {/* Close button in expanded mode */}
        {compact && isExpanded && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Current logo preview */}
        {(displayUrl || previewUrl) && (
          <div className="flex items-center gap-3 p-2 bg-card/30 rounded-lg">
            <div className="w-12 h-12 rounded-lg border border-border/50 flex items-center justify-center overflow-hidden bg-background">
              <img
                src={previewUrl || displayUrl}
                alt="Company logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {isUserUploaded ? "Your uploaded logo" : "Auto-detected logo"}
              </p>
              {!isUserUploaded && brandfetchLogoUrl && (
                <p className="text-[10px] text-muted-foreground/50">
                  from brand data
                </p>
              )}
            </div>
            {isUserUploaded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            )}
          </div>
        )}

        {/* Upload area */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50 hover:bg-card/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {displayUrl ? "Upload different logo" : "Upload your logo"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  PNG, JPG, SVG, WebP · Max 2MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sign in prompt for unauthenticated users */}
        {!user && (
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <LogIn className="w-3 h-3" />
            Sign in to save your logo
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};