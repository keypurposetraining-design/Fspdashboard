// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility to merge Tailwind class names conditionally. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
