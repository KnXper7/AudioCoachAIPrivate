import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Btn from '../components/Btn';
import { useTheme } from '../theme/ThemeContext';

const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function GroupDetail({ group, onBack, onRecordAgain, onOpenAttempt, onDeleteGroup, onDeleteAttempt }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  if (!group) return <Screen><View style={{ flex: 1 }} /></Screen>;

  const confirmDeleteGroup = () => {
    Alert.alert('Delete this session?', `“${group.title || 'Untitled'}” and all its takes will be removed. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteGroup && onDeleteGroup(group.id) },
    ]);
  };
  const confirmDeleteAttempt = (a, num) => {
    Alert.alert(`Delete take ${num}?`, "This recording will be removed. This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteAttempt && onDeleteAttempt(group.id, a.id) },
    ]);
  };

  const atts = group.attempts || [];
  const best = atts.length ? Math.max(...atts.map((a) => a.overall)) : 0;
  const first = atts[0];
  const latest = atts[atts.length - 1];
  const delta = atts.length > 1 ? latest.overall - first.overall : 0;
  const mastered = best >= 90;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Pressable onPress={onBack} hitSlop={10}><Icon name="back" size={22} stroke={t.ink} /></Pressable>
          <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '600', color: t.inkDim }}>Practice group</Text>
          <Pressable onPress={confirmDeleteGroup} hitSlop={10}><Icon name="trash" size={20} stroke={t.inkDim} /></Pressable>
        </View>

        <Text style={{ fontFamily: t.fonts.serif, fontSize: 30, lineHeight: 38, color: t.ink, includeFontPadding: false }}>{group.title || 'Untitled'}</Text>
        <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, marginTop: 4 }}>{atts.length} take{atts.length === 1 ? '' : 's'} · best {best}/100</Text>

        {mastered && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: t.good + '22' }}>
            <Icon name="trophy" size={18} stroke={t.good} />
            <Text style={{ flex: 1, fontFamily: t.fonts.sans, fontSize: 14, fontWeight: '600', color: t.ink }}>You've basically mastered this one. Take it to the real room.</Text>
          </View>
        )}

        {/* trend chart */}
        {atts.length > 1 && (
          <Card style={{ marginTop: 18 }} pad={20}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase' }}>Progress</Text>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13, fontWeight: '700', color: delta >= 0 ? t.good : t.bad }}>{delta >= 0 ? '+' : ''}{delta} since take 1</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
              {atts.map((a, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 10, color: t.inkFaint }}>{a.overall}</Text>
                  <View style={{ width: '70%', height: `${Math.max(8, a.overall)}%`, backgroundColor: i === atts.length - 1 ? t.accentA : t.accentA + '66', borderRadius: 4 }} />
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 10, color: t.inkFaint }}>{i + 1}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={{ marginTop: 18 }}>
          {atts.length >= 10 ? (
            <View style={{ padding: 14, borderRadius: 16, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center' }}>
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 13.5, color: t.inkDim, textAlign: 'center' }}>This session is full (10 takes). Start a new session to keep practicing.</Text>
            </View>
          ) : (
            <Btn onPress={onRecordAgain} icon="voice">Add another take</Btn>
          )}
        </View>

        <Text style={{ fontFamily: t.fonts.sans, fontSize: 12, letterSpacing: 1.5, color: t.inkFaint, textTransform: 'uppercase', marginTop: 26, marginBottom: 12 }}>Takes</Text>
        <View style={{ gap: 10 }}>
          {atts.slice().reverse().map((a, idx) => {
            const num = atts.length - idx;
            return (
              <Card key={a.id} onPress={() => onOpenAttempt(a)} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentA + '1f', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 14, fontWeight: '700', color: t.accentA }}>{num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 15, fontWeight: '600', color: t.ink }}>{a.tier.name}</Text>
                  <Text style={{ fontFamily: t.fonts.sans, fontSize: 12.5, color: t.inkDim }}>{fmtDate(a.ts)}</Text>
                </View>
                <Text style={{ fontFamily: t.fonts.serif, fontSize: 26, lineHeight: 32, color: t.ink, includeFontPadding: false }}>{a.overall}</Text>
                <Pressable onPress={() => confirmDeleteAttempt(a, num)} hitSlop={10} style={{ padding: 4 }}>
                  <Icon name="trash" size={17} stroke={t.inkFaint} />
                </Pressable>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
