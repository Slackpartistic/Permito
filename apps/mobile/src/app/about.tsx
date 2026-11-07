import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextLink } from '@/components/ui';
import { APP_VERSION, GITHUB_REPO, PRIVACY_URL, SUPPORT_EMAIL } from '@/lib/config';
import { DISCLAIMER, VERDICT_HELP } from '@/lib/copy';
import { getCorrections, getReference } from '@/lib/engine';
import { color, font, space, type, verdictColor } from '@/theme';

const METHODOLOGY_URL = `${GITHUB_REPO}/blob/main/data/METHODOLOGY.md`;

function Link({ url, children }: { url: string; children: string }) {
  return <TextLink onPress={() => Linking.openURL(url)}>{children}</TextLink>;
}

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[type.heading, styles.heading]}>How verdicts work</Text>
      {VERDICT_HELP.map((v) => (
        <Text key={v.label} style={type.body}>
          <Text style={[styles.bold, { color: verdictColor[v.key].fg }]}>{v.label}: </Text>
          {v.text}
        </Text>
      ))}
      <Text style={type.body}>
        Rulings follow the Hanafi school. Animal-derived ingredients count as not halal unless the pack has a halal logo, and an ingredient
        whose source the label doesn't give counts as Mushbooh. A vegan label is treated as halal; a vegetarian label is not.
      </Text>
      <Link url={METHODOLOGY_URL}>Read the full methodology and sources</Link>

      <Text style={[type.heading, styles.heading]}>Disclaimer</Text>
      <Text style={type.body}>{DISCLAIMER}</Text>

      <Text style={[type.heading, styles.heading]}>Privacy</Text>
      <Text style={type.body}>
        No account, no ads and no analytics. Your scan history stays on this phone. To look a product up, the barcode is sent to Open Food
        Facts. The camera is only used to read barcodes.
      </Text>
      <Link url={PRIVACY_URL}>Privacy policy</Link>

      <Text style={[type.heading, styles.heading]}>Product data</Text>
      <Text style={type.body}>
        Product names, photos and ingredients come from Open Food Facts, a free, open database built by volunteers and available under the
        Open Database License. You can add or fix a product on their website or app.
      </Text>
      <Link url="https://world.openfoodfacts.org">openfoodfacts.org</Link>
      <Link url="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License (ODbL)</Link>

      <Text style={[type.heading, styles.heading]}>Contact</Text>
      <Link url={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>

      <View style={styles.meta}>
        <Text style={type.small}>Permito {APP_VERSION}</Text>
        <Text style={type.small}>Ingredient list updated {getReference().generated}</Text>
        <Text style={type.small}>Corrections updated {getCorrections().version}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.l, paddingBottom: space.xxl, gap: space.s },
  heading: { marginTop: space.l },
  bold: { fontFamily: font.bold },
  meta: { marginTop: space.xl, paddingTop: space.l, borderTopWidth: 1, borderTopColor: color.line },
});
