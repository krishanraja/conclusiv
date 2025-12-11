import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Search, X, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      console.error('Error searching images:', error);
      toast({
        title: "Error searching images",
        description: "Please try again",
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
    toast({
      title: "Image added",
      description: `Photo by ${image.photographer}`,
    });
  };

  const handleRemoveImage = () => {
    onSelect(undefined);
    onOpenChange(false);
    toast({
      title: "Image removed",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          onAnimationComplete={handleOpen}
        >
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search images for "${getSmartQuery()}"...`}
                  className="pl-9 h-9 text-sm bg-background/50"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>

            {/* Current image */}
            {currentImage && (
              <div className="mb-3 flex items-center gap-2">
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
              <div className="flex items-center justify-center py-8">
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
              <p className="text-center text-sm text-muted-foreground py-4">
                No images found. Try a different search term.
              </p>
            ) : null}

            {/* Pexels attribution */}
            <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple trigger button for inline use
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
      "p-1.5 rounded-md transition-colors",
      hasImage 
        ? "text-shimmer-start bg-shimmer-start/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-card"
    )}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    title={hasImage ? "Change image" : "Add image"}
  >
    <Image className="w-4 h-4" />
  </motion.button>
);
