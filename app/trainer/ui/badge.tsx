import React, { ReactNode } from "react";

type BadgeProps = {
  className?: string;
  children?: ReactNode;
};

export function Badge({ className = "", children }: BadgeProps) {
  return <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${className}`}>{children}</span>;
}
