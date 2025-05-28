// src/services/apiService.js

import { logDebug } from '../utils/debugLogger';

// Change it to this to use the Vercel environment variable:
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Service Utility (DRY Principle)
// This utility handles all API calls, ensures consistent headers, and parses our standardized responses.
const apiService = {
  // Base URL for your Laravel API
  //BASE_URL: 'http://api.lms.com/api', // Adjust if your API URL is different
  BASE_URL: ${BASE_URL},//'https://lms-api-production.up.railway.app/api',

  /**
   * Makes an authenticated API request.
   * @param {string} endpoint - The API endpoint (e.g., '/login', '/profile/reset-password').
   * @param {string} method - HTTP method (e.g., 'POST', 'GET', 'PUT').
   * @param {object} [data=null] - Request body data.
   * @param {string} [token=null] - Authorization token.
   * @returns {Promise<object>} - Standardized API response.
   */
  async request(endpoint, method, data = null, token = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : null,
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      const rawJsonResponse = await response.json(); // Capture raw response
      logDebug(`API Service: Raw response for ${endpoint}:`, rawJsonResponse); // DEBUG LOG

      // Our standardized API response format will always have 'success' and either 'data' or 'error'
      // Added robustness: If 'success' key is missing but it's an object and no 'errors' key, assume success.
      if (rawJsonResponse.success !== undefined) { // Check if 'success' key explicitly exists
        if (rawJsonResponse.success) {
          return { success: true, data: rawJsonResponse.data };
        } else {
          // Handle Laravel's default validation errors if they somehow bypass the exception handler
          if (rawJsonResponse.errors) {
              return {
                  success: false,
                  error: {
                      message: rawJsonResponse.message || 'Validation failed',
                      code: 'VALIDATION_ERROR', // Use a generic code for client-side validation issues
                      details: rawJsonResponse.errors // Pass the detailed errors
                  }
              };
          }
          return { success: false, error: rawJsonResponse.error };
        }
      } else if (typeof rawJsonResponse === 'object' && rawJsonResponse !== null && !rawJsonResponse.error && !rawJsonResponse.errors) {
        // If 'success' key is not explicitly defined, but it's a valid object and no error/errors key,
        // assume it's a successful data payload (e.g., /user endpoint directly returning user object)
        return { success: true, data: rawJsonResponse };
      } else {
        // Fallback for unexpected structures, treat as a generic error
        return {
          success: false,
          error: {
            message: rawJsonResponse.message || 'An unexpected API response format was received.',
            code: 'UNEXPECTED_RESPONSE',
            details: rawJsonResponse // Include the raw response for debugging
          }
        };
      }
    } catch (error) {
      console.error('API request failed:', error); // Keep console.error for actual errors
      return {
        success: false,
        error: {
          message: 'Network error or server unreachable.',
          code: 'NETWORK_ERROR',
        },
      };
    }
  },
};

export default apiService;
