import { describe, it, expect } from 'vitest';
import { parseHVticketNumber } from '../src/utils/service/ticketNumberFormat.js';

describe('parseHVticketNumber', () => {
    it('parses compact HV ticket (sell)', () => {
        const r = parseHVticketNumber('HVS260405001');
        expect(r).not.toBeNull();
        expect(r.prefix).toBe('HVS');
        expect(r.dotted).toBe('26 · 04 · 05 · 001');
        expect(r.full).toBe('HVS260405001');
        expect(r.hv).toBe('HV');
        expect(r.typeLetter).toBe('S');
        expect(r.yy).toBe('26');
        expect(r.mm).toBe('04');
        expect(r.dd).toBe('05');
        expect(r.seq).toBe('001');
    });

    it('parses replacement type', () => {
        const r = parseHVticketNumber('HVR251020001');
        expect(r?.prefix).toBe('HVR');
        expect(r?.dotted).toBe('25 · 10 · 20 · 001');
    });

    it('returns null for DB id or unknown', () => {
        expect(parseHVticketNumber('42')).toBeNull();
        expect(parseHVticketNumber('HVR-2025-01-01-001')).toBeNull();
    });
});
