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
  hasContent?: boolean;
}

export const DocumentUploadInput = ({
  isExpanded,
  onToggle,
  isLoading,
  fileName,
  onFileSelect,
  onClear,
  hasContent = false,
}: DocumentUploadInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
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

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      onChange={handleFileChange}
      className="hidden"
      id="document-upload"
    />
  );

  // Compact inline success view when file is loaded
  if (fileName && !isLoading) {
    return (
      <div className="w-full">
        {fileInput}
        <div className="flex items-center gap-2 text-sm py-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Check className="w-4 h-4 text-shimmer-start flex-shrink-0" />
            <span className="text-foreground truncate">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-muted-foreground/50 text-xs">|</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors whitespace-nowrap"
          >
            Upload different
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        {fileInput}
        <div className="flex items-center gap-2 text-sm py-1">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Parsing document...</span>
        </div>
      </div>
    );
  }

  // Default expandable view - no file loaded
  return (
    <div className="w-full">
      {fileInput}
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
            <div className="pt-3">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg cursor-pointer",
                  "border-2 border-dashed transition-all duration-300",
                  isDragging 
                    ? "border-shimmer-start bg-shimmer-start/10 scale-[1.02]" 
                    : "border-border/50 bg-card/30 hover:bg-card/50 hover:border-border"
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

                {!isDragging && (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      PDF, Word (.docx), PowerPoint (.pptx)
                    </span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
