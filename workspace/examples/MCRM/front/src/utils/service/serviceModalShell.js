/**
 * Single place for service ticket modal header + action-submit copy (confirm / viewer).
 * Keeps icon, gradient, and Arabic labels aligned across modals.
 */
import { FileText, Package } from 'lucide-react';
import { getServiceTypeLabelAr, normalizeServiceTypeOrFallback } from '../../constants/serviceTypes.js';
import { SERVICE_TYPE_ICONS, SERVICE_TYPE_MODAL_ICON_GRADIENT } from '../../constants/serviceTypeUi.js';
import { formatServiceType } from './utils';

const ACTION_HEADER_TITLE = {
  confirm: 'تأكيد التذكرة',
  cancel: 'إلغاء التذكرة',
  scan_send: 'تسجيل الإرسال',
  scan_receive: 'تسجيل الاستلام',
};

const ACTION_SUBMIT = {
  confirm: { submitButtonLabel: 'تأكيد', submitLoadingLabel: 'جاري التأكيد...' },
  cancel: { submitButtonLabel: 'تأكيد الإلغاء', submitLoadingLabel: 'جاري الإلغاء...' },
  scan_send: { submitButtonLabel: 'تسجيل الإرسال', submitLoadingLabel: 'جاري التسجيل...' },
  scan_receive: { submitButtonLabel: 'تسجيل الاستلام', submitLoadingLabel: 'جاري التسجيل...' },
};

/**
 * @param {string} [targetStatus]
 * @returns {{ submitButtonLabel: string, submitLoadingLabel: string }}
 */
export function getTicketActionSubmitLabels(targetStatus) {
  const key = (targetStatus || 'confirm').toLowerCase();
  return (
    ACTION_SUBMIT[key] || {
      submitButtonLabel: 'تأكيد',
      submitLoadingLabel: 'جاري التنفيذ...',
    }
  );
}

function canonicalServiceTypeFromAction(action) {
  return normalizeServiceTypeOrFallback(action?.service_type || action?.action_type, {
    fallback: 'replacement',
  });
}

/**
 * Props for {@link ServiceModalHeader} on ticket action confirmation (Endpoint 1).
 *
 * @param {{ action: object, targetStatus?: string }} params
 * @returns {object} Spread into ServiceModalHeader (plus ticket + subtitleAsServiceTypeLabel)
 */
export function getTicketActionConfirmationHeaderProps({ action, targetStatus }) {
  const typeLabel = getServiceTypeLabelAr(action?.service_type || action?.action_type, { short: false });
  const statusKey = (targetStatus || 'confirm').toLowerCase();
  const title = ACTION_HEADER_TITLE[statusKey] || 'تنفيذ الإجراء';
  const subtitle = typeLabel && typeLabel !== '—' ? typeLabel : '';
  const canonical = canonicalServiceTypeFromAction(action);
  const icon = SERVICE_TYPE_ICONS[canonical] || Package;
  const iconColor =
    SERVICE_TYPE_MODAL_ICON_GRADIENT[canonical] ?? 'from-blue-500 to-blue-600';

  return {
    title,
    subtitle,
    icon,
    iconColor,
    ticket: action,
    subtitleAsServiceTypeLabel: true,
  };
}

const VIEWER_HEADER_FALLBACK_GRADIENT = 'from-brand-blue-500 to-indigo-600';

/**
 * Props for {@link ServiceModalHeader} on ticket viewer (read-only modal).
 * Caller still passes `subtitle` (e.g. formatted ticket number) and `onClose`.
 *
 * @param {object | null | undefined} ticket
 * @returns {object} Spread into ServiceModalHeader
 */
export function getTicketViewerHeaderProps(ticket) {
  const canonical = normalizeServiceTypeOrFallback(ticket?.service_type, { fallback: 'replacement' });
  const icon = SERVICE_TYPE_ICONS[canonical] || FileText;
  const iconColor = SERVICE_TYPE_MODAL_ICON_GRADIENT[canonical] ?? VIEWER_HEADER_FALLBACK_GRADIENT;
  const title = `تذكرة ${formatServiceType(ticket?.service_type || '')}`;

  return {
    title,
    icon,
    iconColor,
    ticket,
    sticky: true,
  };
}
