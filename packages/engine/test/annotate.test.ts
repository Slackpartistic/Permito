import { describe, expect, it } from 'vitest';
import { annotateIngredients, type Reason } from '../src';

const reason = (ingredientText: string, verdict: Reason['verdict'], extra: Partial<Reason> = {}): Reason => ({
  ingredientText,
  verdict,
  entryId: null,
  rationale: '',
  refs: [],
  ...extra,
});

describe('annotateIngredients', () => {
  it('marks every flagged word, case-insensitively, and keeps the rest as printed', () => {
    const text = 'Sugar, Pork Gelatine, flavouring, colour (carmine), pork gelatine';
    const segs = annotateIngredients(text, [reason('pork gelatine', 'haram'), reason('flavouring', 'mushbooh'), reason('carmine', 'haram')]);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    expect(segs.filter((s) => s.verdict)).toEqual([
      { text: 'Pork Gelatine', verdict: 'haram' },
      { text: 'flavouring', verdict: 'mushbooh' },
      { text: 'carmine', verdict: 'haram' },
      { text: 'pork gelatine', verdict: 'haram' },
    ]);
  });

  it('only matches whole words', () => {
    const segs = annotateIngredients('graham crackers, ham', [reason('ham', 'haram')]);
    expect(segs.filter((s) => s.verdict).map((s) => s.text)).toEqual(['ham']);
  });

  it('lets the stricter finding win where two overlap', () => {
    const segs = annotateIngredients('beef gelatine', [reason('gelatine', 'mushbooh'), reason('beef gelatine', 'haram')]);
    expect(segs).toEqual([{ text: 'beef gelatine', verdict: 'haram' }]);
  });

  it('skips halal findings and ones a vegan label upgraded', () => {
    const segs = annotateIngredients('E471, sugar', [reason('E471', 'mushbooh', { upgradedByVeganLabel: true }), reason('sugar', 'halal')]);
    expect(segs).toEqual([{ text: 'E471, sugar' }]);
  });

  it('handles regex characters and empty input', () => {
    expect(annotateIngredients('', [reason('x', 'haram')])).toEqual([]);
    const segs = annotateIngredients('colour (E120), salt', [reason('colour (E120)', 'haram')]);
    expect(segs[0]).toEqual({ text: 'colour (E120)', verdict: 'haram' });
  });
});
