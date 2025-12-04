import { useRef } from "react";
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

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span>Upload PDF</span>
        <span className="text-xs opacity-50">(optional)</span>
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
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="document-upload"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md",
                  "bg-card border border-border/50 text-muted-foreground",
                  "hover:bg-card/80 hover:border-border hover:text-foreground",
                  "transition-all duration-200",
                  isLoading && "opacity-50 cursor-not-allowed",
                  fileName && "border-shimmer-start/50"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing document...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose PDF file</span>
                  </>
                )}
              </button>

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
                        onClick={onClear}
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