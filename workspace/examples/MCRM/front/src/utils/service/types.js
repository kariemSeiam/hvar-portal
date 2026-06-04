/**
 * Service Action Types and Enums
 * Centralized type definitions for service actions
 * Based on service_tickets.md documentation
 */

// Service Action Types (from backend service_type field)
export const ServiceActionType = {
  MAINTENANCE: "maintenance",
  REPLACEMENT: "replacement",
  RETURN: "return",
  SELL: "sell",
};

// Service Action Statuses (must match backend status enum)
export const ServiceActionStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PROCESS: "in_process",
  READY_FOR_DISPATCH: "ready_for_dispatch",
  SENT: "sent",
  RETURNED: "returned",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Priority Levels
export const PriorityLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Action Colors
export const ActionColor = {
  BLUE: "blue",
  GREEN: "green",
  AMBER: "amber",
  RED: "red",
  PURPLE: "purple",
  ORANGE: "orange",
  YELLOW: "yellow",
  GRAY: "gray",
};
