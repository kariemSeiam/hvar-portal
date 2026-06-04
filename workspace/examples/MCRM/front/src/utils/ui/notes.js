/**
 * Safe notes display utilities.
 * Handles non-string, empty, and obvious placeholder/garbage from API.
 */

/**
 * Returns a safe string for display, or null if notes should not be shown.
 * - null/undefined → null
 * - non-string (object, number) → null
 * - empty or whitespace-only → null
 * - obvious lorem/placeholder (long, few spaces, high char repetition) → null
 * - valid string → trimmed
 */
export function getSafeNotesDisplay(notes) {
    if (notes == null || notes === undefined) return null;
    if (typeof notes !== 'string') return null;
    const trimmed = notes.trim();
    if (!trimmed) return null;
    if (looksLikePlaceholder(trimmed)) return null;
    return trimmed;
}

/**
 * Conservative heuristic: only filters obvious Arabic lorem/placeholder.
 * Requires ALL: length >= 50, high char repetition (ratio > 7), very few spaces.
 * Valid Arabic notes have word boundaries (spaces) and pass.
 */
function looksLikePlaceholder(str) {
    if (str.length < 50) return false;
    const chars = str.replace(/\s/g, '');
    if (chars.length < 40) return false;
    const spaceCount = (str.match(/\s/g) || []).length;
    const unique = new Set(chars).size;
    const ratio = chars.length / unique;
    const spaceRatio = spaceCount / str.length;
    return ratio > 6 && spaceRatio < 0.08;
}
