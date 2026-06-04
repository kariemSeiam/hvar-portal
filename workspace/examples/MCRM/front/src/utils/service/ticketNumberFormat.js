/**
 * Backend ticket numbers (service_manager._generate_ticket_number):
 *   HV{TYPE}{YYMMDD}{NNN}  e.g. HVS260405001  (sell · 2026-04-05 · seq 001)
 * TYPE: R=replacement, M=maintenance, T=return, S=sell
 */

const HV_COMPACT_RE = /^HV([RMTS])(\d{2})(\d{2})(\d{2})(\d{3})$/i;

/** Arabic labels for the type letter (tooltip / a11y) */
export const HV_TYPE_LETTER_LABEL_AR = Object.freeze({
    R: 'استبدال',
    M: 'صيانة',
    T: 'إرجاع',
    S: 'مبيعات',
});

/**
 * @param {unknown} ticketNumber
 * @returns {{
 *   prefix: string,
 *   dotted: string,
 *   full: string,
 *   hv: string,
 *   typeLetter: string,
 *   yy: string,
 *   mm: string,
 *   dd: string,
 *   seq: string,
 * } | null}
 */
export function parseHVticketNumber(ticketNumber) {
    if (ticketNumber === undefined || ticketNumber === null) return null;
    const s = String(ticketNumber).trim();
    if (!s) return null;
    const m = s.match(HV_COMPACT_RE);
    if (!m) return null;
    const typeLetter = m[1].toUpperCase();
    const yy = m[2];
    const mm = m[3];
    const dd = m[4];
    const seq = m[5];
    const prefix = `HV${typeLetter}`;
    const dotted = `${yy} · ${mm} · ${dd} · ${seq}`;
    const full = `HV${typeLetter}${yy}${mm}${dd}${seq}`;
    return {
        prefix,
        dotted,
        full,
        hv: 'HV',
        typeLetter,
        yy,
        mm,
        dd,
        seq,
    };
}
