"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * User avatar that reliably shows external images (e.g. Clerk, Prisma imageUrl).
 * Uses a plain img with referrerPolicy so external URLs load; only shows fallback when
 * there is no src or the image fails to load (avoids Radix Avatar's internal preload issue).
 */
export function UserAvatar({
  src,
  alt,
  fallback,
  className,
  imgClassName,
  ...props
}: {
  src: string | null | undefined;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  imgClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [error, setError] = React.useState(false);
  const effectiveSrc = src && !error ? src : null;

  // Reset error when src changes so we retry loading
  React.useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full aspect-square size-8",
        className,
      )}
      {...props}
    >
      {effectiveSrc ? (
        <img
          src={effectiveSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={cn("aspect-square size-full object-cover", imgClassName)}
          onError={() => setError(true)}
        />
      ) : (
        <span
          className={cn(
            "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium",
          )}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}
