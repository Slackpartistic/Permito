import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ResultView, VERDICT_STYLE } from '@/components/ResultView';
import { Button } from '@/components/ui';
import { evaluateProduct } from '@/lib/engine';
import { color, font, space, TOUCH, type } from '@/theme';

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={[type.body, styles.flex]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: color.pine, false: color.line }}
        thumbColor={color.paper}
        ios_backgroundColor={color.line}
      />
    </View>
  );
}

/** Type or paste an ingredient list and check it with the same engine as a scan. */
export default function ManualScreen() {
  const { barcode } = useLocalSearchParams<{ barcode?: string }>();
  const [text, setText] = useState('');
  const [halalLabel, setHalalLabel] = useState(false);
  const [veganLabel, setVeganLabel] = useState(false);

  const result = useMemo(() => {
    if (!text.trim()) return null;
    const labels = [...(halalLabel ? ['en:halal'] : []), ...(veganLabel ? ['en:vegan'] : [])];
    return evaluateProduct(barcode ?? null, { ingredientsText: text, labels });
  }, [barcode, text, halalLabel, veganLabel]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={type.bodyStrong} nativeID="ingredientsLabel">
            Ingredients, as printed on the pack
          </Text>
          {barcode ? <Text style={type.small}>For barcode {barcode}</Text> : null}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="For example: Sugar, glucose syrup, gelatine, citric acid, flavouring"
            placeholderTextColor={color.inkMuted}
            accessibilityLabelledBy="ingredientsLabel"
            accessibilityLabel="Ingredients"
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            textAlignVertical="top"
          />
        </View>
        <View style={styles.toggles}>
          <Toggle label="Halal logo on the pack" value={halalLabel} onChange={setHalalLabel} />
          <View style={styles.divider} />
          <Toggle label="Labelled vegan" value={veganLabel} onChange={setVeganLabel} />
        </View>

        {result ? (
          <>
            <ResultView result={result} ingredientsText={text} />
            <Button
              label={barcode ? 'Send us this product' : 'Report a problem'}
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/report',
                  params: { barcode, verdict: VERDICT_STYLE[result.verdict].label, ingredients: text, problem: barcode ? 'Product is missing' : 'Verdict looks wrong' },
                })
              }
            />
          </>
        ) : (
          <Text style={type.small}>The verdict appears here as you type.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: space.l, paddingBottom: space.xxl, gap: space.xl },
  section: { gap: space.s },
  input: {
    minHeight: 140,
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
  toggles: { backgroundColor: color.paper, borderRadius: 12, paddingHorizontal: space.l },
  toggle: { minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: space.m },
  divider: { height: 1, backgroundColor: color.line },
});
