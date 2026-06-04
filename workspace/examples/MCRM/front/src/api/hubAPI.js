/**
 * Hub API
 * Scanning and workflow management endpoints for the Hub
 */

import api from "./axios";
import logger from "../utils/core/logger";
import { deduplicateRequest, invalidateServiceDataCaches } from "../utils/core/request";

const API_URL = "/api/hub";

/**
 * Scan a tracking number or ticket number to get ticket information
 * @param {string} trackingNumber - The tracking number or ticket number to scan
 * @returns {Promise<object>} Ticket context with available actions
 */
export const scanTracking = async (trackingNumber) => {
  const segment = encodeURIComponent(String(trackingNumber).trim());
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(`${API_URL}/scan/${segment}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        logger.error("Error scanning tracking:", error);
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          data: null,
        };
      }
    },
    `${API_URL}/scan/${segment}`,
    { trackingNumber: segment },
    // Hub scan must reflect live ticket state; caching made repeat scans feel stale/slow to update.
    { useCache: false }
  );
};

/**
 * Receive a package (scan inbound)
 * @param {object} data - Receive data
 * @param {string} data.tracking_number - The tracking number
 * @param {number} data.user_id - User ID
 * @param {string} [data.location='HUB'] - Location
 * @param {string} [data.notes] - Notes
 * @returns {Promise<object>} Success result with updated context
 */
export const receivePackage = async (data) => {
  try {
    const response = await api.post(`${API_URL}/scan/receive`, data);
    invalidateServiceDataCaches();
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Error receiving package:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      data: null,
    };
  }
};

/**
 * Dispatch a package (scan outbound)
 * @param {object} data - Dispatch data
 * @param {string} data.tracking_number - The tracking number
 * @param {number} data.user_id - User ID
 * @param {string} [data.destination] - Destination
 * @returns {Promise<object>} Success result with updated context
 */
export const dispatchPackage = async (data) => {
  try {
    const response = await api.post(`${API_URL}/scan/dispatch`, data);
    invalidateServiceDataCaches();
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Error dispatching package:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      data: null,
    };
  }
};

/**
 * Get workshop queue (tickets in IN_PROCESS status for maintenance)
 * @returns {Promise<object>} List of workshop tickets
 */
export const getWorkshopQueue = async () => {
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(`${API_URL}/queues/workshop`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        logger.error("Error getting workshop queue:", error);
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          data: null,
        };
      }
    },
    `${API_URL}/queues/workshop`,
    {},
    { useCache: true, ttl: 15000 }
  );
};

/**
 * Get pending dispatch queue (tickets ready to be sent)
 * @returns {Promise<object>} List of tickets ready for dispatch
 */
export const getPendingDispatchQueue = async () => {
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(`${API_URL}/queues/pending-dispatch`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        logger.error("Error getting pending dispatch queue:", error);
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          data: null,
        };
      }
    },
    `${API_URL}/queues/pending-dispatch`,
    {},
    { useCache: true, ttl: 15000 }
  );
};

export default {
  scanTracking,
  receivePackage,
  dispatchPackage,
  getWorkshopQueue,
  getPendingDispatchQueue,
};
