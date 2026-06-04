import { describe, it, expect } from 'vitest';
import {
  normalizeServiceType,
  normalizeServiceTypeOrFallback,
  getServiceTypeLabelAr,
  LEGACY_TO_CANONICAL_SERVICE_TYPE,
} from '../src/constants/serviceTypes.js';

describe('normalizeServiceType', () => {
  it('returns canonical types as-is', () => {
    expect(normalizeServiceType('replacement')).toBe('replacement');
    expect(normalizeServiceType('RETURN')).toBe('return');
  });

  it('maps legacy service/action aliases', () => {
    expect(normalizeServiceType('return_from_customer')).toBe('return');
    expect(normalizeServiceType('maintenancing')).toBe('maintenance');
    expect(normalizeServiceType('part_replace')).toBe('replacement');
    expect(normalizeServiceType('full_replace')).toBe('replacement');
  });

  it('returns null for unknown or empty', () => {
    expect(normalizeServiceType('')).toBe(null);
    expect(normalizeServiceType(null)).toBe(null);
    expect(normalizeServiceType('not_a_type')).toBe(null);
  });
});

describe('normalizeServiceTypeOrFallback', () => {
  it('uses fallback for unknown', () => {
    expect(normalizeServiceTypeOrFallback('weird', { fallback: 'sell' })).toBe('sell');
  });
});

describe('getServiceTypeLabelAr', () => {
  it('labels canonical and legacy', () => {
    expect(getServiceTypeLabelAr('return')).toContain('استرجاع');
    expect(getServiceTypeLabelAr('return_from_customer')).toContain('استرجاع');
  });
});

describe('legacy map completeness', () => {
  it('legacy values map to canonical set', () => {
    for (const v of Object.values(LEGACY_TO_CANONICAL_SERVICE_TYPE)) {
      expect(['replacement', 'maintenance', 'return', 'sell']).toContain(v);
    }
  });
});
