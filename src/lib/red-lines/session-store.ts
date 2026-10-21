import type { SavedRedLine } from './actions';

// Used only when no account service is connected. The list lives in this tab's sessionStorage and is gone when the tab closes.
const KEY = 'redline.redLines.session';

export function readSessionRedLines(): SavedRedLine[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is SavedRedLine => !!r && typeof r.id === 'string' && typeof r.text === 'string');
  } catch {
    return [];
  }
}

export function writeSessionRedLines(list: SavedRedLine[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: the list still works for this render, it just will not survive navigation.
  }
}
