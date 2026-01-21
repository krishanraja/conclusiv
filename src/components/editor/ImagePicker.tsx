import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Search, X, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { PexelsImage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ImagePickerProps {
  sectionTitle: string;
  sectionContent?: string;
  currentImage?: string;
  onSelect: (imageUrl: string | undefined) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImagePicker = ({
  sectionTitle,
  sectionContent,
  currentImage,
  onSelect,
  isOpen,
  onOpenChange,
}: ImagePickerProps) => {
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Extract a smart search query from section content
  const getSmartQuery = useCallback(() => {
    // Extract key terms from title, removing common words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'our', 'your', 'their', 'its', 'my', 'his', 'her', 'we', 'you', 'they', 'it', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how'];
    
    const words = sectionTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Take up to 3 key words for a focused search
    return words.slice(0, 3).join(' ');
  }, [sectionTitle]);

  const searchImages = useCallback(async (query?: string) => {
    const searchTerm = query || getSmartQuery();
    if (!searchTerm) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-images', {
        body: { query: searchTerm, perPage: 8 },
      });
      
      if (error) throw error;
      
      setImages(data.images || []);
      if (data.images?.length === 0) {
        toast({
          title: "No images found",
          description: "Try a different search term",
        });
      }
    } catch (error) {
      console.error('[ImagePicker] Error searching images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error searching images",
        description: errorMessage.includes('API key') 
          ? "Image search is not configured. Please contact support."
          : errorMessage.includes('Rate limit')
          ? "Too many requests. Please wait a moment and try again."
          : "Please try again or use a different search term",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getSmartQuery, toast]);

  // Auto-search when opening
  const handleOpen = useCallback(() => {
    if (!hasSearched && images.length === 0) {
      searchImages();
    }
  }, [hasSearched, images.length, searchImages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchImages(searchQuery.trim());
    }
  };

  const handleSelectImage = (image: PexelsImage) => {
    onSelect(image.url);
    onOpenChange(false);
    // Image visible in section - no toast needed
  };

  const handleRemoveImage = () => {
    onSelect(undefined);
    onOpenChange(false);
    // Image removal visible - no toast needed
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            Add Image to Section
          </DialogTitle>
          <DialogDescription>
            Search for images from Pexels
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search images for "${getSmartQuery()}"...`}
                className="pl-9 h-10 text-sm bg-background"
                aria-label="Image search query"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" disabled={isLoading} className="h-10">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {/* Current image */}
          {currentImage && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <img
                src={currentImage}
                alt="Current"
                className="w-12 h-12 object-cover rounded"
              />
              <span className="text-xs text-muted-foreground flex-1">Current image</span>
              <Button size="sm" variant="ghost" onClick={handleRemoveImage}>
                Remove
              </Button>
            </div>
          )}

          {/* Image grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image) => (
                <motion.button
                  key={image.id}
                  onClick={() => handleSelectImage(image)}
                  className={cn(
                    "relative aspect-video rounded overflow-hidden group",
                    "ring-2 ring-transparent hover:ring-primary/50 transition-all"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    src={image.thumbnailUrl}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-[10px] text-white/80 truncate">
                        {image.photographer}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : hasSearched ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No images found. Try a different search term.
            </p>
          ) : null}

          {/* Pexels attribution */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
            <span>Photos by</span>
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground inline-flex items-center gap-0.5"
            >
              Pexels
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced trigger button for section toolbar
export const ImagePickerTrigger = ({
  hasImage,
  onClick,
}: {
  hasImage: boolean;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
      hasImage 
        ? "text-shimmer-start bg-shimmer-start/10 border-shimmer-start/30 hover:bg-shimmer-start/20" 
        : "text-foreground bg-card border-border/50 hover:border-primary/50 hover:bg-muted/50"
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    title={hasImage ? "Change image" : "Add image to section"}
    aria-label={hasImage ? "Change section image" : "Add image to section"}
  >
    <Image className="w-4 h-4" />
    <span className="text-sm font-medium">{hasImage ? "Change Image" : "Add Image"}</span>
  </motion.button>
);
