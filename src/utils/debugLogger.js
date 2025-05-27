// src/utils/debugLogger.js

// Debugging Flag: Set to true for development to enable console logs, false for production.
export const DEBUG_MODE = false;

/**
 * Custom logging function that outputs to console only when DEBUG_MODE is true.
 * @param {...any} args - Arguments to be logged.
 */
export const logDebug = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};
