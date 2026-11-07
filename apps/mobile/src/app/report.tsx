import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/config';
import { emailUrl, githubIssueUrl, PROBLEMS, type Problem, type Report } from '@/lib/report';
import { color, font, space, TOUCH, type } from '@/theme';

type Params = { barcode?: string; product?: string; verdict?: string; ingredients?: string; problem?: string };

const PLACEHOLDER: Record<Problem, string> = {
  'Verdict looks wrong': 'What should it say, and why? For example: the pack says the E471 is plant-based.',
  'Halal logo on pack': 'Which certifier is on the logo? For example: HMC or HFA.',
  'Ingredients are out of date': 'What does the ingredient list on the pack say now?',
  'Product is missing': 'Product name, brand, and the ingredients from the pack.',
};

/** Report a wrong verdict, a halal logo, stale ingredients or a missing product (docs/SPEC.md §2.4). */
export default function ReportScreen() {
  const p = useLocalSearchParams<Params>();
  const initial = PROBLEMS.find((x) => x === p.problem) ?? (p.verdict ? 'Verdict looks wrong' : 'Product is missing');
  const [problem, setProblem] = useState<Problem>(initial);
  const [details, setDetails] = useState('');

  const report: Report = {
    problem,
    details: details.trim(),
    barcode: p.barcode || undefined,
    product: p.product || undefined,
    appVerdict: p.verdict || undefined,
    ingredients: p.ingredients || undefined,
  };
  const ready = report.details.length > 0;

  const open = async (url: string, what: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(`Couldn't open ${what}`, `Email ${SUPPORT_EMAIL} instead.`);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {report.product || report.barcode ? (
          <View>
            {report.product ? <Text style={type.heading}>{report.product}</Text> : null}
            {report.barcode ? <Text style={type.small}>Barcode {report.barcode}</Text> : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={type.bodyStrong} nativeID="problemLabel">
            What's wrong?
          </Text>
          <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabelledBy="problemLabel">
            {PROBLEMS.map((x, i) => {
              const on = x === problem;
              return (
                <Pressable
                  key={x}
                  style={[styles.option, i > 0 && styles.optionDivider]}
                  onPress={() => setProblem(x)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <Text style={[type.body, on && styles.optionOn]}>{x}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={type.bodyStrong} nativeID="detailsLabel">
            Details
          </Text>
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder={PLACEHOLDER[problem]}
            placeholderTextColor={color.inkMuted}
            accessibilityLabelledBy="detailsLabel"
            accessibilityLabel="Details"
            multiline
            textAlignVertical="top"
          />
          <Text style={type.small}>Photos of the ingredient list and any halal logo help most. You can attach them in the next step.</Text>
        </View>

        <View style={styles.section}>
          <Button
            label="Send by email"
            disabled={!ready}
            onPress={() => open(emailUrl(report), 'your email app')}
            accessibilityHint={ready ? undefined : 'Add details first'}
          />
          <Button
            label="Report on GitHub"
            variant="secondary"
            disabled={!ready}
            onPress={() => open(githubIssueUrl(report), 'GitHub')}
            accessibilityHint={ready ? undefined : 'Add details first'}
          />
          {!ready ? <Text style={type.small}>Add details to send your report.</Text> : null}
        </View>
        <Text style={type.small}>We read every report. If we change a verdict, you'll see it in History.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: space.l, paddingBottom: space.xxl, gap: space.xl },
  section: { gap: space.s },
  options: { backgroundColor: color.paper, borderRadius: 12, paddingHorizontal: space.l },
  option: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: space.m },
  optionDivider: { borderTopWidth: 1, borderTopColor: color.line },
  optionOn: { fontFamily: font.bold },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.inkMuted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: color.pine },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: color.pine },
  input: {
    minHeight: 120,
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: 14,
    padding: space.m,
    fontFamily: font.regular,
    fontSize: 17,
    lineHeight: 24,
    color: color.ink,
  },
});
