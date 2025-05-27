// src/utils/validation.js

/**
 * Checks if a value is required (not null, undefined, or empty string after trimming).
 * @param {any} value - The value to validate.
 * @param {string} [message='This field is required.'] - The error message if validation fails.
 * @returns {string | undefined} - Error message if invalid, otherwise undefined.
 */
export const isRequired = (value, message = 'This field is required.') => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return message;
    }
    return undefined;
  };
  
  /**
   * Checks if a value is a valid email format.
   * @param {string} value - The email string to validate.
   * @param {string} [message='Invalid email format.'] - The error message if validation fails.
   * @returns {string | undefined} - Error message if invalid, otherwise undefined.
   */
  export const isValidEmail = (value, message = 'Invalid email format.') => {
    // This regex is a common compromise for client-side email validation.
    // For strict validation, server-side checks are always necessary.
    if (value && !/\S+@\S+\.\S+/.test(value)) {
      return message;
    }
    return undefined;
  };
  
  /**
   * Checks if a value meets a minimum length requirement.
   * @param {string} value - The string to validate.
   * @param {number} minLength - The minimum required length.
   * @param {string} [message] - The error message if validation fails.
   * @returns {string | undefined} - Error message if invalid, otherwise undefined.
   */
  export const hasMinLength = (value, minLength, message = `Must be at least ${minLength} characters.`) => {
    if (value && String(value).length < minLength) {
      return message;
    }
    return undefined;
  };
  
  /**
   * Checks if two values match. Useful for password confirmation.
   * @param {any} value - The first value.
   * @param {any} otherValue - The second value to compare against.
   * @param {string} [message='Values do not match.'] - The error message if validation fails.
   * @returns {string | undefined} - Error message if invalid, otherwise undefined.
   */
  export const isMatching = (value, otherValue, message = 'Values do not match.') => {
    if (value !== otherValue) {
      return message;
    }
    return undefined;
  };
  
  /**
   * Checks if a value is a number of a specific fixed length.
   * Useful for OTPs.
   * @param {string} value - The string to validate.
   * @param {number} length - The required fixed length.
   * @param {string} [message] - The error message if validation fails.
   * @returns {string | undefined} - Error message if invalid, otherwise undefined.
   */
  export const isNumericAndLength = (value, length, message = `Must be a ${length}-digit number.`) => {
    if (value && (!/^\d+$/.test(value) || String(value).length !== length)) {
      return message;
    }
    return undefined;
  };
  
  /**
   * Checks if a value is NOT the same as another value.
   * Useful for ensuring new password is not the same as current password.
   * @param {any} value - The value to check.
   * @param {any} otherValue - The value to compare against.
   * @param {string} [message='Cannot be the same as the current value.'] - The error message if validation fails.
   * @returns {string | undefined} - Error message if invalid, otherwise undefined.
   */
  export const isNotSameAs = (value, otherValue, message = 'Cannot be the same as the current value.') => {
    if (value === otherValue) {
      return message;
    }
    return undefined;
  };
  
  /**
   * Validates a single field against an array of validation rules.
   * Each rule should be a function that takes a value and returns an error message (string) or undefined.
   * The function stops at the first rule that returns an error.
   * @param {any} value - The value to validate.
   * @param {Array<Function>} rules - An array of validation functions (e.g., [isRequired, isValidEmail]).
   * @returns {string | undefined} - The first error message found, or undefined if all rules pass.
   */
  export const validate = (value, rules) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return undefined;
  };
  
  // Optional: Password complexity rules (can be added if needed for SignupForm)
  export const hasUppercase = (value, message = 'Must contain at least one uppercase letter.') => {
    if (value && !/[A-Z]/.test(value)) {
      return message;
    }
    return undefined;
  };
  
  export const hasLowercase = (value, message = 'Must contain at least one lowercase letter.') => {
    if (value && !/[a-z]/.test(value)) {
      return message;
    }
    return undefined;
  };
  
  export const hasNumber = (value, message = 'Must contain at least one number.') => {
    if (value && !/\d/.test(value)) {
      return message;
    }
    return undefined;
  };
  
  export const hasSymbol = (value, message = 'Must contain at least one symbol.') => {
    // This regex matches any character that is not a letter, number, or whitespace.
    if (value && !/[^a-zA-Z0-9\s]/.test(value)) {
      return message;
    }
    return undefined;
  };
  