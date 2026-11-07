import type { Reason } from './evaluate';
import type { RulingVerdict } from './types';

export interface Segment {
  text: string;
  /** Set on the words of the label that a Haram or Mushbooh finding came from. */
  verdict?: Exclude<RulingVerdict, 'halal'>;
}

const RANK = { mushbooh: 1, haram: 2 } as const;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits the ingredient text as printed on the pack into plain and flagged runs, so the
 * result screen can mark the exact words behind the verdict. Matching is case-insensitive
 * and whole-word; where two findings overlap the stricter one wins. Findings a vegan label
 * upgraded are not marked, and text we can't find (e.g. an additive only listed in
 * additives_tags) is simply left unmarked.
 */
export function annotateIngredients(text: string, reasons: Reason[]): Segment[] {
  if (!text) return [];
  const marks: (0 | 1 | 2)[] = new Array(text.length).fill(0);
  for (const r of reasons) {
    if (r.verdict === 'halal' || r.upgradedByVeganLabel) continue;
    const needle = r.ingredientText.trim();
    if (!needle) continue;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escape(needle)}(?![\\p{L}\\p{N}])`, 'giu');
    for (const m of text.matchAll(re)) {
      const at = m.index ?? 0;
      for (let i = at; i < at + m[0].length; i++) marks[i] = Math.max(marks[i] ?? 0, RANK[r.verdict]) as 0 | 1 | 2;
    }
  }
  const segments: Segment[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marks[i] !== marks[start]) {
      const m = marks[start];
      segments.push(m === 0 ? { text: text.slice(start, i) } : { text: text.slice(start, i), verdict: m === 2 ? 'haram' : 'mushbooh' });
      start = i;
    }
  }
  return segments;
}
