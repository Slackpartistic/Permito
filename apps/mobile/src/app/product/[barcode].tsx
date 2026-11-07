import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ResultView, VERDICT_STYLE } from '@/components/ResultView';
import { Button, TextLink } from '@/components/ui';
import { useProductLookup } from '@/lib/lookup';
import { color, space, type } from '@/theme';

export default function ProductScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const state = useProductLookup(barcode);
  const typeIngredients = () => router.push({ pathname: '/manual', params: { barcode } });
  const report = (params: { product?: string; verdict?: string; problem?: string }) =>
    router.push({ pathname: '/report', params: { barcode, ...params } });

  if (state.status === 'loading') {
    return (
      <View style={styles.center} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={color.pine} />
        <Text style={type.small}>Looking up {barcode}</Text>
      </View>
    );
  }
  if (state.status === 'not_found' || state.status === 'error') {
    const missing = state.status === 'not_found';
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.title}>{missing ? "We don't have this product yet" : "Couldn't look this up"}</Text>
        <Text style={type.body}>
          {missing
            ? `Barcode ${barcode} isn't in Open Food Facts. Type the ingredients from the pack and we'll check them the same way.`
            : state.message}
        </Text>
        <Button label="Type the ingredients" onPress={typeIngredients} />
        {missing ? <TextLink onPress={() => report({ problem: 'Product is missing' })}>Send us this product</TextLink> : null}
      </ScrollView>
    );
  }

  const { product, result, fromCache } = state;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.product}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
        ) : null}
        <View style={styles.productText}>
          <Text style={type.heading}>{product.name ?? `Barcode ${barcode}`}</Text>
          {product.brand ? <Text style={type.small}>{product.brand}</Text> : null}
        </View>
      </View>

      <ResultView result={result} ingredientsText={product.input.ingredientsText} />

      {result.verdict === 'unknown' ? <Button label="Type the ingredients" onPress={typeIngredients} /> : null}
      <Button
        label="Report a problem"
        variant="secondary"
        onPress={() =>
          report({ product: [product.name, product.brand].filter(Boolean).join(', ') || undefined, verdict: VERDICT_STYLE[result.verdict].label })
        }
      />
      <Text style={type.small}>
        Product data from Open Food Facts{fromCache ? ', saved on this phone' : ''}. Barcode {barcode}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.l, paddingBottom: space.xxl, gap: space.l },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.m },
  product: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: color.paper },
  productText: { flex: 1, gap: 2 },
});
