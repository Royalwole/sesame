import Image from "next/image";
import { useState } from "react";
import { getImageUrl, handleImageError } from "../../lib/image-utils";

const ListingImage = ({
  src,
  alt = "Property image",
  width = 800,
  height = 600,
  priority = false,
  className = "",
}) => {
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Primary fallback image
  const fallbackSrc = "/images/placeholder-property.svg";

  // Use our enhanced image utility to get the best available URL
  // This will check Vercel Blob if the local file doesn't exist
  const imageSrc = getImageUrl(src, fallbackSrc);

  // Generate a key to help React with re-rendering
  const imageKey = `image-${src}-${width}-${height}`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Use Next.js Image for optimization */}
      <Image
        key={imageKey}
        src={hasError ? fallbackSrc : imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={80}
        className={`
          duration-700 ease-in-out
          ${isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"}
          ${className}
        `}
        onLoadingComplete={() => setLoading(false)}
        onError={(event) => {
          // Use our enhanced error handler which provides better fallbacks
          handleImageError(event, true); // true = use SVG fallback
          setHasError(true);
          setLoading(false);
        }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse flex space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add display name for better debugging
ListingImage.displayName = "ListingImage";

export default ListingImage;
