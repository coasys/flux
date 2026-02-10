/**
 * Centralized breakpoint constants for responsive design
 * 
 * IMPORTANT: Keep this value in sync with src/styles/breakpoints.scss
 * 
 * - This file is for JavaScript/TypeScript logic (computed properties, conditions, etc.)
 * - The SCSS file is auto-imported for CSS media queries
 */

export const BREAKPOINTS = {
  /** Mobile breakpoint - devices below this width are considered mobile */
  MOBILE: 950,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;
