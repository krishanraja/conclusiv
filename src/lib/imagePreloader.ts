import conclusivIcon from "@/assets/conclusiv-icon.png";
import conclusivLogo from "@/assets/conclusiv-logo.png";

// Preload critical images at module parse time (before React renders)
const preloadedImages: Record<string, HTMLImageElement> = {};

function preloadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

// Preload both images immediately
preloadedImages.conclusivIcon = preloadImage(conclusivIcon);
preloadedImages.conclusivLogo = preloadImage(conclusivLogo);

export const criticalImages = {
  conclusivIcon,
  conclusivLogo,
} as const;

export function isImageReady(key: keyof typeof criticalImages): boolean {
  return preloadedImages[key]?.complete ?? false;
}

export function onImageReady(
  key: keyof typeof criticalImages,
  callback: () => void
): () => void {
  const img = preloadedImages[key];
  
  if (!img) {
    callback();
    return () => {};
  }
  
  if (img.complete) {
    callback();
    return () => {};
  }
  
  img.addEventListener("load", callback);
  return () => img.removeEventListener("load", callback);
}
