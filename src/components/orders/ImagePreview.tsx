
import React from "react";
import { Image as ImageIcon, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import Image from "@/components/common/Image";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  imageUrls: string[];
  alt: string;
  maxImages?: number;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrls,
  alt,
  maxImages = 3,
  className
}) => {
  const { t } = useTranslation();
  
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-8 w-8 bg-muted/20 rounded", className)}>
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  // Only display up to maxImages
  const visibleImages = imageUrls.slice(0, maxImages);
  const remainingImagesCount = imageUrls.length - maxImages;

  return (
    <div className="flex items-center gap-1">
      {visibleImages.map((url, index) => (
        <div key={index} className="relative">
          <Image 
            src={url} 
            alt={`${alt} ${index + 1}`} 
            className={cn("h-8 w-8 rounded object-cover border border-border", className)} 
          />
        </div>
      ))}
      
      {remainingImagesCount > 0 && (
        <div className="flex items-center justify-center h-8 w-8 rounded bg-muted/30 text-xs font-medium">
          <Plus className="h-3 w-3 mr-0.5" />
          {remainingImagesCount}
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
