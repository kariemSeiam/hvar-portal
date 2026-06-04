/**
 * Unit tests for buildPrintHtml.
 * Locks in XSS prevention: all dynamic content must be escaped in the print HTML.
 */
import { describe, it, expect } from 'vitest';
import { buildPrintHtml } from '../src/components/modals/ServiceModalViewer/printHtml.js';

describe('buildPrintHtml', () => {
    it('escapes HTML entities in customer name, address, and notes', () => {
        const ticket = {
            ticket_number: 'T-001',
            service_type: 'maintenance',
            customer_name: 'O\'Brien & Co. <script>alert(1)</script> "quoted"',
            customer_address: 'Street <img src=x onerror=alert(1)> "addr"',
            notes: 'Note with & and <tag> and "quotes"',
            city: 'City & Co.',
            governorate: 'Gov\'t',
            items: [],
            available_actions: [],
        };
        const html = buildPrintHtml(ticket);

        // Ampersand escaped
        expect(html).toContain('&amp;');
        // LT/GT escaped
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
        // Double quote escaped
        expect(html).toContain('&quot;');
        // Single quote escaped (&#39;)
        expect(html).toContain('&#39;');

        // No raw script tag in output (content is escaped as &lt;script&gt; etc.)
        expect(html).not.toMatch(/<script[^>]*>alert\(1\)<\/script>/i);
        expect(html).not.toContain('<script>alert(1)</script>');
    });

    it('escapes item names and SKUs in tables', () => {
        const ticket = {
            ticket_number: 'T-002',
            service_type: 'sell',
            customer_name: 'Customer',
            items: [
                {
                    item_name: 'Item <script>evil</script>',
                    sku: 'SKU\'s & Co.',
                    quantity: 1,
                    direction: 'send',
                    type: 'part',
                    condition: 'valid',
                },
            ],
            available_actions: [],
        };
        const html = buildPrintHtml(ticket);

        expect(html).toContain('&lt;script&gt;evil&lt;/script&gt;');
        expect(html).toContain('&#39;s');
        expect(html).toContain('&amp;');
        expect(html).not.toContain('<script>evil</script>');
    });

    it('escapes double quotes in address so they do not break attribute context', () => {
        const ticket = {
            ticket_number: 'T-003',
            service_type: 'maintenance',
            customer_name: 'Normal Name',
            customer_address: 'Address with "break" quotes',
            items: [],
            available_actions: [],
        };
        const html = buildPrintHtml(ticket);
        // Address should be escaped so we see &quot; not raw " in content
        expect(html).toContain('&quot;break&quot;');
        expect(html).not.toContain('"break"');
    });

    it('escapes tracking numbers and ticket number in HTML and JS context', () => {
        const ticket = {
            ticket_number: 'T-<script>',
            service_type: 'maintenance',
            new_tracking_send: "TRK'quote",
            new_tracking_receive: null,
            customer_name: '-',
            items: [],
            available_actions: ['scan_outbound'],
        };
        const html = buildPrintHtml(ticket);

        // HTML-escaped in visible parts (e.g. ticket number in title/body)
        expect(html).toContain('&lt;script&gt;');
        // JS string escaping for barcode: single quote in value must appear as \'
        expect(html).toContain("TRK\\'quote");
    });

    it('escapes tracking so </script> does not appear in script block', () => {
        const ticket = {
            ticket_number: 'T-004',
            service_type: 'maintenance',
            new_tracking_send: '</script><script>alert(1)</script>',
            new_tracking_receive: null,
            customer_name: '-',
            items: [],
            available_actions: ['scan_outbound'],
        };
        const html = buildPrintHtml(ticket);

        // Barcode value in script must use \\u003c so HTML parser never sees literal </script>
        expect(html).toContain('\\u003c/script>');
    });

    it('handles null/undefined ticket fields without throwing', () => {
        const ticket = {
            ticket_number: null,
            customer_name: undefined,
            customer_address: null,
            notes: undefined,
            items: null,
        };
        expect(() => buildPrintHtml(ticket)).not.toThrow();
        const html = buildPrintHtml(ticket);
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    it('includes cost row when cost_adjustment is set (تحصيل / استرداد + ج.م)', () => {
        const ticket = {
            ticket_number: 'T-COST',
            service_type: 'replacement',
            customer_name: 'X',
            cost_adjustment: '-1850.5',
            items: [],
            available_actions: [],
        };
        const html = buildPrintHtml(ticket);
        expect(html).toContain('استرداد');
        expect(html).toContain('ج.م');
        expect(html).toMatch(/info-cost-num[^>]*dir="ltr"/);
    });

    it('does not inject raw cost_adjustment text (non-numeric parses to zero)', () => {
        const ticket = {
            ticket_number: 'T-1',
            service_type: 'maintenance',
            customer_name: '-',
            cost_adjustment: '<script>alert(1)</script>',
            items: [],
            available_actions: [],
        };
        const html = buildPrintHtml(ticket);
        expect(html).toContain('التكلفة');
        expect(html).not.toContain('<script>alert(1)</script>');
    });
});
