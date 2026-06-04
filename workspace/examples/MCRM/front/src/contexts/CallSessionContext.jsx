/**
 * CallSessionContext
 * Global call session state — persists across ALL page navigations.
 *
 * When an agent initiates a call from CustomerServicePage, the session
 * is stored here. The CallSessionFAB is rendered at App.jsx root level
 * (outside the Router tree's page components) so it survives route changes.
 *
 * Session only closes when:
 *   1. Agent manually closes it (X button)
 *   2. Agent completes an action (confirm/cancel/schedule/no-answer)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const CallSessionContext = createContext(null);

export const CallSessionProvider = ({ children }) => {
    const [activeCallSession, setActiveCallSession] = useState(null);
    const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
    const [sessionEpoch, setSessionEpoch] = useState(0);
    // { order, customerContext }

    const startCallSession = useCallback((order, customerContext = null) => {
        // Check if session already open with unsaved edits
        if (activeCallSession && hasUnsavedEdits && !customerContext?.readOnly) {
            const confirmed = window.confirm(
                'لديك تعديلات غير محفوظة في المكالمة الحالية.\nهل تريد إغلاق المكالمة الحالية وفتح مكالمة جديدة؟'
            );
            if (!confirmed) return; // User cancels
        }

        setActiveCallSession({ order, customerContext });
        setHasUnsavedEdits(false);
        setSessionEpoch(prev => prev + 1);
    }, [activeCallSession, hasUnsavedEdits]);

    const endCallSession = useCallback(() => {
        setActiveCallSession(null);
        setHasUnsavedEdits(false);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('callSessionEnd'));
        }
    }, []);

    /** Merge fields into the active queue order without closing the session (e.g. after cancel → allow reactivate). */
    const updateActiveOrder = useCallback((patch) => {
        if (!patch || typeof patch !== 'object') return;
        setActiveCallSession((prev) => {
            if (!prev?.order) return prev;
            return { ...prev, order: { ...prev.order, ...patch } };
        });
    }, []);

    return (
        <CallSessionContext.Provider value={{ activeCallSession, startCallSession, endCallSession, updateActiveOrder, hasUnsavedEdits, setHasUnsavedEdits, sessionEpoch }}>
            {children}
        </CallSessionContext.Provider>
    );
};

export const useCallSession = () => {
    const context = useContext(CallSessionContext);
    if (!context) {
        throw new Error('useCallSession must be used inside CallSessionProvider');
    }
    return context;
};
