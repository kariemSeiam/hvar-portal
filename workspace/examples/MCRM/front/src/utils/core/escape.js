/**
 * Escape a value for safe interpolation into HTML (e.g. print templates).
 * Prevents XSS when building HTML strings from user/API data.
 *
 * @param {string|number|null|undefined} str - Value to escape
 * @returns {string} Escaped string, or empty string for null/undefined
 */
export function escapeHtml(str) {
    if (str == null) return '';
    const s = String(str);
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escape a value for safe use inside a JavaScript string literal (e.g. in generated script tags).
 * Use when interpolating into single-quoted JS strings.
 * Escapes \ and ' for JS, and < to \u003c so </script> cannot break out of the script block in HTML.
 *
 * @param {string|number|null|undefined} str - Value to escape
 * @returns {string} Escaped string, or empty string for null/undefined
 */
export function escapeForJsString(str) {
    if (str == null) return '';
    const s = String(str);
    return s
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/</g, '\\u003c');
}
