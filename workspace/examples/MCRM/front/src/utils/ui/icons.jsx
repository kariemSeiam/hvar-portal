/**
 * Hub page icon components — module scope to avoid recreating on every HubPage render.
 */
const ICON_SVG = (d, className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const ICON_SVG_MULTI = (paths, className) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        {paths.map((d, i) => (
            <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        ))}
    </svg>
);

export const getIconComponent = (iconName, className = "w-5 h-5") => {
    const icons = {
        'menu': ICON_SVG("M4 6h16M4 12h16M4 18h16", className),
        'close': ICON_SVG("M6 18L18 6M6 6l12 12", className),
        'chevron-left': ICON_SVG("M15 19l-7-7 7-7", className),
        'chevron-right': ICON_SVG("M9 5l7 7-7 7", className),
        'zap': ICON_SVG("M13 10V3L4 14h7v7l9-11h-7z", className),
        'qr-code': ICON_SVG("M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4", className),
        'bar-chart': ICON_SVG("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", className),
        'trending-up': ICON_SVG("M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", className),
        'settings': ICON_SVG_MULTI([
            "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
            "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        ], className),
        'wrench': ICON_SVG("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", className),
        'help-circle': ICON_SVG("M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", className),
        'camera': ICON_SVG_MULTI([
            "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
            "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        ], className),
        'camera-off': ICON_SVG_MULTI([
            "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
            "M15 13a3 3 0 11-6 0 3 3 0 016 0z",
            "M1 1l22 22"
        ], className),
        'search': ICON_SVG("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", className),
        'download': ICON_SVG("M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V10", className),
        'upload': ICON_SVG("M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10", className),
        'alert-triangle': ICON_SVG("M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z", className)
    };
    return icons[iconName] || icons['menu'];
};
