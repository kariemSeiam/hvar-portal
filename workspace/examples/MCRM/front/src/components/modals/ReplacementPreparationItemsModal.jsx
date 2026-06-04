import { useMemo } from 'react';
import { Package, Printer, FileText, Box, Wrench } from 'lucide-react';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';
import { escapeHtml } from '../../utils/core/escape';
import { parseMoneyValue, formatMoneyArEGP } from '../../utils/erp/signedMoney';

const PREP_LABELS = {
    replacement: {
        title: 'قائمة تحضير عناصر الاستبدال',
        subtitle: 'عرض مجمع للعناصر المطلوبة للتحضير من جميع التذاكر',
    },
    sell: {
        title: 'قائمة تحضير عناصر المبيعات',
        subtitle: 'عرض مجمع للعناصر المطلوبة للتحضير من جميع تذاكر البيع',
    },
};

function isSendDirectionItem(item, serviceType) {
    if (serviceType === 'sell') {
        return !item.direction || item.direction === 'send';
    }
    return item.direction === 'send';
}

/**
 * Aggregated preparation list for replacement or sell tickets (جاري التحضير).
 */
const ReplacementPreparationItemsModal = ({ isOpen, onClose, tickets = [], serviceType = 'replacement' }) => {
    const prepLabels = PREP_LABELS[serviceType] ?? PREP_LABELS.replacement;

    // Aggregate send-direction items (replacement: direction send; sell: send or unset)
    const aggregatedItems = useMemo(() => {
        if (!tickets || tickets.length === 0) return [];

        const allSendItems = [];
        tickets.forEach(ticket => {
            if (ticket.items && Array.isArray(ticket.items)) {
                ticket.items.forEach(item => {
                    if (isSendDirectionItem(item, serviceType)) {
                        allSendItems.push(item);
                    }
                });
            }
        });

        if (allSendItems.length === 0) return [];

        // Aggregate items by item_id or sku
        const aggregated = allSendItems.reduce((acc, item) => {
            const key = item.item_id || item.sku;
            if (!key) return acc;

            if (!acc[key]) {
                acc[key] = {
                    item_id: item.item_id,
                    sku: item.sku || '',
                    name: item.name || '',
                    type: item.type || '',
                    quantity: 0
                };
            }
            acc[key].quantity += parseInt(item.quantity) || 1;
            return acc;
        }, {});

        // Convert to array and sort: products first, then parts, then by name
        return Object.values(aggregated).sort((a, b) => {
            // First sort by type: product comes before part
            const typeOrder = { 'product': 0, 'part': 1 };
            const aTypeOrder = typeOrder[a.type] ?? 2;
            const bTypeOrder = typeOrder[b.type] ?? 2;
            
            if (aTypeOrder !== bTypeOrder) {
                return aTypeOrder - bTypeOrder;
            }
            
            // Then sort by name
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB, 'ar');
        });
    }, [tickets, serviceType]);

    // Print function
    const handlePrint = () => {
        const printLabels = PREP_LABELS[serviceType] ?? PREP_LABELS.replacement;
        const printWindow = window.open('', '_blank');

        const ticketsCostSection = (() => {
            if (!tickets || tickets.length === 0) return '';
            let rows = '';
            for (const t of tickets) {
                const raw = t.cost_adjustment;
                const ticketLabel = escapeHtml(String(t.ticket_number || t.id || '-'));
                if (raw == null || String(raw).trim() === '') {
                    rows += `<tr><td>${ticketLabel}</td><td>—</td></tr>`;
                    continue;
                }
                const n = parseMoneyValue(raw);
                const isZero = Math.abs(n) < 1e-8;
                const isRefund = n < 0;
                const flow = isZero ? '' : (isRefund ? 'استرداد' : 'تحصيل');
                const mag = formatMoneyArEGP(n);
                const cellInner = isZero
                    ? `<span dir="rtl" class="cost-cell-inner"><span dir="ltr">${escapeHtml(mag)}</span><span> ج.م</span></span>`
                    : `<span dir="rtl" class="cost-cell-inner"><span>${flow}</span><span dir="ltr">${escapeHtml(mag)}</span><span> ج.م</span></span>`;
                rows += `<tr><td>${ticketLabel}</td><td class="cost-cell">${cellInner}</td></tr>`;
            }
            const sum = tickets.reduce((s, t) => s + parseMoneyValue(t.cost_adjustment), 0);
            const sumMag = formatMoneyArEGP(sum);
            const sumRowInner =
                Math.abs(sum) < 1e-8
                    ? `<span dir="rtl">إجمالي التكلفة: <span dir="ltr">${escapeHtml(sumMag)}</span> ج.م</span>`
                    : `<span dir="rtl"><span>${sum < 0 ? 'استرداد' : 'تحصيل'} (مجموع التذاكر):</span> <span dir="ltr">${escapeHtml(sumMag)}</span> ج.م</span>`;
            rows += `<tr class="cost-total-row"><td colspan="2"><strong>${sumRowInner}</strong></td></tr>`;
            return `
        <table class="tickets-cost">
            <thead>
                <tr>
                    <th>رقم التذكرة</th>
                    <th>التكلفة</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`;
        })();

        const printContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${printLabels.title}</title>
    <style>
        :root {
            --color-gray-50: #f9fafb;
            --color-gray-100: #f3f4f6;
            --color-gray-200: #e5e7eb;
            --color-gray-600: #4b5563;
            --color-gray-700: #374151;
            --color-gray-900: #111827;
            --color-bg-card-light: #ffffff;
            --color-accent-green-600: #16a34a;
            --color-error-600: #dc2626;
        }
        @page {
            margin: 15mm;
            size: A4;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            color: var(--color-gray-900);
            font-size: 11pt;
            line-height: 1.6;
            padding: 0;
            margin: 0;
        }
        .page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid var(--color-gray-900);
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .brand-container {
            margin-bottom: 8px;
        }
        .brand {
            font-size: 28pt;
            font-weight: bold;
            letter-spacing: 3px;
            color: var(--color-gray-900);
            display: inline-block;
        }
        .brand-separator {
            font-size: 28pt;
            font-weight: bold;
            margin: 0 8px;
            color: var(--color-gray-900);
        }
        .brand-arabic {
            font-size: 28pt;
            font-weight: bold;
            color: var(--color-gray-900);
            display: inline-block;
        }
        .document-type {
            font-size: 18pt;
            font-weight: bold;
            border: 2px solid var(--color-gray-900);
            display: inline-block;
            padding: 8px 50px;
            margin-top: 6px;
            background: var(--color-gray-100);
        }
        .date-info {
            margin-top: 8px;
            font-size: 11pt;
            color: var(--color-gray-600);
        }
        .date-day {
            font-weight: bold;
            font-size: 12pt;
            color: var(--color-gray-900);
            margin-bottom: 2px;
        }
        .date-details {
            font-size: 10pt;
        }
        .info {
            margin-bottom: 18px;
            padding: 12px;
            border: 2px solid var(--color-gray-900);
            background: var(--color-gray-100);
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            text-align: center;
        }
        .info-item {
            padding: 8px;
            border: 1px solid var(--color-gray-200);
            background: var(--color-bg-card-light);
        }
        .info-label {
            font-weight: bold;
            display: block;
            margin-bottom: 4px;
            font-size: 10pt;
            color: var(--color-gray-700);
        }
        .info-value {
            font-size: 14pt;
            font-weight: bold;
            color: var(--color-gray-900);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background: var(--color-gray-900);
            color: var(--color-bg-card-light);
            padding: 10px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid var(--color-gray-900);
            font-size: 10pt;
        }
        td {
            padding: 10px 8px;
            text-align: center;
            border: 1px solid var(--color-gray-900);
            vertical-align: middle;
        }
        tr:nth-child(even) {
            background: var(--color-gray-100);
        }
        .checkbox-cell {
            width: 40px;
            padding: 8px;
        }
        .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid var(--color-gray-900);
            border-radius: 3px;
            display: inline-block;
            cursor: pointer;
        }
        .type-product {
            color: var(--color-accent-green-600);
            font-weight: bold;
        }
        .type-part {
            color: var(--color-error-600);
            font-weight: bold;
        }
        .section-header {
            background: var(--color-gray-200);
            font-weight: bold;
            padding: 8px;
            text-align: center;
            border: 1px solid var(--color-gray-900);
        }
        .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 2px solid var(--color-gray-900);
            text-align: center;
            font-size: 10pt;
            color: var(--color-gray-700);
        }
        .footer-label {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .hub-label {
            font-weight: bold;
            font-size: 11pt;
            margin-top: 8px;
            color: var(--color-gray-900);
        }
        .tickets-cost {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            margin-top: 4px;
        }
        .tickets-cost th,
        .tickets-cost td {
            padding: 8px;
            border: 1px solid var(--color-gray-900);
            text-align: center;
            font-size: 10pt;
        }
        .tickets-cost .cost-cell {
            unicode-bidi: isolate;
        }
        .tickets-cost .cost-cell-inner {
            display: inline-flex;
            align-items: baseline;
            gap: 0.2em;
            justify-content: center;
            flex-wrap: wrap;
        }
        .tickets-cost .cost-total-row td {
            text-align: right;
            padding: 10px 12px;
            background: var(--color-gray-100);
        }
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="brand-container">
                <span class="brand">HVAR</span>
                <span class="brand-separator">-</span>
                <span class="brand-arabic">هفار</span>
            </div>
            <div class="document-type">${printLabels.title}</div>
            <div class="date-info">
                <div class="date-day">${escapeHtml((() => {
                    const now = new Date();
                    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    return days[now.getDay()];
                })())}</div>
                <div class="date-details">
                    ${escapeHtml(new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }))} - 
                    ${escapeHtml(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }))}
                </div>
            </div>
        </div>
        
        <div class="info">
            <div class="info-item">
                <div class="info-label">عدد التذاكر</div>
                <div class="info-value">${escapeHtml(String(tickets.length))}</div>
            </div>
            <div class="info-item">
                <div class="info-label">عدد العناصر</div>
                <div class="info-value">${escapeHtml(String(aggregatedItems.length))}</div>
            </div>
            <div class="info-item">
                <div class="info-label">إجمالي الكمية</div>
                <div class="info-value">${escapeHtml(String(aggregatedItems.reduce((sum, item) => sum + item.quantity, 0)))}</div>
            </div>
        </div>

        ${ticketsCostSection}

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th class="checkbox-cell">✓</th>
                </tr>
            </thead>
            <tbody>
                ${(() => {
                    const products = aggregatedItems.filter(item => item.type === 'product');
                    const parts = aggregatedItems.filter(item => item.type === 'part');
                    const others = aggregatedItems.filter(item => item.type !== 'product' && item.type !== 'part');
                    
                    let html = '';
                    let rowIndex = 1;
                    
                    // Products section
                    if (products.length > 0) {
                        const productTotalQty = products.reduce((sum, item) => sum + item.quantity, 0);
                        html += `<tr class="section-header"><td colspan="6">${escapeHtml('المنتجات (' + products.length + ' عنصر - ' + productTotalQty + ' قطعة)')}</td></tr>`;
                        products.forEach(item => {
                            html += `
                                <tr>
                                    <td>${escapeHtml(String(rowIndex++))}</td>
                                    <td>${escapeHtml(item.sku || '-')}</td>
                                    <td>${escapeHtml(item.name || '-')}</td>
                                    <td class="type-product">منتج</td>
                                    <td><strong>${escapeHtml(String(item.quantity))}</strong></td>
                                    <td class="checkbox-cell"><div class="checkbox"></div></td>
                                </tr>
                            `;
                        });
                    }
                    
                    // Parts section
                    if (parts.length > 0) {
                        const partTotalQty = parts.reduce((sum, item) => sum + item.quantity, 0);
                        html += `<tr class="section-header"><td colspan="6">${escapeHtml('القطع (' + parts.length + ' عنصر - ' + partTotalQty + ' قطعة)')}</td></tr>`;
                        parts.forEach(item => {
                            html += `
                                <tr>
                                    <td>${escapeHtml(String(rowIndex++))}</td>
                                    <td>${escapeHtml(item.sku || '-')}</td>
                                    <td>${escapeHtml(item.name || '-')}</td>
                                    <td class="type-part">قطعة</td>
                                    <td><strong>${escapeHtml(String(item.quantity))}</strong></td>
                                    <td class="checkbox-cell"><div class="checkbox"></div></td>
                                </tr>
                            `;
                        });
                    }
                    
                    // Others section (if any)
                    if (others.length > 0) {
                        const otherTotalQty = others.reduce((sum, item) => sum + item.quantity, 0);
                        html += `<tr class="section-header"><td colspan="6">${escapeHtml('أخرى (' + others.length + ' عنصر - ' + otherTotalQty + ' قطعة)')}</td></tr>`;
                        others.forEach(item => {
                            html += `
                                <tr>
                                    <td>${escapeHtml(String(rowIndex++))}</td>
                                    <td>${escapeHtml(item.sku || '-')}</td>
                                    <td>${escapeHtml(item.name || '-')}</td>
                                    <td>${escapeHtml(item.type || '-')}</td>
                                    <td><strong>${escapeHtml(String(item.quantity))}</strong></td>
                                    <td class="checkbox-cell"><div class="checkbox"></div></td>
                                </tr>
                            `;
                        });
                    }
                    
                    return html;
                })()}
            </tbody>
        </table>

        <div class="footer">
            <div class="footer-label">تم الإنشاء في: ${escapeHtml(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }))}</div>
            <div class="hub-label">مركز التوزيع - HVAR Hub</div>
        </div>
    </div>
</body>
</html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        }, 250);
    };

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title={prepLabels.title}
                    subtitle={prepLabels.subtitle}
                    icon={Package}
                    iconColor="from-orange-500 to-orange-600"
                    onClose={onClose}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4" dir="rtl">
                {/* Summary Info - Compact Cards */}
                {aggregatedItems.length > 0 && (() => {
                    const products = aggregatedItems.filter(item => item.type === 'product');
                    const parts = aggregatedItems.filter(item => item.type === 'part');
                    const totalQuantity = aggregatedItems.reduce((sum, item) => sum + item.quantity, 0);
                    const productQuantity = products.reduce((sum, item) => sum + item.quantity, 0);
                    const partQuantity = parts.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Tickets Count */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700/50 shadow-sm">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="p-2 bg-blue-500/10 dark:bg-blue-400/20 rounded-lg">
                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-cairo font-medium">عدد التذاكر</div>
                                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300 font-cairo mt-0.5">
                                            {tickets.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Count */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700/50 shadow-sm">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="p-2 bg-purple-500/10 dark:bg-purple-400/20 rounded-lg">
                                        <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-purple-600 dark:text-purple-400 font-cairo font-medium">عدد العناصر</div>
                                        <div className="text-xl font-bold text-purple-700 dark:text-purple-300 font-cairo mt-0.5">
                                            {aggregatedItems.length}
                                        </div>
                                        <div className="text-[10px] text-purple-500 dark:text-purple-400 font-cairo mt-0.5">
                                            {products.length} منتج • {parts.length} قطعة
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Quantity */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700/50 shadow-sm">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="p-2 bg-orange-500/10 dark:bg-orange-400/20 rounded-lg">
                                        <Box className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-orange-600 dark:text-orange-400 font-cairo font-medium">إجمالي الكمية</div>
                                        <div className="text-xl font-bold text-orange-700 dark:text-orange-300 font-cairo mt-0.5">
                                            {totalQuantity}
                                        </div>
                                        <div className="text-[10px] text-orange-500 dark:text-orange-400 font-cairo mt-0.5">
                                            {productQuantity} منتج • {partQuantity} قطعة
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Items Table */}
                {aggregatedItems.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-cairo">
                            لا توجد عناصر للتحضير
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">
                                            #
                                        </th>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">
                                            SKU
                                        </th>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">
                                            الاسم
                                        </th>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">
                                            النوع
                                        </th>
                                        <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">
                                            الكمية
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {(() => {
                                        const products = aggregatedItems.filter(item => item.type === 'product');
                                        const parts = aggregatedItems.filter(item => item.type === 'part');
                                        const others = aggregatedItems.filter(item => item.type !== 'product' && item.type !== 'part');
                                        
                                        let rows = [];
                                        let rowIndex = 1;
                                        
                                        // Products section
                                        if (products.length > 0) {
                                            const productTotalQty = products.reduce((sum, item) => sum + item.quantity, 0);
                                            rows.push(
                                                <tr key="section-products" className="bg-green-50 dark:bg-green-900/20">
                                                    <td colSpan="5" className="px-4 py-2 text-sm font-bold text-green-700 dark:text-green-300 font-cairo border-b-2 border-green-200 dark:border-green-700">
                                                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                                            <Box className="w-4 h-4" />
                                                            <span>المنتجات ({products.length} عنصر - {productTotalQty} قطعة)</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                            products.forEach((item, idx) => {
                                                rows.push(
                                                    <tr key={`product-${item.item_id || item.sku || idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {rowIndex++}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.sku || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.name || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-cairo">
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                منتج
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-bold text-orange-600 dark:text-orange-400 font-cairo">
                                                            {item.quantity}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        }
                                        
                                        // Parts section
                                        if (parts.length > 0) {
                                            const partTotalQty = parts.reduce((sum, item) => sum + item.quantity, 0);
                                            rows.push(
                                                <tr key="section-parts" className="bg-red-50 dark:bg-red-900/20">
                                                    <td colSpan="5" className="px-4 py-2 text-sm font-bold text-red-700 dark:text-red-300 font-cairo border-b-2 border-red-200 dark:border-red-700">
                                                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                                            <Wrench className="w-4 h-4" />
                                                            <span>القطع ({parts.length} عنصر - {partTotalQty} قطعة)</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                            parts.forEach((item, idx) => {
                                                rows.push(
                                                    <tr key={`part-${item.item_id || item.sku || idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {rowIndex++}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.sku || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.name || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-cairo">
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                قطعة
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-bold text-orange-600 dark:text-orange-400 font-cairo">
                                                            {item.quantity}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        }
                                        
                                        // Others section (if any)
                                        if (others.length > 0) {
                                            const otherTotalQty = others.reduce((sum, item) => sum + item.quantity, 0);
                                            rows.push(
                                                <tr key="section-others" className="bg-gray-100 dark:bg-gray-700">
                                                    <td colSpan="5" className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 font-cairo border-b-2 border-gray-300 dark:border-gray-600">
                                                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                                            <Package className="w-4 h-4" />
                                                            <span>أخرى ({others.length} عنصر - {otherTotalQty} قطعة)</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                            others.forEach((item, idx) => {
                                                rows.push(
                                                    <tr key={`other-${item.item_id || item.sku || idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {rowIndex++}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.sku || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                            {item.name || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-cairo">
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                                {item.type || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm font-bold text-orange-600 dark:text-orange-400 font-cairo">
                                                            {item.quantity}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        }
                                        
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Print Button */}
                        <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handlePrint}
                                className="flex items-center space-x-2 space-x-reverse px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-cairo font-medium transition-colors duration-200"
                            >
                                <Printer className="w-5 h-5" />
                                <span>طباعة القائمة</span>
                            </button>
                        </div>
                    </>
                )}
                </div>
            </div>
        </ServiceModalWrapper>
    );
};

export default ReplacementPreparationItemsModal;


