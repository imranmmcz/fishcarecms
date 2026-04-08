import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  quality?: number;
  /** Show blur-up placeholder while loading */
  blurPlaceholder?: boolean;
}

/**
 * Optimized image component with:
 * - Native lazy loading
 * - Intersection Observer for deferred loading
 * - Error fallback
 * - Blur-up placeholder effect
 * - Supabase storage transform support (resize/quality)
 */
export function OptimizedImage({
  src,
  fallbackSrc = "/placeholder.svg",
  width,
  height,
  quality = 75,
  blurPlaceholder = true,
  className,
  alt = "",
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build optimized URL for Supabase storage images
  const optimizedSrc = (() => {
    if (!src || error) return fallbackSrc;
    
    // If it's a Supabase storage URL, add transform params
    if (src.includes("supabase") && src.includes("/storage/")) {
      const url = new URL(src);
      if (width) url.searchParams.set("width", String(width));
      if (height) url.searchParams.set("height", String(height));
      url.searchParams.set("quality", String(quality));
      return url.toString();
    }
    
    return src;
  })();

  return (
    <img
      ref={imgRef}
      src={isVisible ? optimizedSrc : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => {
        setError(true);
        setLoaded(true);
      }}
      className={cn(
        "transition-opacity duration-300",
        blurPlaceholder && !loaded && "opacity-0",
        blurPlaceholder && loaded && "opacity-100",
        className
      )}
      {...props}
    />
  );
}
