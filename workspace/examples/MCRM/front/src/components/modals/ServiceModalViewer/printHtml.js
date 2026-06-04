/**
 * Builds the print HTML string for ServiceModalViewer.
 * All dynamic values are escaped to prevent XSS.
 */

import { escapeHtml, escapeForJsString } from '../../../utils/core/escape';
import { buildNotesHtmlForPrint } from '../../../utils/callcenter/printFormat';
import { formatPhoneForLocalDisplay } from '../../../utils/core/phone';
import { formatPriority, formatServiceType } from '../../../utils/service/utils';
import { parseMoneyValue, formatMoneyArEGP } from '../../../utils/erp/signedMoney';

/** Same semantics as SessionStyleMoneyBadge: signed cost_adjustment → label + magnitude (ج.م). */
function buildCostAdjustmentInfoRow(ticket) {
    const raw = ticket.cost_adjustment;
    if (raw == null || String(raw).trim() === '') return '';
    const n = parseMoneyValue(raw);
    const isZero = Math.abs(n) < 1e-8;
    const isRefund = n < 0;
    const label = isZero ? 'التكلفة' : isRefund ? 'استرداد' : 'تحصيل';
    const mag = formatMoneyArEGP(n);
    /* One row, RTL packing: label then digits (LTR) then ج.م — avoids flex:1 pushing numbers to the far edge */
    return `
            <div class="info-cost-row">
                <span class="info-cost-label">${escapeHtml(label)}:</span>
                <span class="info-cost-num" dir="ltr">${escapeHtml(mag)}</span>
                <span class="info-cost-currency">ج.م</span>
            </div>`;
}

/** Design tokens for print layout — HVAR Hub art direction */
const PRINT_COLORS = {
    brandBlue: '#0284c7',
    brandBlueLight: '#e0f2fe',
    ink: '#111827',
    inkMuted: '#6b7280',
    sendTitleBg: '#dcfce7',
    sendTitleBorder: '#16a34a',
    receiveTitleBg: '#f3f4f6',
    receiveTitleBorder: '#9ca3af',
    receiveTitleText: '#6b7280',
};

function getInvoiceTypeTitle(ticket) {
    const isMaintenance = ticket.service_type === 'maintenance';
    const hasScanOutbound =
        ticket.available_actions &&
        Array.isArray(ticket.available_actions) &&
        ticket.available_actions.includes('scan_outbound');
    const isSell = ticket.service_type === 'sell';
    if (isSell) return 'المبيعات';
    if (isMaintenance && hasScanOutbound) return 'صيانة - جاهزة للإرسال';
    return formatServiceType(ticket.service_type || '');
}

function getItemDirection(item) {
    const direction = (item.direction || '').toLowerCase();
    return direction === 'receive' ? 'receive' : 'send';
}

/**
 * Builds the full print HTML for a service ticket.
 * @param {Object} ticket - Ticket object
 * @returns {string} HTML string safe for document.write
 */
export function buildPrintHtml(ticket) {
    const sendItems = (ticket.items || []).filter((item) => getItemDirection(item) === 'send');
    const receiveItems = (ticket.items || []).filter((item) => getItemDirection(item) === 'receive');

    const isMaintenance = ticket.service_type === 'maintenance';
    const isSell = ticket.service_type === 'sell';
    const hasScanOutbound =
        ticket.available_actions &&
        Array.isArray(ticket.available_actions) &&
        ticket.available_actions.includes('scan_outbound');
    const showOnlySend = isMaintenance && hasScanOutbound;
    const trackingSend = ticket.new_tracking_send;
    const trackingReceive = showOnlySend ? null : ticket.new_tracking_receive;

    const invoiceTitle = escapeHtml(getInvoiceTypeTitle(ticket));
    const ticketNumber = escapeHtml(ticket.ticket_number || '');
    const ticketNumberDisplay = escapeHtml(ticket.ticket_number || '-');
    const createdDate = ticket.created_at
        ? escapeHtml(new Date(ticket.created_at).toLocaleDateString('ar-EG'))
        : '-';
    const customerName = escapeHtml(ticket.customer?.name || ticket.customer_name || '-');
    const priorityDisplay = escapeHtml(formatPriority(ticket.priority));
    const phoneDisplay = (ticket.customer?.phone || ticket.phone)
        ? escapeHtml(formatPhoneForLocalDisplay(ticket.customer?.phone || ticket.phone))
        : '-';
    const secPhoneDisplay = (ticket.customer?.sec_phone || ticket.sec_phone)
        ? escapeHtml(formatPhoneForLocalDisplay(ticket.customer?.sec_phone || ticket.sec_phone))
        : '';
    const cityDisplay = escapeHtml(ticket.city || '-');
    const governorateDisplay = escapeHtml(ticket.governorate || '');
    const addressDisplay = escapeHtml(ticket.customer_address || '');
    const originalTrackingDisplay = escapeHtml(ticket.original_tracking || '');

    const trackingSendEscaped = trackingSend ? escapeHtml(trackingSend) : '';
    const trackingReceiveEscaped = trackingReceive ? escapeHtml(trackingReceive) : '';
    const trackingSendJs = trackingSend ? escapeForJsString(trackingSend) : '';
    const trackingReceiveJs = trackingReceive ? escapeForJsString(trackingReceive) : '';
    const ticketNumberJs = ticket.ticket_number ? escapeForJsString(ticket.ticket_number) : '';

    const notesHtml = buildNotesHtmlForPrint(ticket.notes);

    function buildTrackingSection() {
        if (isSell && ticket.ticket_number) {
            return `
        <div class="tracking-section">
            <div class="tracking-grid single">
                <div class="tracking-box">
                    <div class="tracking-label">رقم الإرسال</div>
                    <div class="tracking-number">${ticketNumberDisplay}</div>
                    <div class="tracking-barcode">
                        <svg id="barcode-send"></svg>
                    </div>
                </div>
            </div>
        </div>`;
        }
        if (!trackingSend && !trackingReceive) return '';
        const singleClass =
            (trackingSend && !trackingReceive) || (!trackingSend && trackingReceive) ? 'single' : '';
        if (trackingSend && trackingReceive && trackingSend === trackingReceive) {
            return `
        <div class="tracking-section">
            <div class="tracking-grid single">
                <div class="tracking-box">
                    <div class="tracking-label">رقم تتبع الإرسال والاستلام</div>
                    <div class="tracking-number">${trackingSendEscaped}</div>
                    <div class="tracking-barcode">
                        <svg id="barcode-both"></svg>
                    </div>
                </div>
            </div>
        </div>`;
        }
        return `
        <div class="tracking-section">
            <div class="tracking-grid ${singleClass}">
                ${trackingSend ? `
                <div class="tracking-box">
                    <div class="tracking-label">رقم تتبع الإرسال</div>
                    <div class="tracking-number">${trackingSendEscaped}</div>
                    <div class="tracking-barcode">
                        <svg id="barcode-send"></svg>
                    </div>
                </div>
                ` : ''}
                ${trackingReceive ? `
                <div class="tracking-box">
                    <div class="tracking-label">رقم تتبع الاستلام</div>
                    <div class="tracking-number">${trackingReceiveEscaped}</div>
                    <div class="tracking-barcode">
                        <svg id="barcode-receive"></svg>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;
    }

    function buildSendItemsSection() {
        const shouldShowSend =
            sendItems.length > 0 &&
            (showOnlySend ||
                ticket.new_tracking_send ||
                (!ticket.new_tracking_send && !ticket.new_tracking_receive));
        if (!shouldShowSend) return '';

        if (isSell) {
            const parts = sendItems.filter((i) => i.type === 'part');
            const products = sendItems.filter((i) => i.type === 'product');
            const partsRows = parts
                .map(
                    (item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>قطعة</strong></td>
                        <td class="item-name"><strong>${escapeHtml(item.item_name || item.name || '-')}</strong></td>
                        <td><strong>${escapeHtml(item.sku || '-')}</strong></td>
                        <td><strong>${item.quantity || 0}</strong></td>
                        <td>${item.condition === 'valid' ? 'سليم ✓' : 'تالف ✗'}</td>
                    </tr>`
                )
                .join('');
            const productsRows = products
                .map(
                    (item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="text-muted">منتج</td>
                        <td class="item-name text-muted">${escapeHtml(item.item_name || item.name || '-')}</td>
                        <td class="text-muted">${escapeHtml(item.sku || '-')}</td>
                        <td class="text-muted">${item.quantity || 0}</td>
                        <td class="text-muted">${item.condition === 'valid' ? 'سليم ✓' : 'تالف ✗'}</td>
                    </tr>`
                )
                .join('');
            return (
                (parts.length > 0
                    ? `
        <div class="items-section">
            <div class="section-head send">
                القطع للبيع
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>الصنف</th>
                        <th>رمز المنتج</th>
                        <th>الكمية</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${partsRows}
                </tbody>
            </table>
        </div>`
                    : '') +
                (products.length > 0
                    ? `
        <div class="items-section" style="margin-top: 6px;">
            <div class="section-head receive">
                مرجع المنتج (مرتبط بفاتورة المبيعات)
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>الصنف</th>
                        <th>رمز المنتج</th>
                        <th>الكمية</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsRows}
                </tbody>
            </table>
        </div>`
                    : '')
            );
        }

        const rows = sendItems
            .map(
                (item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.type === 'product' ? 'منتج' : 'قطعة'}</td>
                        <td class="item-name">${escapeHtml(item.item_name || item.name || '-')}</td>
                        <td>${escapeHtml(item.sku || '-')}</td>
                        <td><strong>${item.quantity || 0}</strong></td>
                        <td>${item.condition === 'valid' ? 'سليم ✓' : 'تالف ✗'}</td>
                    </tr>`
            )
            .join('');
        return `
        <div class="items-section">
            <div class="section-head send">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                إرسال للعميل
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>الصنف</th>
                        <th>رمز المنتج</th>
                        <th>الكمية</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
    }

    function buildReceiveItemsSection() {
        const shouldShowReceive =
            !showOnlySend &&
            receiveItems.length > 0 &&
            (ticket.new_tracking_receive ||
                (!ticket.new_tracking_send && !ticket.new_tracking_receive));
        if (!shouldShowReceive) return '';
        const rows = receiveItems
            .map(
                (item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.type === 'product' ? 'منتج' : 'قطعة'}</td>
                        <td class="item-name">${escapeHtml(item.item_name || item.name || '-')}</td>
                        <td>${escapeHtml(item.sku || '-')}</td>
                        <td><strong>${item.quantity || 0}</strong></td>
                        <td>${item.condition === 'valid' ? 'سليم ✓' : 'تالف ✗'}</td>
                    </tr>`
            )
            .join('');
        return `
        <div class="items-section">
            <div class="section-head receive">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                استلام من العميل
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>الصنف</th>
                        <th>رمز المنتج</th>
                        <th>الكمية</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>`;
    }

    /** Barcode options: compact for one-page fit, still scannable */
    const BARCODE_OPTS_STR = '{format:"CODE128",width:1.4,height:32,displayValue:false,margin:2,marginTop:1,marginBottom:1}';
    function buildBarcodeScript() {
        const opts = BARCODE_OPTS_STR;
        if (isSell && ticket.ticket_number) {
            return `
                var barcodeSend = document.getElementById('barcode-send');
                if (barcodeSend) JsBarcode(barcodeSend, '${ticketNumberJs}', ${opts});
            `;
        }
        if (trackingSend && trackingReceive && trackingSend === trackingReceive) {
            return `
                var barcodeBoth = document.getElementById('barcode-both');
                if (barcodeBoth) JsBarcode(barcodeBoth, '${trackingSendJs}', ${opts});
            `;
        }
        return (
            (trackingSend ? `
                var barcodeSend = document.getElementById('barcode-send');
                if (barcodeSend) JsBarcode(barcodeSend, '${trackingSendJs}', ${opts});
            ` : '') +
            (trackingReceive ? `
                var barcodeReceive = document.getElementById('barcode-receive');
                if (barcodeReceive) JsBarcode(barcodeReceive, '${trackingReceiveJs}', ${opts});
            ` : '')
        );
    }

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة - ${ticketNumber}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        /* HVAR print: white & black only — creative, no direct color */
        :root {
            --b: #000000;
            --w: #ffffff;
            --g: #1a1a1a;
            --g2: #333333;
            --line: #000000;
            --line-light: #e0e0e0;
        }
        @page { margin: 12mm; size: A4; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, Tahoma, sans-serif;
            direction: rtl;
            color: var(--b);
            font-size: 10pt;
            line-height: 1.35;
            background: var(--w);
            padding: 0;
        }
        .page {
            max-width: 210mm;
            margin: 0 auto;
            background: var(--w);
            padding: 8mm 10mm;
        }
        /* —— HVAR header: compact —— */
        .header {
            text-align: center;
            padding-bottom: 8px;
            margin-bottom: 10px;
            border-bottom: 3px solid var(--b);
        }
        .header::after {
            content: '';
            display: block;
            margin-top: 4px;
            border-bottom: 1px solid var(--b);
            width: 50px;
            margin-left: auto;
            margin-right: auto;
        }
        .brand {
            font-size: 24pt;
            font-weight: 900;
            letter-spacing: 4px;
            color: var(--b);
            margin-bottom: 2px;
        }
        .hotline {
            font-size: 9pt;
            color: var(--g2);
            margin-bottom: 6px;
        }
        .invoice-type {
            font-size: 12pt;
            font-weight: 700;
            color: var(--b);
            background: var(--w);
            border: 2px solid var(--b);
            display: inline-block;
            padding: 4px 24px;
        }
        /* —— Info: compact —— */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 14px;
            margin-bottom: 10px;
            padding: 10px 12px;
            background: var(--w);
            border: 2px solid var(--b);
        }
        .info-item { display: flex; align-items: baseline; }
        .info-label {
            font-weight: 700;
            margin-left: 6px;
            min-width: 80px;
            color: var(--g2);
            font-size: 9pt;
        }
        .info-value {
            flex: 1;
            border-bottom: 1px solid var(--line-light);
            font-weight: 500;
            color: var(--b);
            font-size: 9pt;
        }
        .info-full { grid-column: 1 / -1; }
        .info-cost-row {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: row;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 6px;
            width: 100%;
            padding-bottom: 2px;
            border-bottom: 1px solid var(--line-light);
            font-size: 9pt;
            font-weight: 500;
            color: var(--b);
            unicode-bidi: isolate;
        }
        .info-cost-label {
            font-weight: 700;
            color: var(--g2);
            flex-shrink: 0;
        }
        .info-cost-num { font-weight: 700; color: var(--b); }
        .info-cost-currency { flex-shrink: 0; }
        /* —— Barcode: compact for one-page fit —— */
        .tracking-section {
            margin-bottom: 10px;
            padding: 8px 10px;
            background: var(--w);
            border: 2px solid var(--b);
        }
        .tracking-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .tracking-grid.single { grid-template-columns: 1fr; justify-items: center; }
        .tracking-grid.single .tracking-box { width: 100%; max-width: 200px; }
        .tracking-box {
            padding: 6px 8px;
            background: var(--w);
            border: 2px solid var(--b);
        }
        .tracking-label {
            font-weight: 700;
            margin-bottom: 2px;
            font-size: 9pt;
            text-align: center;
            color: var(--g2);
        }
        .tracking-number {
            font-size: 12pt;
            font-weight: 800;
            text-align: center;
            margin-bottom: 4px;
            color: var(--b);
            letter-spacing: 1px;
        }
        .tracking-barcode {
            text-align: center;
            margin-top: 4px;
        }
        .tracking-barcode canvas,
        .tracking-barcode svg {
            width: 100% !important;
            max-width: 200px;
            min-height: 0;
            height: auto !important;
            border: none;
            background: var(--w) !important;
            display: block;
            margin: 0 auto;
        }
        /* —— Section heads: compact —— */
        .items-section { margin-bottom: 10px; }
        .section-head {
            font-weight: 700;
            font-size: 10pt;
            margin-bottom: 4px;
            padding: 6px 10px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .section-head.send {
            background: var(--b);
            color: var(--w);
            border: 2px solid var(--b);
        }
        .section-head.receive {
            background: var(--w);
            color: var(--b);
            border: 3px solid var(--b);
            border-right-width: 10px;
        }
        .section-head svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            stroke: currentColor;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
            border: 2px solid var(--b);
        }
        th, td {
            padding: 4px 6px;
            border: 1px solid var(--b);
            text-align: center;
            font-size: 9pt;
        }
        th {
            background: var(--b);
            color: var(--w);
            font-weight: 700;
        }
        td { background: var(--w); color: var(--b); }
        .item-name {
            text-align: right;
            font-weight: 600;
            word-wrap: break-word;
            word-break: break-word;
        }
        .text-muted { color: var(--g2); }
        .notes {
            border: 2px solid var(--b);
            padding: 8px 10px;
            margin-bottom: 0;
            min-height: 4.1em;
            background: var(--w);
        }
        .notes-label {
            font-weight: 700;
            margin-bottom: 4px;
            color: var(--b);
            font-size: 9pt;
        }
        .notes-body {
            line-height: 1.5;
            font-size: 9pt;
            color: var(--b);
            word-wrap: break-word;
            word-break: break-word;
        }
        .notes-sabab {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed var(--line);
        }
        .notes-sabab-label {
            font-weight: 800;
            font-size: 9pt;
            margin-bottom: 4px;
            color: var(--b);
        }
        .notes-sabab-text {
            font-size: 9pt;
            line-height: 1.45;
            color: var(--b);
            white-space: pre-wrap;
            word-wrap: break-word;
            word-break: break-word;
        }
        @media print {
            body { background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .page { margin: 0; padding: 0; page-break-inside: avoid; }
            .header, .info-grid, .tracking-section, .items-section, .notes, .info-cost-row { page-break-inside: avoid; }
            .header, .header::after { border-color: #000 !important; }
            .brand, .invoice-type, .info-value, .section-head.receive, .notes-label { color: #000 !important; }
            .section-head.send { background: #000 !important; color: #fff !important; border-color: #000 !important; }
            .info-grid, .tracking-section, .tracking-box, .notes { border-color: #000 !important; background: #fff !important; }
            .info-label, .tracking-label, .text-muted { color: #333 !important; }
            .info-value { border-bottom-color: #ccc !important; }
            table, th, td { border-color: #000 !important; }
            th { background: #000 !important; color: #fff !important; }
            td { background: #fff !important; color: #000 !important; }
            .tracking-barcode canvas, .tracking-barcode svg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="brand">HVAR</div>
            <div class="hotline">الخط الساخن: 17566</div>
            <div class="invoice-type">${invoiceTitle}</div>
        </div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">رقم التذكرة:</span>
                <span class="info-value">${ticketNumberDisplay}</span>
            </div>
            <div class="info-item">
                <span class="info-label">التاريخ:</span>
                <span class="info-value">${createdDate}</span>
            </div>
            <div class="info-item">
                <span class="info-label">اسم العميل:</span>
                <span class="info-value">${customerName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">الأولوية:</span>
                <span class="info-value">${priorityDisplay}</span>
            </div>
            <div class="info-item">
                <span class="info-label">الهاتف:</span>
                <span class="info-value">${phoneDisplay}</span>
            </div>
            ${ticket.customer?.sec_phone || ticket.sec_phone ? `
            <div class="info-item info-full">
                <span class="info-label">هاتف إضافي:</span>
                <span class="info-value">${secPhoneDisplay}</span>
            </div>
            ` : ''}
            ${ticket.city || ticket.governorate ? `
            <div class="info-item">
                <span class="info-label">المدينة:</span>
                <span class="info-value">${cityDisplay}</span>
            </div>
            ` : ''}
            ${ticket.governorate ? `
            <div class="info-item">
                <span class="info-label">المحافظة:</span>
                <span class="info-value">${governorateDisplay}</span>
            </div>
            ` : ''}
            ${ticket.customer_address ? `
            <div class="info-item info-full">
                <span class="info-label">العنوان:</span>
                <span class="info-value">${addressDisplay}</span>
            </div>
            ` : ''}
            ${ticket.original_tracking ? `
            <div class="info-item info-full">
                <span class="info-label">رقم التتبع الأصلي:</span>
                <span class="info-value">${originalTrackingDisplay}</span>
            </div>
            ` : ''}
            ${buildCostAdjustmentInfoRow(ticket)}
        </div>
        ${buildTrackingSection()}
        ${buildSendItemsSection()}
        ${buildReceiveItemsSection()}
        ${notesHtml}
    </div>
    <script>
        window.onload = function() {
            if (typeof JsBarcode !== 'undefined') {
                ${buildBarcodeScript()}
            }
            setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
            }, 350);
        };
    </script>
</body>
</html>`;
}
