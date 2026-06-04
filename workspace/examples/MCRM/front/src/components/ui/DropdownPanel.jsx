import { memo, useEffect, useRef, useCallback } from 'react';

/**
 * DropdownPanel — Positioned floating panel for dropdown content.
 *
 * Renders a portal-style panel below a trigger. Auto-positions to stay
 * within viewport. Supports backdrop click to close.
 *
 * @param {Object}  props
 * @param {boolean} props.isOpen
 * @param {React.Ref} props.triggerRef — ref to the trigger button
 * @param {React.Ref} props.panelRef  — ref for the panel itself
 * @param {Function} props.onClose
 * @param {string}   props.align     — 'left' | 'right' | 'center' (default 'right' for RTL)
 * @param {string}   props.width     — 'auto' | 'trigger' | CSS value (default 'auto')
 * @param {string}   props.maxHeight — CSS max-height (default '260px')
 * @param {boolean}  props.backdrop  — render invisible backdrop (default false)
 * @param {string}   props.className
 * @param {React.ReactNode} props.children
 */
const DropdownPanel = memo(({
    isOpen,
    triggerRef,
    panelRef: externalPanelRef,
    onClose,
    align = 'right',
    width = 'auto',
    maxHeight = '260px',
    backdrop = false,
    className = '',
    children,
}) => {
    const internalRef = useRef(null);
    const ref = externalPanelRef || internalRef;

    /* auto-position within viewport */
    useEffect(() => {
        if (!isOpen || !triggerRef?.current || !ref.current) return;
        const trigger = triggerRef.current.getBoundingClientRect();
        const panel = ref.current;
        const gap = 6;

        panel.style.position = 'absolute';
        panel.style.top = `${trigger.bottom + gap}px`;
        panel.style.bottom = 'auto';
        panel.style.zIndex = '50';

        const vpWidth = window.innerWidth;

        if (width === 'trigger') {
            panel.style.width = `${trigger.width}px`;
        } else if (width !== 'auto') {
            panel.style.width = width;
        }

        const panelRect = panel.getBoundingClientRect();
        const margin = 12;

        if (align === 'right') {
            let left = trigger.right - panelRect.width;
            if (left < margin) left = margin;
            if (left + panelRect.width > vpWidth - margin) left = vpWidth - margin - panelRect.width;
            panel.style.left = `${left}px`;
            panel.style.right = 'auto';
        } else if (align === 'left') {
            let left = trigger.left;
            if (left + panelRect.width > vpWidth - margin) left = vpWidth - margin - panelRect.width;
            if (left < margin) left = margin;
            panel.style.left = `${left}px`;
            panel.style.right = 'auto';
        } else {
            let left = trigger.left + (trigger.width - panelRect.width) / 2;
            if (left < margin) left = margin;
            if (left + panelRect.width > vpWidth - margin) left = vpWidth - margin - panelRect.width;
            panel.style.left = `${left}px`;
            panel.style.right = 'auto';
        }
    }, [isOpen, triggerRef, ref, align, width]);

    /* handle backdrop click */
    const handleBackdropClick = useCallback(() => {
        onClose?.();
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <>
            {backdrop && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleBackdropClick}
                    onContextMenu={handleBackdropClick}
                />
            )}
            <div
                ref={ref}
                className={`
                    absolute bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    rounded-xl shadow-lg shadow-black/8 dark:shadow-black/24
                    overflow-hidden
                    animate-in fade-in slide-in-from-top-1 duration-150 ease-out
                    ${className}
                `}
                style={{ maxHeight }}
                dir="rtl"
            >
                {children}
            </div>
        </>
    );
});

DropdownPanel.displayName = 'DropdownPanel';

export default DropdownPanel;
