/**
 * Shared tab/sub-tab style utilities for Hub-style tab bars.
 * Used by HubPage and ServiceActionsPage for consistent creative design.
 */

const colorMap = {
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400'
};

const bgMap = {
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    gray: 'bg-gray-50 dark:bg-gray-800/50',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20'
};

const badgeMap = {
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    gray: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
};

const subTabBadgeMap = {
    orange: 'bg-orange-200 dark:bg-orange-800/60 text-orange-800 dark:text-orange-200',
    purple: 'bg-purple-200 dark:bg-purple-800/60 text-purple-800 dark:text-purple-200',
    blue: 'bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200',
    green: 'bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200',
    red: 'bg-red-200 dark:bg-red-800/60 text-red-800 dark:text-red-200',
    gray: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    yellow: 'bg-yellow-200 dark:bg-yellow-800/60 text-yellow-800 dark:text-yellow-200',
    cyan: 'bg-cyan-200 dark:bg-cyan-800/60 text-cyan-800 dark:text-cyan-200',
    indigo: 'bg-indigo-200 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200',
    amber: 'bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200'
};

const borderColorMap = {
    orange: 'rgba(249, 115, 22, 0.4)',
    purple: 'rgba(168, 85, 247, 0.4)',
    blue: 'rgba(59, 130, 246, 0.4)',
    green: 'rgba(34, 197, 94, 0.4)',
    red: 'rgba(239, 68, 68, 0.4)',
    yellow: 'rgba(234, 179, 8, 0.4)',
    cyan: 'rgba(6, 182, 212, 0.4)',
    gray: 'rgba(156, 163, 175, 0.4)',
    indigo: 'rgba(99, 102, 241, 0.4)',
    amber: 'rgba(245, 158, 11, 0.4)'
};

export function getTabColorClasses(color, isActive) {
    if (!isActive) return '';
    return colorMap[color] || '';
}

export function getTabBgClasses(color, isActive) {
    if (!isActive) return 'bg-transparent';
    return bgMap[color] || 'bg-white dark:bg-gray-800';
}

export function getTabBadgeClasses(color, isActive) {
    if (!isActive) return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    return badgeMap[color] || 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
}

export function getSubTabColorClasses(color) {
    return colorMap[color] || 'text-gray-600 dark:text-gray-400';
}

export function getSubTabBgClasses(color, isActive) {
    if (!isActive) return 'bg-transparent';
    return bgMap[color] || 'bg-white dark:bg-gray-800';
}

export function getSubTabBadgeClasses(color, isActive) {
    if (!isActive) return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    return subTabBadgeMap[color] || 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
}

export function getTabBorderStyle(color) {
    return { borderColor: borderColorMap[color] || borderColorMap.gray };
}
