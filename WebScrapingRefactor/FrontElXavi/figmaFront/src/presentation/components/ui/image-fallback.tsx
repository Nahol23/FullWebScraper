import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "../../components/ui/utils"; // O il tuo percorso per 'cn' (es. lib/utils)

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export function ImageFallback({ 
  src, 
  alt, 
  className, 
  fallbackClassName,
  ...props 
}: ImageFallbackProps) {
  const [error, setError] = useState(false);

  // Se l'immagine si rompe (o src è vuoto), mostra questo
  if (error || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-800 text-zinc-500 rounded-md",
          className, // Mantiene le dimensioni che avevi impostato per l'immagine
          fallbackClassName
        )}
        title={alt || "Image not available"}
      >
        <ImageOff className="h-6 w-6 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
      {...props}
    />
  );
}