import { useRef, useState, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Loader2, Check, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadInputProps {
  isExpanded: boolean;
  onToggle: () => void;
  isLoading: boolean;
  fileName: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export const DocumentUploadInput = ({
  isExpanded,
  onToggle,
  isLoading,
  fileName,
  onFileSelect,
  onClear,
}: DocumentUploadInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Upload document</span>
        <span className="text-xs opacity-50">(PDF, Word, PowerPoint)</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleFileChange}
                className="hidden"
                id="document-upload"
              />
              
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg cursor-pointer",
                  "border-2 border-dashed transition-all duration-300",
                  isDragging 
                    ? "border-shimmer-start bg-shimmer-start/10 scale-[1.02]" 
                    : "border-border/50 bg-card hover:bg-card/80 hover:border-border",
                  isLoading && "opacity-50 cursor-not-allowed",
                  fileName && "border-shimmer-start/50"
                )}
              >
                {/* Drag overlay */}
                <AnimatePresence>
                  {isDragging && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-shimmer-start/5 rounded-lg"
                    >
                      <p className="text-shimmer-start font-medium">Drop file here</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Parsing document...</span>
                  </>
                ) : !isDragging && (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      PDF, Word (.docx), PowerPoint (.pptx)
                    </span>
                  </>
                )}
              </div>

              {/* File Preview */}
              <AnimatePresence>
                {fileName && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-shimmer-start/5 border border-shimmer-start/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-shimmer-start" />
                        <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                          {fileName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear();
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Document text extracted successfully
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
