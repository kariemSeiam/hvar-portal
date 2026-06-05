const EGYPT_MOBILE = /^01[0125]\d{8}$/;

export function normalizePhone(raw: string): string | null {
	let digits = raw.replace(/\D/g, "");
	if (digits.startsWith("20") && digits.length > 10) {
		digits = digits.slice(2);
	}
	if (digits.length === 10 && digits.startsWith("1")) {
		digits = "0" + digits;
	}
	if (!EGYPT_MOBILE.test(digits)) return null;
	return digits;
}
