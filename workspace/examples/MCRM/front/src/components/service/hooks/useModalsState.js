import { useState, useCallback } from 'react';

/**
 * Modal visibility and payload state for Service Actions page.
 * Unified, Workflow, Confirmation, and View modals.
 */
export function useModalsState() {
    const [showUnifiedModal, setShowUnifiedModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);

    const [showWorkflowModal, setShowWorkflowModal] = useState(false);
    const [workflowActionType, setWorkflowActionType] = useState(null);
    const [workflowActionTicket, setWorkflowActionTicket] = useState(null);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingTicket, setViewingTicket] = useState(null);

    const [copiedPhone, setCopiedPhone] = useState(null);

    const openViewModal = useCallback((ticket) => {
        setViewingTicket(ticket);
        setShowViewModal(true);
    }, []);

    const closeViewModal = useCallback(() => {
        setShowViewModal(false);
        setViewingTicket(null);
    }, []);

    const closeWorkflowModal = useCallback(() => {
        setShowWorkflowModal(false);
        setWorkflowActionType(null);
        setWorkflowActionTicket(null);
    }, []);

    const closeConfirmationModal = useCallback(() => {
        setShowConfirmationModal(false);
        setActionToConfirm(null);
    }, []);

    return {
        showUnifiedModal,
        setShowUnifiedModal,
        selectedAction,
        setSelectedAction,
        showWorkflowModal,
        setShowWorkflowModal,
        workflowActionType,
        setWorkflowActionType,
        workflowActionTicket,
        setWorkflowActionTicket,
        showConfirmationModal,
        setShowConfirmationModal,
        actionToConfirm,
        setActionToConfirm,
        showViewModal,
        setShowViewModal,
        viewingTicket,
        setViewingTicket,
        copiedPhone,
        setCopiedPhone,
        openViewModal,
        closeViewModal,
        closeWorkflowModal,
        closeConfirmationModal,
    };
}
