type ContentImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: () => void;
};

export function ContentImage({ src, alt, className, width, height, priority = false, onError }: ContentImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={onError}
    />
  );
}
