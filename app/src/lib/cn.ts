import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional classes plus Tailwind conflict resolution.
 *
 * `clsx` handles the truthiness; the merge pass means a caller can pass
 * `px-4` and be overridden by `px-8` in a later string without needing
 * `!px-8`, which is what keeps the className props on components honest.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
