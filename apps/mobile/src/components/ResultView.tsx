import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { annotateIngredients, type Reason, type Result, type Verdict } from '@halal-o/engine';
import { DISCLAIMER } from '@/lib/copy';
import { getReference } from '@/lib/engine';
import { color, font, space, TOUCH, type, verdictColor } from '@/theme';

/** Kept for screens that only need a verdict's name and colour. */
export const VERDICT_STYLE: Record<Verdict, { label: string; color: string }> = Object.fromEntries(
  Object.entries(verdictColor).map(([k, v]) => [k, { label: v.label, color: v.fg }]),
) as Record<Verdict, { label: string; color: string }>;

const STRICT = { halal: 0, mushbooh: 1, haram: 2 } as const;

/** The same ingredient can match several entries (e.g. "pork gelatine" is pork and E428); show it once. */
interface Finding {
  ingredientText: string;
  verdict: Reason['verdict'];
  rationales: string[];
  contested: string[];
  origin?: string;
  refs: string[];
}

function group(reasons: Reason[]): Finding[] {
  const byText = new Map<string, Finding>();
  for (const r of reasons) {
    const key = r.ingredientText.trim().toLowerCase();
    const f = byText.get(key) ?? { ingredientText: r.ingredientText, verdict: r.verdict, rationales: [], contested: [], refs: [] };
    if (STRICT[r.verdict] > STRICT[f.verdict]) f.verdict = r.verdict;
    if (!f.rationales.includes(r.rationale)) f.rationales.push(r.rationale);
    if (r.contested && !f.contested.includes(r.contested)) f.contested.push(r.contested);
    if (r.origin) f.origin = r.origin;
    for (const id of r.refs) if (!f.refs.includes(id)) f.refs.push(id);
    byText.set(key, f);
  }
  return [...byText.values()].sort((a, b) => STRICT[b.verdict] - STRICT[a.verdict]);
}

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

function summary(result: Result, findings: Finding[]): string {
  if (result.correction) return `Checked by the Permito team on ${result.correction.reviewed}.`;
  if (result.certified) return "Halal logo reported on the pack. Check it's from a certifier you trust.";
  const haram = findings.filter((f) => f.verdict === 'haram').map((f) => f.ingredientText);
  const doubtful = findings.filter((f) => f.verdict === 'mushbooh').map((f) => f.ingredientText);
  switch (result.verdict) {
    case 'haram':
      return `Not permissible: ${list(haram)}.`;
    case 'mushbooh':
      return `The label doesn't say where ${list(doubtful)} ${doubtful.length === 1 ? 'comes' : 'come'} from.`;
    case 'unknown':
      return "We couldn't find an ingredient list for this product.";
    case 'halal':
      return result.confidence === 'high'
        ? 'No problem ingredients found.'
        : "No problem ingredients found, but some ingredients aren't in our list. Check the label.";
  }
}

export function VerdictPanel({ result }: { result: Result }) {
  const findings = useMemo(() => group(result.reasons.filter((r) => r.verdict !== 'halal')), [result]);
  const v = verdictColor[result.verdict];
  const text = summary(result, findings);
  return (
    <View
      style={[styles.panel, { backgroundColor: v.tint, borderLeftColor: v.fg }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Verdict: ${v.label}. ${text}`}
    >
      <Text style={[type.verdict, { color: v.fg }, result.verdict === 'unknown' && styles.verdictLong]}>{v.label}</Text>
      <Text style={type.body}>{text}</Text>
    </View>
  );
}

/** The ingredient list as printed, with the words behind the verdict marked. */
export function AnnotatedIngredients({ text, reasons }: { text: string; reasons: Reason[] }) {
  const segments = useMemo(() => annotateIngredients(text, reasons), [text, reasons]);
  if (segments.length === 0) return null;
  const present = new Set(segments.map((s) => s.verdict).filter(Boolean));
  return (
    <View style={styles.section}>
      <Text style={type.heading}>Ingredients on the pack</Text>
      <View style={styles.sheet}>
        <Text style={styles.ingredients} selectable>
          {segments.map((s, i) =>
            s.verdict ? (
              <Text
                key={i}
                style={[styles.marked, { backgroundColor: verdictColor[s.verdict].mark }, s.verdict === 'haram' ? styles.markHaram : styles.markDoubt]}
              >
                {s.text}
              </Text>
            ) : (
              <Text key={i}>{s.text}</Text>
            ),
          )}
        </Text>
        {present.size > 0 ? (
          <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {(['haram', 'mushbooh'] as const)
              .filter((k) => present.has(k))
              .map((k) => (
                <View key={k} style={styles.legendItem}>
                  <Text style={[styles.swatch, { backgroundColor: verdictColor[k].mark }, k === 'haram' ? styles.markHaram : styles.markDoubt]}>
                    abc
                  </Text>
                  <Text style={type.small}>{k === 'haram' ? 'Not permissible' : 'Source unclear'}</Text>
                </View>
              ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function FindingRow({ finding, first }: { finding: Finding; first: boolean }) {
  const refs = getReference().references;
  const v = verdictColor[finding.verdict];
  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <View style={styles.rowHead}>
        <Text style={[type.bodyStrong, styles.flex]}>{finding.ingredientText}</Text>
        <Text style={[styles.rowVerdict, { color: v.fg }]}>{v.label}</Text>
      </View>
      {finding.rationales.map((r) => (
        <Text key={r} style={type.body}>
          {r}
        </Text>
      ))}
      {finding.origin ? <Text style={type.small}>The label says it comes from: {finding.origin.replace(/_/g, ' ')}.</Text> : null}
      {finding.contested.map((c) => (
        <Text key={c} style={type.small}>
          Other views: {c}
        </Text>
      ))}
      {finding.refs.map((id) => {
        const ref = refs[id];
        return ref ? (
          <Pressable key={id} onPress={() => Linking.openURL(ref.url)} accessibilityRole="link" style={styles.source} hitSlop={4}>
            <Text style={styles.sourceText}>{ref.title}</Text>
          </Pressable>
        ) : null;
      })}
    </View>
  );
}

function Collapsible({ title, items, first }: { title: string; items: string[]; first?: boolean }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <View style={[styles.collapsible, !first && styles.rowDivider]}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${items.length}`}
        style={styles.collapsibleHead}
      >
        <Text style={[type.bodyStrong, styles.flex]}>{title}</Text>
        <Text style={type.small}>
          {items.length} {open ? '▴' : '▾'}
        </Text>
      </Pressable>
      {open ? <Text style={[type.body, styles.collapsibleBody]}>{items.join(', ')}</Text> : null}
    </View>
  );
}

/** Everything below the product header: verdict, the marked-up label, why, what was assumed, and the disclaimer. */
export function ResultView({ result, ingredientsText }: { result: Result; ingredientsText?: string | null }) {
  const flagged = useMemo(() => group(result.reasons.filter((r) => r.verdict !== 'halal')), [result]);
  const upgraded = useMemo(() => group(result.reasons.filter((r) => r.verdict === 'halal')), [result]);
  const hasExtras = result.assumedHalal.length + result.notChecked.length > 0;
  return (
    <View style={styles.container}>
      <VerdictPanel result={result} />

      {result.correction ? (
        <View style={[styles.sheet, styles.correction]}>
          <Text style={type.bodyStrong}>Reviewed after a report</Text>
          <Text style={type.body}>{result.correction.note}</Text>
          {result.correction.issue ? (
            <Pressable onPress={() => Linking.openURL(result.correction!.issue!)} accessibilityRole="link" style={styles.source}>
              <Text style={styles.sourceText}>See the report</Text>
            </Pressable>
          ) : null}
          <Text style={type.small}>This review replaces the ingredient check below.</Text>
        </View>
      ) : null}

      {ingredientsText ? <AnnotatedIngredients text={ingredientsText} reasons={result.reasons} /> : null}

      {flagged.length > 0 ? (
        <View style={styles.section}>
          <Text style={type.heading}>{result.certified ? 'Would otherwise be flagged' : 'Why'}</Text>
          <View style={styles.sheet}>
            {flagged.map((f, i) => (
              <FindingRow key={f.ingredientText} finding={f} first={i === 0} />
            ))}
          </View>
        </View>
      ) : null}

      {upgraded.length > 0 ? (
        <View style={styles.section}>
          <Text style={type.heading}>Counted as halal because of the vegan label</Text>
          <View style={styles.sheet}>
            {upgraded.map((f, i) => (
              <FindingRow key={f.ingredientText} finding={f} first={i === 0} />
            ))}
          </View>
        </View>
      ) : null}

      {hasExtras ? (
        <View style={styles.collapsibles}>
          <Collapsible title="Assumed halal" items={result.assumedHalal} first />
          <Collapsible title="Plain foods we don't list" items={result.notChecked} first={result.assumedHalal.length === 0} />
        </View>
      ) : null}

      <Text style={[type.small, styles.disclaimer]}>{DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xl },
  flex: { flex: 1 },
  panel: { borderLeftWidth: 6, borderRadius: 4, paddingVertical: space.l, paddingHorizontal: space.l, gap: space.s },
  verdictLong: { fontSize: 30, lineHeight: 36 },
  section: { gap: space.s },
  sheet: { backgroundColor: color.paper, borderRadius: 12, padding: space.l, gap: space.m },
  correction: { borderWidth: 1.5, borderColor: color.pine },
  ingredients: { fontFamily: font.regular, fontSize: 17, lineHeight: 30, color: color.ink },
  marked: { fontFamily: font.bold },
  markHaram: { textDecorationLine: 'line-through', textDecorationColor: verdictColor.haram.fg },
  markDoubt: { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: verdictColor.mushbooh.fg },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.l, borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.m },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  swatch: { fontFamily: font.bold, fontSize: 14, color: color.ink, paddingHorizontal: 2 },
  row: { gap: space.s },
  rowDivider: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.m },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.m },
  rowVerdict: { fontFamily: font.bold, fontSize: 15 },
  source: { minHeight: 32, justifyContent: 'center' },
  sourceText: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: color.pine, textDecorationLine: 'underline' },
  collapsibles: { backgroundColor: color.paper, borderRadius: 12, paddingHorizontal: space.l },
  collapsible: {},
  collapsibleHead: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center' },
  collapsibleBody: { paddingBottom: space.l, color: color.inkMuted },
  disclaimer: { paddingHorizontal: space.xs },
});
