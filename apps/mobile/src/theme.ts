import { StyleSheet, type TextStyle } from 'react-native';
import type { Verdict } from '@halal-o/engine';

/**
 * Permito's look: a pocket checker for reading the small print in a supermarket aisle.
 * One typeface, Atkinson Hyperlegible Next (drawn by the Braille Institute for low-vision
 * reading), cool neutral surfaces, and colour spent only on verdicts.
 */
export const color = {
  ink: '#10231B',
  inkMuted: '#4A5B53',
  canvas: '#F1F4F2',
  paper: '#FFFFFF',
  line: '#D9E0DC',
  pine: '#0E5C40',
  pinePressed: '#0A4630',
} as const;

/** fg is used for text and fills (all at least 4.5:1 with white), tint for panels, mark for highlighting words. */
export const verdictColor: Record<Verdict, { label: string; fg: string; tint: string; mark: string }> = {
  halal: { label: 'Halal', fg: '#157A4A', tint: '#E4F3EA', mark: '#BFE3CC' },
  haram: { label: 'Haram', fg: '#B3261E', tint: '#FCE8E6', mark: '#F6C4BF' },
  mushbooh: { label: 'Mushbooh', fg: '#8A5300', tint: '#FFF1D6', mark: '#FFD98A' },
  unknown: { label: 'Not enough information', fg: '#4A5B53', tint: '#ECEFED', mark: '#D9E0DC' },
};

export const font = {
  regular: 'AtkinsonHyperlegibleNext_400Regular',
  medium: 'AtkinsonHyperlegibleNext_500Medium',
  bold: 'AtkinsonHyperlegibleNext_700Bold',
  heavy: 'AtkinsonHyperlegibleNext_800ExtraBold',
} as const;

/** Type scale (pt). Body is 17 so ingredient lists stay readable at arm's length. */
export const type = StyleSheet.create({
  verdict: { fontFamily: font.heavy, fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, color: color.ink, letterSpacing: -0.3 },
  heading: { fontFamily: font.bold, fontSize: 20, lineHeight: 26, color: color.ink },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 25, color: color.ink },
  bodyStrong: { fontFamily: font.bold, fontSize: 17, lineHeight: 25, color: color.ink },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: color.inkMuted },
  smallStrong: { fontFamily: font.bold, fontSize: 14, lineHeight: 20, color: color.inkMuted },
  link: { fontFamily: font.medium, fontSize: 17, lineHeight: 25, color: color.pine, textDecorationLine: 'underline' },
} satisfies Record<string, TextStyle>);

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

/** Apple's minimum touch target, in points. */
export const TOUCH = 44;

export const headerOptions = {
  headerStyle: { backgroundColor: color.canvas },
  headerShadowVisible: false,
  headerTintColor: color.pine,
  headerTitleStyle: { fontFamily: font.bold, color: color.ink, fontSize: 17 },
  contentStyle: { backgroundColor: color.canvas },
};
