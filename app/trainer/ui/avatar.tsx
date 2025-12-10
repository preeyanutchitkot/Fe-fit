import React from "react";
import { ReactNode, ImgHTMLAttributes } from "react";

type AvatarProps = {
  className?: string;
  children?: ReactNode;
};

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

type AvatarFallbackProps = {
  children?: ReactNode;
  className?: string;
};

export function Avatar({ className = "", children }: AvatarProps) {
  return <span className={`inline-block rounded-full overflow-hidden bg-gray-200 ${className}`}>{children}</span>;
}
export function AvatarImage({ src, alt, className = "", ...props }: AvatarImageProps) {
  return <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} {...props} />;
}
export function AvatarFallback({ children, className = "" }: AvatarFallbackProps) {
  return <span className={`flex items-center justify-center w-full h-full bg-gray-200 ${className}`}>{children}</span>;
}
