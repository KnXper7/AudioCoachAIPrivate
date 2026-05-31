// App.js — AuraCheck AI entry point.
// Holds the screen state machine, free-scan gating (paywall after 3 scans),
// persistence, and font loading. Mirrors the design prototype's App() flow.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { loadState, saveState, DEFAULT_STATE } from './src/services/storage';

import Onboarding from './src/screens/Onboarding';
import Dashboard from './src/screens/Dashboard';
import CameraScreen from './src/screens/CameraScreen';
import Analyzing from './src/screens/Analyzing';
import Results from './src/screens/Results';
import Paywall from './src/screens/Paywall';
import Profile from './src/screens/Profile';
import BottomNav from './src/components/BottomNav';

const FREE_SCANS = 3;

function Root() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [st, setSt] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState('onboarding');
  const [mode, setMode] = useState('face');
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(null);
  const [captureUri, setCaptureUri] = useState(null);

  // hydrate persisted state once
  useEffect(() => {
    (async () => {
      const s = await loadState();
      setSt(s);
      setScreen(s.seen ? 'dashboard' : 'onboarding');
      setHydrated(true);
    })();
  }, []);

  // persist on change (after hydration)
  useEffect(() => {
    if (hydrated) saveState(st);
  }, [st, hydrated]);

  const scansLeft = Math.max(0, FREE_SCANS - st.scanCount);

  const startMode = (mo) => {
    if (!st.isPro && st.scanCount >= FREE_SCANS) {
      setPending(mo);
      setScreen('paywall');
    } else {
      setMode(mo);
      setCaptureUri(null);
      setScreen('camera');
    }
  };

  const onCapture = (uri) => {
    setCaptureUri(uri || null);
    setScreen('analyzing');
  };

  const onDone = (r) => {
    setResult(r);
    setSt((s) => ({ ...s, scanCount: s.scanCount + 1, history: [r, ...s.history].slice(0, 20) }));
    setScreen('results');
  };

  const unlock = () => {
    setSt((s) => ({ ...s, isPro: true }));
    if (pending) {
      setMode(pending);
      setPending(null);
      setCaptureUri(null);
      setScreen('camera');
    } else {
      setScreen('dashboard');
    }
  };

  const resetDemo = () => {
    setSt({ seen: true, scanCount: 0, isPro: false, history: [] });
    setScreen('dashboard');
  };

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  let view = null;
  if (screen === 'onboarding')
    view = <Onboarding onStart={() => { setSt((s) => ({ ...s, seen: true })); setScreen('dashboard'); }} />;
  else if (screen === 'dashboard')
    view = <Dashboard scansLeft={scansLeft} isPro={st.isPro} history={st.history} onMode={startMode} />;
  else if (screen === 'camera')
    view = <CameraScreen mode={mode} onClose={() => setScreen('dashboard')} onCapture={onCapture} />;
  else if (screen === 'analyzing')
    view = <Analyzing mode={mode} imageUri={captureUri} onDone={onDone} />;
  else if (screen === 'results')
    view = <Results result={result} onAgain={() => startMode(result.mode)} onHome={() => setScreen('dashboard')} />;
  else if (screen === 'paywall')
    view = <Paywall onClose={() => setScreen('dashboard')} onUnlock={unlock} />;
  else if (screen === 'profile')
    view = (
      <Profile
        isPro={st.isPro}
        history={st.history}
        onOpen={(r) => { setResult(r); setScreen('results'); }}
        onReset={resetDemo}
        onMode={startMode}
      />
    );

  const showNav = screen === 'dashboard' || screen === 'profile';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {view}
      {showNav && (
        <BottomNav
          tab={screen === 'profile' ? 'profile' : 'home'}
          onTab={(id) => setScreen(id === 'home' ? 'dashboard' : 'profile')}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    InstrumentSerif_400Regular,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {fontsLoaded ? <Root /> : <View style={{ flex: 1, backgroundColor: '#0b0c12' }} />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
