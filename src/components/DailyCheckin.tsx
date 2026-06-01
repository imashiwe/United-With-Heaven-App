import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../utils/session';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyCheckin() {
  const [streak, setStreak] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    getSessionId().then((id) => {
      setSessionId(id);
      loadCheckins(id);
    });
  }, []);

  async function loadCheckins(sid: string) {
    setLoading(true);
    const { data } = await supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('session_id', sid)
      .order('checkin_date', { ascending: false })
      .limit(60);

    if (data) {
      const today = todayStr();
      setCheckedIn(data.some((r) => r.checkin_date === today));
      setStreak(calcStreak(data.map((r) => r.checkin_date)));
    }
    setLoading(false);
  }

  function calcStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort().reverse();
    const today = todayStr();
    let current = today;
    let count = 0;

    for (const d of sorted) {
      if (d === current) {
        count++;
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 1);
        current = prev.toISOString().slice(0, 10);
      } else if (d < current) {
        break;
      }
    }
    return count;
  }

  async function checkIn() {
    if (checkedIn || saving || !sessionId) return;
    setSaving(true);
    await supabase.from('daily_checkins').insert({
      session_id: sessionId,
      checkin_date: todayStr(),
    });
    setCheckedIn(true);
    setStreak((s) => s + 1);
    setSaving(false);
  }

  if (loading) return null;

  return (
    <View style={[styles.card, shadow.small]}>
      <View style={styles.left}>
        <Text style={styles.streakNum}>{streak}</Text>
        <View>
          <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''} streak</Text>
          <Text style={styles.streakSub}>{checkedIn ? '✓ Checked in today' : 'Not checked in yet'}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={checkIn}
        disabled={checkedIn || saving}
        style={[styles.btn, checkedIn && styles.btnDone]}
        activeOpacity={0.8}
      >
        {saving
          ? <ActivityIndicator size="small" color={colors.white} />
          : checkedIn
            ? <><Ionicons name="checkmark" size={16} color={colors.white} /><Text style={styles.btnText}>Done!</Text></>
            : <><Ionicons name="flame" size={16} color={colors.white} /><Text style={styles.btnText}>Check In</Text></>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  streakNum: { fontSize: 36, fontFamily: fonts.heading, color: colors.primary, lineHeight: 40 },
  streakLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.textPrimary },
  streakSub: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 22,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  btnDone: { backgroundColor: '#2A8A5A' },
  btnText: { color: colors.white, fontSize: 14, fontFamily: fonts.bodyBold },
});
