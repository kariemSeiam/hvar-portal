import axiosInstance from "./axios";
import logger from "../utils/core/logger";
import { deduplicateRequest } from "../utils/core/request";

const isDuplicatePhoneConflict = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  return status === 409 && code === "duplicate_phone";
};

const getExistingCustomerFromConflict = (error) => {
  if (!isDuplicatePhoneConflict(error)) return null;
  return error?.response?.data?.existing_customer || null;
};

// Customer API endpoints
export const customerAPI = {
  // Create a new customer. Response: backend may return customer object directly or { data: customer }.
  createCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post(
        "/api/customers/",
        customerData
      );
      return response.data;
    } catch (error) {
      logger.error("Error creating customer:", error);
      throw error;
    }
  },

  // Create customer; if duplicate-phone conflict contains existing_customer, return it as deduped match.
  createOrGetCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post("/api/customers/", customerData);
      const customer = response?.data?.data ?? response?.data;
      return { customer, created: true, deduplicated: false };
    } catch (error) {
      const existing = getExistingCustomerFromConflict(error);
      if (existing) {
        return { customer: existing, created: false, deduplicated: true };
      }
      logger.error("Error creating customer:", error);
      throw error;
    }
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    return deduplicateRequest(
      async () => {
        try {
          const response = await axiosInstance.get(`/api/customers/${customerId}`);
          return response.data;
        } catch (error) {
          logger.error("Error getting customer:", error);
          throw error;
        }
      },
      `/api/customers/${customerId}`,
      { customerId },
      { useCache: true, ttl: 120000 }
    );
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    try {
      const response = await axiosInstance.put(
        `/api/customers/${customerId}`,
        customerData
      );
      return response.data;
    } catch (error) {
      logger.error("Error updating customer:", error);
      throw error;
    }
  },

  // Search customers
  searchCustomers: async (query, options = {}) => {
    const params = new URLSearchParams();
    params.append("q", query);
    if (options.type) params.append("type", options.type);
    if (options.limit) params.append("limit", options.limit);
    if (options.offset) params.append("offset", options.offset);
    const url = `/api/customers/search?${params}`;
    return deduplicateRequest(
      async () => {
        try {
          const response = await axiosInstance.get(url);
          return response.data;
        } catch (error) {
          logger.error("Error searching customers:", error);
          throw error;
        }
      },
      "/api/customers/search",
      { q: query, ...options },
      { useCache: true, ttl: 60000 }
    );
  },

  // List customers with pagination
  listCustomers: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit);
    if (options.offset) params.append("offset", options.offset);
    const url = `/api/customers/?${params}`;
    return deduplicateRequest(
      async () => {
        try {
          const response = await axiosInstance.get(url);
          return response.data;
        } catch (error) {
          logger.error("Error listing customers:", error);
          throw error;
        }
      },
      "/api/customers/",
      options,
      { useCache: true, ttl: 60000 }
    );
  },
};

export default customerAPI;
