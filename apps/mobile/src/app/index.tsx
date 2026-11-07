import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isValidBarcode } from '@halal-o/off-client';
import { Button, TextLink } from '@/components/ui';
import { color, font, space, TOUCH, type } from '@/theme';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.headerButton, pressed && styles.headerButtonPressed]}>
      <Text style={styles.headerButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Corner brackets showing where to hold the barcode. */
function Reticle() {
  return (
    <View style={styles.reticle} pointerEvents="none">
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
    </View>
  );
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  // Only one camera preview may be active, so it's mounted only while this screen is focused.
  const [focused, setFocused] = useState(true);
  const [typed, setTyped] = useState('');
  const handled = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      handled.current = false;
      return () => setFocused(false);
    }, []),
  );

  const open = (barcode: string) => {
    if (handled.current) return;
    handled.current = true;
    router.push({ pathname: '/product/[barcode]', params: { barcode } });
  };

  const onScanned = ({ data }: BarcodeScanningResult) => {
    const code = data.trim();
    if (isValidBarcode(code)) open(code);
  };

  const valid = isValidBarcode(typed);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.camera}>
        {permission?.granted && focused ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={onScanned}
          />
        ) : null}

        <SafeAreaView edges={['top']} style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.wordmark} accessibilityRole="header">
              Permito
            </Text>
            <View style={styles.headerButtons}>
              <HeaderButton label="History" onPress={() => router.push('/history')} />
              <HeaderButton label="About" onPress={() => router.push('/about')} />
            </View>
          </View>

          {permission && !permission.granted ? (
            <View style={styles.permission}>
              <Text style={styles.permissionTitle}>Scan barcodes with your camera</Text>
              <Text style={styles.permissionBody}>
                Permito only uses the camera to read barcodes. Nothing is recorded.
              </Text>
              {permission.canAskAgain ? (
                <Button label="Allow camera" onPress={requestPermission} style={styles.permissionButton} />
              ) : (
                <Text style={styles.permissionBody}>Camera access is off. Turn it on for Permito in Settings.</Text>
              )}
            </View>
          ) : (
            <View style={styles.aim}>
              <Reticle />
              <Text style={styles.hint}>Hold the barcode inside the frame</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <Text style={type.bodyStrong} nativeID="barcodeLabel">
          Or type the barcode number
        </Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={typed}
            onChangeText={(t) => setTyped(t.replace(/\D/g, ''))}
            placeholder="e.g. 5000159407236"
            placeholderTextColor={color.inkMuted}
            keyboardType="number-pad"
            returnKeyType="search"
            maxLength={14}
            accessibilityLabelledBy="barcodeLabel"
            accessibilityLabel="Barcode number"
            onSubmitEditing={() => valid && open(typed)}
          />
          <Button label="Check" onPress={() => open(typed)} disabled={!valid} style={styles.check} />
        </View>
        <TextLink onPress={() => router.push('/manual')}>No barcode? Type the ingredients</TextLink>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const C = 28; // reticle corner length
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ink },
  camera: { flex: 1, backgroundColor: color.ink },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.l, paddingTop: space.s },
  wordmark: { fontFamily: font.heavy, fontSize: 26, color: color.paper, letterSpacing: -0.5 },
  headerButtons: { flexDirection: 'row', gap: space.s },
  headerButton: {
    minHeight: TOUCH,
    paddingHorizontal: space.m,
    borderRadius: TOUCH / 2,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerButtonPressed: { backgroundColor: 'rgba(255,255,255,0.28)' },
  headerButtonText: { fontFamily: font.bold, fontSize: 15, color: color.paper },
  aim: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.l },
  reticle: { width: '78%', aspectRatio: 1.6 },
  corner: { position: 'absolute', width: C, height: C, borderColor: color.paper },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  hint: {
    fontFamily: font.medium,
    fontSize: 16,
    color: color.paper,
    backgroundColor: 'rgba(16,35,27,0.6)',
    paddingHorizontal: space.m,
    paddingVertical: space.xs,
    borderRadius: 8,
    overflow: 'hidden',
  },
  permission: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xl, gap: space.m },
  permissionTitle: { fontFamily: font.bold, fontSize: 24, lineHeight: 30, color: color.paper },
  permissionBody: { fontFamily: font.regular, fontSize: 17, lineHeight: 25, color: '#D5E0DA' },
  permissionButton: { marginTop: space.s, alignSelf: 'flex-start', paddingHorizontal: space.xl },
  sheet: {
    backgroundColor: color.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: space.l,
    paddingTop: space.l,
    gap: space.s,
  },
  row: { flexDirection: 'row', gap: space.s },
  input: {
    flex: 1,
    minHeight: 52,
    backgroundColor: color.paper,
    borderWidth: 1.5,
    borderColor: color.line,
    borderRadius: 14,
    paddingHorizontal: space.m,
    fontFamily: font.regular,
    fontSize: 18,
    color: color.ink,
  },
  check: { paddingHorizontal: space.xl },
});
