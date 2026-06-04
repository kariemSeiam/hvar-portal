/**
 * Physical hub dashboard — pure UI helpers over normalized ticket/service rows.
 *
 * - Input objects are the same shape as list cards / ticket payloads: `action.status` uses
 *   snake_case lifecycle values (see tickets API + `serviceActionUtils` display maps).
 * - Sub-tab ids (`pending_receive`, `on_hub`, `pending_sending`) are **view keys**, not DB enums.
 * - This module does **not** call HTTP; use `api/hubAPI.js` or `ticketsAPI` for remote operations.
 */

/** @typedef {{ status?: string, [k: string]: unknown }} ServiceActionLike */

/**
 * Tailwind-ish classes for hub-oriented status chips (subset used in hub panels).
 */
export const getHubStatusColor = (status) => {
  const colors = {
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    confirmed:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    in_process:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    ready_for_dispatch:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    created: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    in_progress:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    on_hub:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return colors[status] || colors.pending;
};

export const getHubStatusLabel = (status) => {
  const labels = {
    pending: "في الانتظار",
    confirmed: "مؤكدة",
    in_process: "قيد المعالجة",
    ready_for_dispatch: "جاهزة للإرسال",
    sent: "مرسلة",
    created: "في الانتظار",
    in_progress: "قيد المعالجة",
    on_hub: "في المركز",
  };
  return labels[status] || status;
};

/** Status values that may appear in hub dashboard slices (aligned with filter + stats logic). */
export const isValidHubStatus = (status) => {
  const validStatuses = [
    "pending",
    "confirmed",
    "in_process",
    "ready_for_dispatch",
    "sent",
    "created",
    "in_progress",
    "on_hub",
    "delivered",
  ];
  return validStatuses.includes(status);
};

/**
 * @param {ServiceActionLike[] | null | undefined} serviceActions
 * @param {string} subTab - `pending_receive` | `on_hub` | `pending_sending` | default
 */
export const filterByHubSubTab = (serviceActions, subTab) => {
  if (!serviceActions || !Array.isArray(serviceActions)) {
    return [];
  }

  switch (subTab) {
    case "pending_receive":
      return serviceActions.filter(
        (action) => action.status === "pending" || action.status === "confirmed"
      );

    case "pending_sending":
      return serviceActions.filter(
        (action) => action.status === "ready_for_dispatch"
      );

    case "on_hub":
      return serviceActions.filter((action) =>
        [
          "pending",
          "confirmed",
          "in_process",
          "ready_for_dispatch",
        ].includes(action.status)
      );

    default:
      return serviceActions.filter((action) => action.status !== "completed");
  }
};

/**
 * Aggregate counts for hub sub-tab badges from open (non-terminal) actions.
 * @param {ServiceActionLike[] | null | undefined} serviceActions
 */
export const calculateHubStats = (serviceActions) => {
  const stats = {
    pendingReceive: 0,
    pendingSending: 0,
    onHub: 0,
    total: 0,
  };

  if (!serviceActions || !Array.isArray(serviceActions)) {
    return stats;
  }

  serviceActions.forEach((action) => {
    if (action.status === "completed" || action.status === "cancelled") return;

    stats.total++;

    switch (action.status) {
      case "pending":
      case "confirmed":
        stats.pendingReceive++;
        break;
      case "ready_for_dispatch":
        stats.pendingSending++;
        break;
      case "in_process":
      case "sent":
      case "delivered":
        stats.onHub++;
        break;
      case "pending_receive":
        stats.pendingReceive++;
        break;
      default:
        stats.onHub++;
    }
  });

  return stats;
};

/**
 * @param {{ pendingReceive: number, pendingSending: number, onHub: number }} hubStats
 */
export const getHubSubTabs = (hubStats) => {
  return [
    {
      id: "pending_receive",
      label: "في انتظار الاستلام",
      badge: hubStats.pendingReceive.toString(),
      color: "amber",
      description: "عناصر تنتظر الاستلام من العملاء",
    },
    {
      id: "on_hub",
      label: "في المركز",
      badge: hubStats.onHub.toString(),
      color: "purple",
      description: "عناصر قيد المعالجة في المركز",
    },
    {
      id: "pending_sending",
      label: "في انتظار الإرسال",
      badge: hubStats.pendingSending.toString(),
      color: "blue",
      description: "عناصر جاهزة للإرسال للعملاء",
    },
  ];
};
