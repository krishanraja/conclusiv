import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  // Toasts are now disabled - using inline notifications instead
  // This component remains for backwards compatibility
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
