// App.js — AudioCoach AI. Voice-only speaking coach with practice GROUPS:
// each group is one line/speech you rehearse repeatedly; the coach tracks your
// improvement across attempts. Onboarding once; system/light/dark theming.
import React, { useEffect, useState, useCallback } from 'react';
import { View, BackHandler, Alert, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Android system navigation bar — optional native module (guarded for Expo Go).
let NavigationBar = null;
try { NavigationBar = require('expo-navigation-bar'); } catch (e) { NavigationBar = null; }
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
import {
  purchasesAvailable,
  uiAvailable,
  initPurchases,
  checkProStatus,
  refreshProStatus,
  onProStatusChange,
  presentPaywall,
  paywallResultIsPro,
  presentCustomerCenter,
  getActiveSubscription,
} from './src/services/purchases';
import { cloudConfigured, initCloud, ensureProfile, claimUsername, recordPurchase, syncPro, syncSubscription } from './src/services/cloud';

import Onboarding from './src/screens/Onboarding';
import Dashboard from './src/screens/Dashboard';
import GroupDetail from './src/screens/GroupDetail';
import VoiceScreen from './src/screens/VoiceScreen';
import Analyzing from './src/screens/Analyzing';
import Results from './src/screens/Results';
import Paywall from './src/screens/Paywall';
import Profile from './src/screens/Profile';
import TabsHost from './src/components/TabsHost';
import ScreenTransition from './src/components/ScreenTransition';

const FREE = 3;              // free takes…
const FREE_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // …per rolling 2 days
const MAX_TAKES_PER_SESSION = 10;

function Root() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [st, setSt] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState('onboarding');
  const [result, setResult] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [captureUri, setCaptureUri] = useState(null);
  const [captureCtx, setCaptureCtx] = useState('');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureTx, setCaptureTx] = useState('');
  const [captureDur, setCaptureDur] = useState(0);
  const [prevAttempt, setPrevAttempt] = useState(null);
  const [lockedCtx, setLockedCtx] = useState(null);
  const [lockedTitle, setLockedTitle] = useState(null);
  const [pendingGroupId, setPendingGroupId] = useState(null); // null = new group
  const [viewGroupId, setViewGroupId] = useState(null);
  const [resumeAfterPay, setResumeAfterPay] = useState(null); // {kind:'new'} | {kind:'group', id} | {kind:'upgrade'}
  const [upgradeBase, setUpgradeBase] = useState(null); // result being re-analyzed with Pro

  useEffect(() => {
    (async () => {
      const s = await loadState();
      setSt(s);
      setHydrated(true);
      setScreen(s.seen ? 'dashboard' : 'onboarding');

      // RevenueCat: if it's live (dev build + real key), it is the source of truth
      // for Pro. In Expo Go the native module is absent, so we keep local state.
      if (purchasesAvailable()) {
        const ok = await initPurchases();
        if (ok) {
          const active = await checkProStatus();
          // Only override stored Pro when we got a real answer (true/false).
          // null = couldn't reach RevenueCat → keep whatever was saved locally.
          if (active !== null) setSt((prev) => ({ ...prev, isPro: active }));
        }
      }

      // Cloud: anonymous account + globally-unique username. Off until configured.
      if (cloudConfigured()) {
        const uid = await initCloud();
        if (uid) {
          const profile = await ensureProfile();
          if (profile && profile.username) setSt((prev) => ({ ...prev, userName: profile.username }));
          // Refresh the stored subscription (which plan, or none) every launch.
          if (purchasesAvailable()) syncSubscription(await getActiveSubscription());
        }
      }
    })();
  }, []);

  // Keep Pro in sync with RevenueCat (renewals, expirations, cross-device).
  useEffect(() => {
    if (!purchasesAvailable()) return;
    const unsub = onProStatusChange((active) => setSt((prev) => ({ ...prev, isPro: active })));
    return unsub;
  }, []);

  // On app foreground, re-check Pro with a FRESH server fetch so a cancelled or
  // expired subscription revokes Pro promptly — not just on a cold restart.
  useEffect(() => {
    if (!purchasesAvailable()) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refreshProStatus().then((active) => {
        if (active === null) return; // couldn't reach RevenueCat → keep current state
        setSt((prev) => (prev.isPro === active ? prev : { ...prev, isPro: active }));
        if (cloudConfigured()) {
          syncPro(active);
          getActiveSubscription().then(syncSubscription);
        }
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => { if (hydrated) saveState(st); }, [st, hydrated]);

  // Match the Android system navigation bar to the current theme (dark/light).
  useEffect(() => {
    if (Platform.OS !== 'android' || !NavigationBar) return;
    NavigationBar.setButtonStyleAsync(t.dark ? 'light' : 'dark').catch(() => {});
    NavigationBar.setBackgroundColorAsync(t.bg).catch(() => {});
  }, [t.dark, t.bg]);

  const groupById = (id) => st.groups.find((g) => g.id === id);
  const recentTakeCount = () => (st.takeTimes || []).filter((ts) => Date.now() - ts < FREE_WINDOW_MS).length;
  const takesLeft = () => Math.max(0, FREE - recentTakeCount());
  const gated = () => !st.isPro && takesLeft() <= 0;
  const goDashboard = useCallback(() => setScreen('dashboard'), []);

  const beginNewGroup = () => {
    if (gated()) { openPaywall({ kind: 'new' }); return; }
    setPendingGroupId(null);
    setPrevAttempt(null);
    setLockedCtx(null);
    setLockedTitle(null);
    setCaptureUri(null);
    setScreen('voice');
  };

  const recordIntoGroup = (group) => {
    if (!group) return;
    if ((group.attempts || []).length >= MAX_TAKES_PER_SESSION) {
      Alert.alert('Session full', `A session holds up to ${MAX_TAKES_PER_SESSION} takes. Start a new session to keep recording.`);
      return;
    }
    if (gated()) { openPaywall({ kind: 'group', id: group.id }); return; }
    setPendingGroupId(group.id);
    setPrevAttempt(group.attempts[group.attempts.length - 1] || null);
    setLockedCtx(group.context || '');
    setLockedTitle(group.title || '');
    setCaptureUri(null);
    setScreen('voice');
  };

  const onCapture = (uri, data) => {
    const d = data || {};
    setCaptureUri(uri || null);
    setCaptureCtx(d.context || '');
    setCaptureTitle(d.title || '');
    setCaptureTx(d.transcript || '');
    setCaptureDur(d.durationSec || 0);
    setScreen('analyzing');
  };

  const onDone = (r) => {
    if (r && r.visible === false) {
      setScreen('voice');
      setTimeout(() => Alert.alert("Couldn't hear you clearly", 'Find a quiet spot, hold the phone close, and speak up — then try again.'), 300);
      return;
    }
    setSt((s) => {
      let groups = s.groups.slice();
      let gid = pendingGroupId;
      if (gid) {
        groups = groups.map((g) => (g.id === gid ? { ...g, attempts: [...g.attempts, { ...r, groupId: gid }].slice(-MAX_TAKES_PER_SESSION) } : g));
      } else {
        gid = 'grp_' + Date.now();
        const title = (captureTitle || '').trim() || r.context || 'Untitled';
        groups = [{ id: gid, title, context: r.context || '', attempts: [{ ...r, groupId: gid }], ts: Date.now() }, ...groups];
      }
      r.groupId = gid;
      const takeTimes = [...(s.takeTimes || []), Date.now()].filter((ts) => Date.now() - ts < FREE_WINDOW_MS);
      return { ...s, scanCount: s.scanCount + 1, takeTimes, groups };
    });
    setResult({ ...r });
    setReadOnly(false);
    setViewGroupId(r.groupId || null);
    setScreen('results');
  };

  // Grant Pro locally and continue whatever the user was doing before paying.
  const applyUnlock = (resume) => {
    setSt((s) => ({ ...s, isPro: true }));
    // Mirror the purchase + which plan to the cloud.
    getActiveSubscription().then((sub) => {
      recordPurchase({ source: 'paywall', ...(sub || {}) });
      syncSubscription(sub);
    });
    if (resume?.kind === 'new') setTimeout(beginNewGroup, 0);
    else if (resume?.kind === 'group') setTimeout(() => recordIntoGroup(groupById(resume.id)), 0);
    else if (resume?.kind === 'upgrade' && result) { setUpgradeBase(result); setTimeout(() => setScreen('analyzing'), 0); }
    else setScreen('dashboard');
  };

  // Used by the custom (Expo Go fallback) Paywall screen.
  const unlock = () => {
    const resume = resumeAfterPay;
    setResumeAfterPay(null);
    applyUnlock(resume);
  };

  // The Pro entry point. Prefers RevenueCat's hosted Paywall; falls back to the
  // in-app Paywall screen when the native UI isn't available (e.g. Expo Go).
  const openPaywall = async (resume) => {
    if (uiAvailable()) {
      const result = await presentPaywall();
      if (paywallResultIsPro(result)) applyUnlock(resume || null);
      return; // cancelled / errored → stay put; listener will sync any change
    }
    setResumeAfterPay(resume || null);
    setScreen('paywall');
  };

  // After upgrading mid-result: re-analyze the same audio with Pro on, then merge
  // the Pro-only extras (more suggestions, rephrasings, exercises) into the take
  // the user just recorded — keeping the original score, transcript, and cues.
  const onUpgradeDone = (r) => {
    const base = upgradeBase;
    setUpgradeBase(null);
    if (!base) { setScreen('results'); return; }
    const merged = {
      ...base,
      isPro: true,
      suggestions: r && Array.isArray(r.suggestions) && r.suggestions.length ? r.suggestions : base.suggestions,
      rephrasings: r && Array.isArray(r.rephrasings) ? r.rephrasings : [],
      exercises: r && Array.isArray(r.exercises) ? r.exercises : [],
    };
    setSt((s) => ({
      ...s,
      groups: s.groups.map((g) => (g.id === merged.groupId ? { ...g, attempts: g.attempts.map((a) => (a.id === merged.id ? merged : a)) } : g)),
    }));
    setResult(merged);
    setReadOnly(false);
    setScreen('results');
  };

  const deleteGroup = (id) => {
    setSt((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
    setViewGroupId(null);
    setScreen('dashboard');
  };

  const deleteAttempt = (groupId, attemptId) => {
    const g = groupById(groupId);
    const lastOne = g && (g.attempts || []).length <= 1; // deleting the only take empties the session
    setSt((s) => {
      const groups = s.groups
        .map((gr) => (gr.id === groupId ? { ...gr, attempts: (gr.attempts || []).filter((a) => a.id !== attemptId) } : gr))
        .filter((gr) => (gr.attempts || []).length > 0); // drop the session if it has no takes left
      return { ...s, groups };
    });
    if (lastOne) { setViewGroupId(null); setScreen('dashboard'); }
  };

  // Self-service subscription management (RevenueCat Customer Center).
  const openCustomerCenter = async () => {
    if (uiAvailable()) { await presentCustomerCenter(); return; }
    Alert.alert('Manage subscription', 'Subscription management opens in a full build of the app. In the store, you can manage or cancel anytime from your account settings.');
  };

  // Delete every recording/session for this user. Local-only today; when a backend
  // database is added, also delete the user's recordings server-side here (await a
  // DELETE call before/after clearing local state).
  const deleteAllRecordings = async () => {
    // TODO(db): await api.deleteAllRecordings(userId) once a database exists.
    setSt((s) => ({ ...s, groups: [] }));
    setViewGroupId(null);
  };

  const openGroup = (g) => { setViewGroupId(g.id); setScreen('groupDetail'); };
  const openAttempt = (att) => { setResult(att); setReadOnly(true); setScreen('results'); };
  const resetDemo = () => { setSt({ ...DEFAULT_STATE, seen: true }); setScreen('dashboard'); };
  const setAvatar = (uri) => setSt((s) => ({ ...s, profilePic: uri }));
  // Rename. When the cloud is on, the username must be globally unique — returns
  // { taken: true } if someone else already has it so the UI can warn.
  const setUserName = async (name) => {
    const desired = (name && name.trim()) || 'User_001';
    try {
      const saved = await claimUsername(desired); // unique check when cloud is on
      setSt((s) => ({ ...s, userName: saved }));
      return { ok: true, name: saved };
    } catch (e) {
      if (String(e && e.message) === 'taken') return { ok: false, taken: true };
      setSt((s) => ({ ...s, userName: desired })); // cloud error → keep local
      return { ok: true, name: desired };
    }
  };

  useEffect(() => {
    const onBack = () => {
      if (screen === 'results') { setScreen(readOnly && viewGroupId && groupById(viewGroupId) ? 'groupDetail' : 'dashboard'); return true; }
      if (['voice', 'analyzing', 'paywall', 'profile', 'groupDetail'].includes(screen)) { setScreen('dashboard'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [screen, viewGroupId, st.groups, readOnly]);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const curGroup = groupById(viewGroupId);
  const inTabs = screen === 'dashboard' || screen === 'profile';

  // The two tabbed screens, built with live props (both mount inside TabsHost).
  const dashboardEl = (
    <Dashboard isPro={st.isPro} scansLeft={takesLeft()} groups={st.groups} onNew={beginNewGroup} onOpenGroup={openGroup} onRecordInto={recordIntoGroup} />
  );
  const profileEl = (
    <Profile isPro={st.isPro} groups={st.groups} profilePic={st.profilePic} userName={st.userName} onSetName={setUserName} onSetAvatar={setAvatar} onOpenAttempt={openAttempt} onReset={resetDemo} onNew={beginNewGroup} onGetPro={() => openPaywall(null)} onManageSubscription={openCustomerCenter} onDeleteAllRecordings={deleteAllRecordings} />
  );

  // Everything else is a full-screen overlay over the state machine.
  let view = null;
  if (screen === 'onboarding')
    view = <Onboarding onStart={() => { setSt((s) => ({ ...s, seen: true })); setScreen('dashboard'); }} />;
  else if (screen === 'groupDetail')
    view = <GroupDetail group={curGroup} onBack={goDashboard} onRecordAgain={() => recordIntoGroup(curGroup)} onOpenAttempt={openAttempt} onDeleteGroup={deleteGroup} onDeleteAttempt={deleteAttempt} />;
  else if (screen === 'voice')
    view = <VoiceScreen onClose={goDashboard} onCapture={onCapture} lockedContext={lockedCtx} lockedTitle={lockedTitle} />;
  else if (screen === 'analyzing')
    view = upgradeBase
      ? <Analyzing uri={upgradeBase.audioUri} isPro={true} context={upgradeBase.context} durationSec={upgradeBase.durationSec} liveTranscript={upgradeBase.transcript} prev={null} onDone={onUpgradeDone} onFail={() => { setUpgradeBase(null); setScreen('results'); }} />
      : <Analyzing uri={captureUri} isPro={st.isPro} context={captureCtx} durationSec={captureDur} liveTranscript={captureTx} prev={prevAttempt} onDone={onDone} onFail={() => setScreen('voice')} />;
  else if (screen === 'results')
    view = (
      <Results
        result={result}
        isPro={st.isPro}
        readOnly={readOnly}
        onHome={() => setScreen(readOnly && viewGroupId && groupById(viewGroupId) ? 'groupDetail' : 'dashboard')}
        onRecordAgain={() => recordIntoGroup(groupById(result.groupId))}
        onGetPro={() => openPaywall({ kind: 'upgrade' })}
      />
    );
  else if (screen === 'paywall')
    view = <Paywall onClose={goDashboard} onUnlock={unlock} usedFree={takesLeft() <= 0} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {inTabs ? (
        <TabsHost
          activeTab={screen === 'profile' ? 'you' : 'home'}
          onTabChange={(key) => setScreen(key === 'you' ? 'profile' : 'dashboard')}
          insets={insets}
          dashboard={dashboardEl}
          profile={profileEl}
        />
      ) : (
        <ScreenTransition key={screen}>{view}</ScreenTransition>
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
