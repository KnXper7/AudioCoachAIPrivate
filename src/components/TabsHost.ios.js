// TabsHost.ios.js — iOS uses the REAL native UITabBar (react-native-bottom-tabs).
// On iOS 26 this gets Apple's Liquid Glass automatically — no custom drawing.
//
// IMPORTANT: this is a NATIVE module. It only works in a build you compile
// yourself (expo run:ios / a dev build) — NOT in Expo Go. If it isn't present
// (Expo Go, or you haven't rebuilt after installing), we fall back to JSTabs so
// the app never crashes with "Unimplemented component: <RNCTabView>".
//
//   npx expo install react-native-bottom-tabs
//   npx expo prebuild -p ios --clean && npx expo run:ios
import React from 'react';
import JSTabs from './JSTabs';
import { useTheme } from '../theme/ThemeContext';

// Detect Expo Go — it can't load native modules, so we must not even try the
// native tab view there (that's what caused "Unimplemented component").
let inExpoGo = false;
try {
  const Constants = require('expo-constants').default;
  inExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
} catch (e) {}

let RNBT = null;
try { RNBT = require('react-native-bottom-tabs'); } catch (e) { RNBT = null; }

// Catches the "Unimplemented component" render error (native module not built in)
// and shows the JS tab bar instead of a red screen.
class NativeTabsBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {}
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function TabsHost(props) {
  const t = useTheme();
  const TabView = RNBT && (RNBT.default || RNBT.TabView);

  // Expo Go, or package not installed → JS nav (no native tab view to render).
  if (inExpoGo || !TabView) return <JSTabs {...props} />;

  const { activeTab, onTabChange, dashboard, profile } = props;
  const index = activeTab === 'you' ? 1 : 0;

  const routes = [
    { key: 'home', title: 'Home', focusedIcon: { sfSymbol: 'house.fill' }, unfocusedIcon: { sfSymbol: 'house' } },
    { key: 'you', title: 'You', focusedIcon: { sfSymbol: 'person.crop.circle.fill' }, unfocusedIcon: { sfSymbol: 'person.crop.circle' } },
  ];

  const renderScene = ({ route }) => (route.key === 'you' ? profile : dashboard);

  return (
    <NativeTabsBoundary fallback={<JSTabs {...props} />}>
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={(i) => onTabChange(i === 1 ? 'you' : 'home')}
        renderScene={renderScene}
        labeled
        minimizeBehavior="never"
        tabBarActiveTintColor={t.accent}
        tabBarInactiveTintColor={t.inkDim}
      />
    </NativeTabsBoundary>
  );
}
