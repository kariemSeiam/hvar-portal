import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDropdown — open/close state, click-outside, escape key.
 *
 * @param {Object} options
 * @param {boolean}  options.defaultOpen  — start open
 * @param {boolean}  options.closeOnEscape — close on Escape key (default true)
 * @returns {{ isOpen, open, close, toggle, ref, panelRef }}
 */
export default function useDropdown({ defaultOpen = false, closeOnEscape = true } = {}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const ref = useRef(null);
    const panelRef = useRef(null);

    const close = useCallback(() => setIsOpen(false), []);
    const open = useCallback(() => setIsOpen(true), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    /* click-outside */
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            const target = e.target;
            if (
                ref.current && !ref.current.contains(target) &&
                panelRef.current && !panelRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    /* escape key */
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;
        const handler = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, closeOnEscape]);

    return { isOpen, open, close, toggle, ref, panelRef };
}
