/**
 * Formats call-center RMT notes for ticket print HTML (ServiceModalViewer).
 * Splits «استبدال|صيانة|إرجاع — هنسلم:» / «… — هنستلم:» so نوع الخدمة + — is on its own line, then each direction line.
 * Order follows the stored text (صيانة: هنستلم ثم هنسلم as in buildRmtCallAutoBlock).
 */
import { escapeHtml } from '../core/escape';
import { getSafeNotesDisplay } from '../ui/notes';
import { splitCallNotesForDisplay } from './rmtNotes';

/** First line merges TYPE — with first هنسلم/هنستلم segment → split into two lines for print. */
const TYPE_AND_FIRST_DIRECTION = /^(استبدال|صيانة|إرجاع)\s*[—–-]\s*((?:هنسلم|هنستلم)\s*:.+)$/;

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function expandMergedTypeLine(lines) {
  const out = [];
  for (const line of lines) {
    const trimmed = String(line).trim();
    if (!trimmed) continue;
    const m = trimmed.match(TYPE_AND_FIRST_DIRECTION);
    if (m) {
      out.push(`${m[1]} —`);
      out.push(m[2].trim());
    } else {
      out.push(trimmed);
    }
  }
  return out;
}

/**
 * Returns full escaped HTML fragment for the notes box, or empty string.
 * @param {string|null|undefined} notesRaw
 * @returns {string}
 */
export function buildNotesHtmlForPrint(notesRaw) {
  const safe = getSafeNotesDisplay(notesRaw);
  if (!safe) return '';

  const { before, afterReason } = splitCallNotesForDisplay(safe);
  const beforeLines = before ? expandMergedTypeLine(before.split(/\r?\n/)) : [];
  const bodyInner = beforeLines.map((p) => escapeHtml(p)).join('<br/>');

  let html = `<div class="notes">
            <div class="notes-label">الملاحظات:</div>`;

  if (bodyInner) {
    html += `
            <div class="notes-body">${bodyInner}</div>`;
  }

  if (afterReason !== null) {
    const sab = escapeHtml(afterReason.trim() || '—');
    html += `
            <div class="notes-sabab">
                <div class="notes-sabab-label">السبب</div>
                <div class="notes-sabab-text">${sab}</div>
            </div>`;
  }

  html += `
        </div>`;
  return html;
}
