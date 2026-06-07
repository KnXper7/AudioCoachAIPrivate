import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import { isLiquidGlass, NativeGlass, GlassFill } from '../components/Glass';
import { useTheme, useTweaks } from '../theme/ThemeContext';

const DEFAULT_AVATARS = [
  ['#6C5CE7', '#8E80F2'],
  ['#3B6EF6', '#6C9CF6'],
  ['#16B894', '#54D6B6'],
  ['#E0A93B', '#F0C externallyverride'],
];

const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Avatar({ value, size }) {
  const pairs = [['#6C5CE7', '#8E80F2'], ['#3B6EF6', '#6C9CF6'], ['#16B894', '#54D6B6'], ['#E0A93B', '#EAC36B'], ['#E5544B', '#F08A84']];
  if (value && value.startsWith && value.startsWith('grad:')) {
    const pair = pairs[Number(value.slice(5)) % pairs.length];
    return <LinearGradient colors={pair} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={size * 0.5} stroke="#fff" /></LinearGradient>;
  }
  if (value) return <Image source={{ uri: value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
  return <LinearGradient colors={pairs[0]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={size * 0.5} stroke="#fff" /></LinearGradient>;
}

export default function Profile({ isPro, groups, profilePic, userName, onSetName, onSetAvatar, onOpenAttempt, onReset, onNew, onGetPro, onManageSubscription, onDeleteAllRecordings }) {
  const t = useTheme();
  const { pref, setThemePref } = useTweaks();
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState(false);
  const name = userName || 'User_001';
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const openNameEditor = () => { setNameInput(name); setEditName(true); };
  const saveName = async () => {
    if (!onSetName) { setEditName(false); return; }
    setSavingName(true);
    try {
      const res = await onSetName(nameInput);
      if (res && res.taken) {
        Alert.alert('Username taken', 'Someone already has that name. Try a different one.');
        return; // keep the editor open so they can change it
      }
      setEditName(false);
    } finally {
      setSavingName(false);
    }
  };
  const confirmDeleteAll = () => {
    Alert.alert('Delete all recordings?', "This permanently removes every session and take from this device. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: () => onDeleteAllRecordings && onDeleteAllRecordings() },
    ]);
  };

  const attempts = (groups || []).flatMap((g) => (g.attempts || []).map((a) => ({ ...a, _sessionTitle: g.title || 'Untitled' })));
  const total = attempts.length;
  const avg = total ? Math.round(attempts.reduce((s, a) => s + a.overall, 0) / total) : 0;
  const best = total ? Math.max(...attempts.map((a) => a.overall)) : 0;
  const stats = [{ k: 'Recordings', v: total }, { k: 'Average', v: avg || '—' }, { k: 'Best', v: best || '—' }];
  const recent = attempts.slice().sort((a, b) => b.ts - a.ts).slice(0, 12);

  const GRADS = ['grad:0', 'grad:1', 'grad:2', 'grad:3', 'grad:4'];

  const pickFromLibrary = async () => {
    setPicker(false);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets?.length) onSetAvatar(res.assets[0].uri);
  };
  const takePhoto = async () => {
    setPicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, cameraType: ImagePicker.CameraType.front });
    if (!res.canceled && res.assets?.length) onSetAvatar(res.assets[0].uri);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => setPicker(true)} style={{ width: 66, height: 66 }}>
            <View style={{ width: 66, height: 66, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: t.line }}>
              <Avatar value={profilePic} size={66} />
            </View>
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 999, backgroundColor: t.bg, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={13} stroke={t.accentA} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Pressable onPress={openNameEditor} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 32, color: t.ink, includeFontPadding: false, flexShrink: 1 }}>{name}</Text>
              <Icon name="edit" size={16} stroke={t.inkDim} />
            </Pressable>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim, marginTop: 1 }}>Your progress</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: isPro ? t.accentA : t.surface, borderWidth: isPro ? 0 : 1, borderColor: t.line }}>
                <Icon name={isPro ? 'infinity' : 'bolt'} size={13} stroke={isPro ? t.onAccent : t.accentA} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: isPro ? t.onAccent : t.ink }}>{isPro ? 'PRO MEMBER' : 'FREE PLAN'}</Text>
              </View>
              {!isPro && onGetPro && (
                <Pressable onPress={onGetPro} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <LinearGradient colors={[t.accentA, t.accentB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 }}>
                    <Icon name="spark" size={12} stroke={t.onAccent} />
                    <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '700', color: t.onAccent }}>Get Pro</Text>
                  </LinearGradient>
                </Pressable>
              )}
              {isPro && onManageSubscription && (
                <Pressable onPress={onManageSubscription} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: t.line })}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, fontWeight: '600', color: t.inkDim }}>Manage</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {stats.map((s) => (
            <Card key={s.k} pad={16} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: t.fonts.serif, fontSize: 32, lineHeight: 40, color: t.ink, includeFontPadding: false }}>{s.v}</Text>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, color: t.inkDim, marginTop: 6 }}>{s.k}</Text>
            </Card>
          ))}
        </View>

        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 }}>Recent recordings</Text>
        {recent.length === 0 ? (
          <Card pad={28} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 14.5, color: t.inkDim, lineHeight: 22, textAlign: 'center' }}>No recordings yet.{'\n'}Your sessions will collect here.</Text>
            <View style={{ marginTop: 16, width: '100%' }}><Btn size="sm" onPress={onNew} icon="spark">Record your first</Btn></View>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.map((a) => (
              <Card key={a.id} onPress={() => onOpenAttempt(a)} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.accentA + '1f', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="voice" size={20} stroke={t.accentA} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink }}>{a._sessionTitle || 'Untitled'}</Text>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>{a.tier.name} · {fmtDate(a.ts)}</Text>
                </View>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 32, color: t.ink, includeFontPadding: false }}>{a.overall}</Text>
              </Card>
            ))}
          </View>
        )}

        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 30, marginBottom: 12 }}>Appearance</Text>
        <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 4 }}>
          {['system', 'light', 'dark'].map((opt) => {
            const on = pref === opt;
            return (
              <Pressable key={opt} onPress={() => setThemePref(opt)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: on ? t.accentA : 'transparent' }}>
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, fontWeight: '600', color: on ? t.onAccent : t.inkDim, textTransform: 'capitalize' }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 30, marginBottom: 12 }}>Your data</Text>
        <Pressable
          onPress={total > 0 && onDeleteAllRecordings ? confirmDeleteAll : undefined}
          disabled={total === 0}
          style={({ pressed }) => ({ opacity: total > 0 ? (pressed ? 0.9 : 1) : 0.45 })}
        >
          {(() => {
            const pillStyle = { borderRadius: 999, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };
            const label = <Text style={{ fontFamily: t.fonts.sans, fontSize: 16, fontWeight: '700', color: '#fff' }}>Delete all recordings</Text>;
            return (isLiquidGlass() && NativeGlass) ? (
              <View style={pillStyle}>
                <GlassFill tint={t.bad} clear={false} radius={999} />
                {label}
              </View>
            ) : (
              <View style={[pillStyle, { backgroundColor: t.bad }]}>{label}</View>
            );
          })()}
        </Pressable>
      </ScrollView>

      <Modal visible={editName} transparent animationType="fade" onRequestClose={() => setEditName(false)}>
        <Pressable onPress={() => setEditName(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.elevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: insets.bottom + 22, borderWidth: 1, borderColor: t.line }}>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 22, color: t.ink, marginBottom: 4 }}>Your name</Text>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim, marginBottom: 16 }}>This shows at the top of your progress.</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              maxLength={24}
              returnKeyType="done"
              onSubmitEditing={saveName}
              placeholder="User_001"
              placeholderTextColor={t.inkFaint}
              style={{ fontFamily: t.fonts.sans, fontSize: 17, color: t.ink, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}
            />
            <Btn size="sm" icon={savingName ? null : 'check'} onPress={saveName} disabled={savingName}>{savingName ? 'Saving…' : 'Save name'}</Btn>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable onPress={() => setPicker(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.elevated, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: insets.bottom + 22, borderWidth: 1, borderColor: t.line }}>
            <Text style={{ fontFamily: t.fonts.serif, fontSize: 22, color: t.ink, marginBottom: 4 }}>Profile picture</Text>
            <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, color: t.inkDim, marginBottom: 16 }}>Pick a default, choose a photo, or take one.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              {GRADS.map((g, i) => (
                <Pressable key={g} onPress={() => { onSetAvatar(g); setPicker(false); }} style={{ width: 50, height: 50, borderRadius: 999, overflow: 'hidden', borderWidth: profilePic === g ? 2 : 1, borderColor: profilePic === g ? t.accentA : t.line }}>
                  <Avatar value={g} size={50} />
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 12 }}>
              <Btn size="sm" icon="image" onPress={pickFromLibrary}>Choose from library</Btn>
              <Btn size="sm" variant="ghost" icon="camera" onPress={takePhoto}>Take a photo</Btn>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
