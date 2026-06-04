/**
 * Shared tab/subTab → ticket API params mapping.
 * Used by HubPage and ServiceActionsPage to avoid duplication.
 * Single source of truth for service_type, status, available_actions.
 */

const SERVICE_TYPE_TABS = ['replacement', 'maintenance', 'return', 'sell'];

const STATUS_TAB_MAP = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    inProcess: 'IN_PROCESS',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED'
};

/**
 * Map (tab, subTab) to { service_type?, status?, available_actions? }.
 * - Service-type tabs (replacement, maintenance, return, sell): use subTab for status.
 * - Status-only tabs (pending, confirmed, inProcess, completed, cancelled): tab = status, subTab ignored.
 * - 'all' subTab or missing subTab for service-type tabs: no status filter.
 * @param {string} tab
 * @param {string|null} subTab
 * @returns {{ service_type?: string, status?: string, available_actions?: string }}
 */
export function tabSubTabToServiceTypeAndStatus(tab, subTab) {
    if (STATUS_TAB_MAP[tab]) {
        return { status: STATUS_TAB_MAP[tab] };
    }

    if (!SERVICE_TYPE_TABS.includes(tab) || !subTab || subTab === 'all') {
        if (SERVICE_TYPE_TABS.includes(tab)) {
            return { service_type: tab };
        }
        return {};
    }

    switch (tab) {
        case 'replacement':
            switch (subTab) {
                case 'in-preparation':
                    return { service_type: 'replacement', status: 'CONFIRMED', available_actions: 'start_preparation' };
                case 'preparing':
                    return { service_type: 'replacement', status: 'IN_PROCESS', available_actions: 'ready_for_dispatch' };
                case 'ready-to-ship':
                    return { service_type: 'replacement', status: 'READY_FOR_DISPATCH' };
                case 'sent':
                    return { service_type: 'replacement', status: 'SENT' };
                case 'validate-returns':
                    return { service_type: 'replacement', status: 'RETURNED' };
                case 'completed':
                    return { service_type: 'replacement', status: 'COMPLETED' };
                case 'cancelled':
                    return { service_type: 'replacement', status: 'CANCELLED' };
                default:
                    return { service_type: 'replacement' };
            }
        case 'maintenance':
            switch (subTab) {
                case 'confirmed':
                    return { service_type: 'maintenance', status: 'CONFIRMED,PENDING' };
                case 'received':
                    return { service_type: 'maintenance', status: 'IN_PROCESS', available_actions: 'start_maintenance' };
                case 'under-maintenance':
                    return { service_type: 'maintenance', status: 'IN_PROCESS', available_actions: 'complete_maintenance' };
                case 'completion-ready':
                    return { service_type: 'maintenance', status: 'IN_PROCESS', available_actions: 'mark_ready' };
                case 'ready-to-ship':
                    return { service_type: 'maintenance', status: 'READY_FOR_DISPATCH' };
                case 'sent':
                    return { service_type: 'maintenance', status: 'SENT' };
                case 'completed':
                    return { service_type: 'maintenance', status: 'COMPLETED' };
                case 'cancelled':
                    return { service_type: 'maintenance', status: 'CANCELLED' };
                default:
                    return { service_type: 'maintenance' };
            }
        case 'return':
            switch (subTab) {
                case 'receiving':
                    return { service_type: 'return', status: 'CONFIRMED' };
                case 'inspection':
                    return { service_type: 'return', status: 'IN_PROCESS' };
                case 'completed':
                    return { service_type: 'return', status: 'COMPLETED' };
                case 'cancelled':
                    return { service_type: 'return', status: 'CANCELLED' };
                default:
                    return { service_type: 'return' };
            }
        case 'sell':
            switch (subTab) {
                case 'new':
                    return { service_type: 'sell', status: 'CONFIRMED' };
                case 'preparing':
                    return { service_type: 'sell', status: 'IN_PROCESS', available_actions: 'ready_for_dispatch' };
                case 'ready-to-ship':
                    return { service_type: 'sell', status: 'READY_FOR_DISPATCH' };
                case 'sent':
                    return { service_type: 'sell', status: 'SENT' };
                case 'returned':
                    return { service_type: 'sell', status: 'RETURNED' };
                case 'completed':
                    return { service_type: 'sell', status: 'COMPLETED' };
                case 'cancelled':
                    return { service_type: 'sell', status: 'CANCELLED' };
                default:
                    return { service_type: 'sell' };
            }
        default:
            return {};
    }
}

/**
 * Build ticket list API params from tab, subTab, and overrides.
 * Overrides (start_date, end_date, service_type, status, search, etc.) take precedence.
 * @param {string} tab
 * @param {string|null} subTab
 * @param {object} overrides - { limit?, offset?, start_date?, end_date?, service_type?, status?, search?, include_bosta?, ... }
 * @returns {object}
 */
export function buildTicketListParams(tab, subTab, overrides = {}) {
    const base = {
        limit: overrides.limit ?? 50,
        offset: overrides.offset ?? 0
    };
    const mapped = tabSubTabToServiceTypeAndStatus(tab, subTab);
    const out = { ...base, ...mapped };

    if (overrides.service_type !== undefined) {
        out.service_type = overrides.service_type;
    }
    if (overrides.status !== undefined) {
        out.status = overrides.status;
    }
    if (overrides.start_date !== undefined) {
        out.start_date = overrides.start_date;
    }
    if (overrides.end_date !== undefined) {
        out.end_date = overrides.end_date;
    }
    if (overrides.search !== undefined && overrides.search !== '') {
        out.search = overrides.search;
    }
    if (overrides.include_bosta !== undefined) {
        out.include_bosta = overrides.include_bosta;
    }
    return out;
}

export { SERVICE_TYPE_TABS, STATUS_TAB_MAP };
