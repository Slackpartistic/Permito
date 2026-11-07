import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISCLAIMER, VERDICT_HELP } from '@/lib/copy';
import { color, font, space, type, verdictColor } from '@/theme';
import { Button } from './ui';

/** Shown on first launch, and again whenever DISCLAIMER_VERSION changes. */
export function Welcome({ onAccept }: { onAccept: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.wordmark} accessibilityRole="header">
          Permito
        </Text>
        <Text style={type.body}>Scan a food barcode and Permito reads the ingredients for you. Every product gets one of three verdicts.</Text>

        <View style={styles.verdicts}>
          {VERDICT_HELP.map((v) => (
            <View key={v.key} style={[styles.verdict, { backgroundColor: verdictColor[v.key].tint, borderLeftColor: verdictColor[v.key].fg }]}>
              <Text style={[styles.verdictWord, { color: verdictColor[v.key].fg }]}>{v.label}</Text>
              <Text style={type.body}>{v.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={type.heading}>Before you start</Text>
          <Text style={type.body}>{DISCLAIMER}</Text>
          <Text style={type.body}>
            Product data comes from Open Food Facts, which anyone can edit, so it can be missing or out of date. Always check the pack.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="I understand" onPress={onAccept} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.canvas },
  container: { padding: space.xl, gap: space.xl },
  wordmark: { fontFamily: font.heavy, fontSize: 44, lineHeight: 50, color: color.pine, letterSpacing: -1, marginTop: space.l },
  verdicts: { gap: space.s },
  verdict: { borderLeftWidth: 6, borderRadius: 4, padding: space.l, gap: space.xs },
  verdictWord: { fontFamily: font.heavy, fontSize: 22, lineHeight: 28 },
  note: { gap: space.m },
  footer: { paddingHorizontal: space.xl, paddingVertical: space.l },
});
