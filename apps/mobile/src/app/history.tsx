import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { color, font, space, type, verdictColor } from '@/theme';
import { listScans, recheckScans, type Scan } from '@/lib/history';

function when(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString();
}

function Row({ scan }: { scan: Scan }) {
  const v = verdictColor[scan.verdict];
  const prev = scan.previousVerdict ? verdictColor[scan.previousVerdict] : null;
  const meta = [scan.brand, when(scan.scannedAt)].filter(Boolean).join(', ');
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push({ pathname: '/product/[barcode]', params: { barcode: scan.barcode } })}
      accessibilityRole="button"
      accessibilityLabel={`${scan.name ?? `Barcode ${scan.barcode}`}, ${v.label}${prev ? `, changed from ${prev.label}` : ''}, ${meta}`}
    >
      <View style={[styles.bar, { backgroundColor: v.fg }]} />
      {scan.imageUrl ? (
        <Image source={{ uri: scan.imageUrl }} style={styles.thumb} resizeMode="contain" />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.rowText}>
        <Text style={type.bodyStrong} numberOfLines={1}>
          {scan.name ?? `Barcode ${scan.barcode}`}
        </Text>
        <Text style={[styles.verdict, { color: v.fg }]}>{v.label}</Text>
        {prev ? (
          <Text style={styles.changed}>
            Changed from {prev.label} since you last looked
          </Text>
        ) : null}
        <Text style={type.small} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

/** Recent scans, re-checked against the current ingredient reference each time the screen opens. */
export default function HistoryScreen() {
  const db = useSQLiteContext();
  const [search, setSearch] = useState('');
  const [scans, setScans] = useState<Scan[] | null>(null);
  // Bumped after each re-check, so the list reloads when returning from a product.
  const [checkedAt, setCheckedAt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      recheckScans(db)
        .catch(() => 0)
        .then(() => live && setCheckedAt(Date.now()));
      return () => {
        live = false;
      };
    }, [db]),
  );

  useEffect(() => {
    if (!checkedAt) return;
    let live = true;
    listScans(db, search).then((s) => live && setScans(s));
    return () => {
      live = false;
    };
  }, [db, search, checkedAt]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, brand or barcode"
        placeholderTextColor={color.inkMuted}
        accessibilityLabel="Search your scans"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <FlatList
        data={scans ?? []}
        keyExtractor={(s) => s.barcode}
        renderItem={({ item }) => <Row scan={item} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        contentContainerStyle={scans && scans.length === 0 ? undefined : styles.listContent}
        ListEmptyComponent={
          scans ? (
            search ? (
              <View style={styles.empty}>
                <Text style={type.bodyStrong}>No scans match "{search}"</Text>
                <Text style={type.small}>Try part of the name, the brand or the barcode number.</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={type.heading}>No scans yet</Text>
                <Text style={type.body}>
                  Products you scan are kept here on your phone. If a verdict changes after an update, you'll see it here.
                </Text>
              </View>
            )
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.l, gap: space.m },
  input: {
    minHeight: 48,
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: 14,
    paddingHorizontal: space.m,
    fontFamily: font.regular,
    fontSize: 17,
    color: color.ink,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m, backgroundColor: color.paper, paddingVertical: space.m, paddingRight: space.l },
  rowPressed: { backgroundColor: '#E4EEE9' },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  thumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: color.canvas },
  rowText: { flex: 1, gap: 2 },
  verdict: { fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  changed: { fontFamily: font.bold, fontSize: 14, lineHeight: 20, color: color.ink, backgroundColor: '#FFF1D6', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  sep: { height: 1, backgroundColor: color.line },
  list: { flexGrow: 0 },
  listContent: { borderRadius: 12, overflow: 'hidden' },
  empty: { padding: space.l, gap: space.s },
});
