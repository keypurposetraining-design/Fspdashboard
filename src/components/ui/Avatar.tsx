// src/components/ui/Avatar.tsx
import React from "react";
import Image from "next/image";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Avatar.displayName = "Avatar";

export interface AvatarImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height' | 'src' | 'alt'> {
  src: string;
  alt: string;
  className?: string;
}

export const AvatarImage = ({ src, alt, className = "", ...props }: AvatarImageProps) => (
  <Image
    src={src}
    alt={alt}
    width={40}
    height={40}
    className={`aspect-square h-full w-full object-cover ${className}`}
    {...props}
  />
);

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-300 text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
AvatarFallback.displayName = "AvatarFallback";
