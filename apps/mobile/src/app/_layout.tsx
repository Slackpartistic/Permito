import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_500Medium,
  AtkinsonHyperlegibleNext_700Bold,
  AtkinsonHyperlegibleNext_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/atkinson-hyperlegible-next';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Welcome } from '@/components/Welcome';
import { DISCLAIMER_VERSION } from '@/lib/copy';
import { getSetting, migrate, setSetting } from '@/lib/db';
import { headerOptions } from '@/theme';

function App() {
  const db = useSQLiteContext();
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    getSetting(db, 'disclaimer_accepted')
      .then((v) => setAccepted(v === DISCLAIMER_VERSION))
      .catch(() => setAccepted(false));
  }, [db]);

  if (accepted === null) return null;
  if (!accepted) {
    return (
      <Welcome
        onAccept={() => {
          setAccepted(true);
          setSetting(db, 'disclaimer_accepted', DISCLAIMER_VERSION).catch(() => {});
        }}
      />
    );
  }
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: 'Permito', headerShown: false }} />
      <Stack.Screen name="product/[barcode]" options={{ title: 'Result' }} />
      <Stack.Screen name="manual" options={{ title: 'Check ingredients' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="report" options={{ title: 'Report a problem' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_500Medium,
    AtkinsonHyperlegibleNext_700Bold,
    AtkinsonHyperlegibleNext_800ExtraBold,
  });
  // If the fonts fail to load, carry on with the system font rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;
  return (
    <SQLiteProvider databaseName="halal-o.db" onInit={migrate}>
      <App />
      <StatusBar style="dark" />
    </SQLiteProvider>
  );
}
