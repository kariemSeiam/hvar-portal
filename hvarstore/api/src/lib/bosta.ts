/**
 * Bosta tracking utilities.
 *
 * ERP stores Bosta `bill_code` in transactions.bill_code.
 * We expose the tracking link for customers.
 */

export function trackingUrl(billCode: string): string {
	return `https://bosta.co/ar-eg/tracking-shipments?shipment-number=${encodeURIComponent(billCode)}`;
}
