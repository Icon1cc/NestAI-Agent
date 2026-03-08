/**
 * Simple logger utility that only logs in development mode
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};
