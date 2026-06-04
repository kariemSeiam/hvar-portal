import { describe, it, expect } from 'vitest';
import {
  getTicketActionConfirmationHeaderProps,
  getTicketActionSubmitLabels,
  getTicketViewerHeaderProps,
} from '../src/utils/service/serviceModalShell';
import { SERVICE_TYPE_MODAL_ICON_GRADIENT } from '../src/constants/serviceTypeUi.js';

describe('serviceModalShell', () => {
  it('getTicketActionSubmitLabels maps targetStatus', () => {
    expect(getTicketActionSubmitLabels('confirm').submitButtonLabel).toBe('تأكيد');
    expect(getTicketActionSubmitLabels('cancel').submitLoadingLabel).toBe('جاري الإلغاء...');
    expect(getTicketActionSubmitLabels('unknown').submitButtonLabel).toBe('تأكيد');
  });

  it('getTicketActionConfirmationHeaderProps includes service-type gradient and ticket', () => {
    const action = { service_type: 'maintenance', id: 1 };
    const p = getTicketActionConfirmationHeaderProps({ action, targetStatus: 'confirm' });
    expect(p.title).toBe('تأكيد التذكرة');
    expect(p.iconColor).toBe(SERVICE_TYPE_MODAL_ICON_GRADIENT.maintenance);
    expect(p.ticket).toBe(action);
    expect(p.subtitleAsServiceTypeLabel).toBe(true);
  });

  it('getTicketViewerHeaderProps uses canonical type for icon gradient', () => {
    const p = getTicketViewerHeaderProps({ service_type: 'sell', ticket_number: 'HVS25040601' });
    expect(p.title).toMatch(/^تذكرة /);
    expect(p.iconColor).toBe(SERVICE_TYPE_MODAL_ICON_GRADIENT.sell);
    expect(p.sticky).toBe(true);
  });
});
