import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../utils/session';
import { colors, fonts } from '../theme';

interface Props {
  parentType: 'prayer_request' | 'testimony' | 'community_post' | 'group_post';
  parentId: string;
  reactionType: 'pray' | 'amen';
  label: string;
  emoji: string;
  activeColor: string;
  activeBg: string;
}

export default function ReactionButton({
  parentType, parentId, reactionType, label, emoji, activeColor, activeBg,
}: Props) {
  const [count, setCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSessionId().then((id) => {
      setSessionId(id);
      load(id);
    });
  }, [parentId]);

  async function load(sid: string) {
    const { data } = await supabase
      .from('reactions')
      .select('session_id')
      .eq('parent_type', parentType)
      .eq('parent_id', parentId)
      .eq('reaction_type', reactionType);
    if (data) {
      setCount(data.length);
      setReacted(data.some((r) => r.session_id === sid));
    }
  }

  async function toggle() {
    if (!sessionId || busy) return;
    setBusy(true);
    if (reacted) {
      await supabase.from('reactions').delete()
        .eq('parent_type', parentType)
        .eq('parent_id', parentId)
        .eq('reaction_type', reactionType)
        .eq('session_id', sessionId);
      setCount((c) => Math.max(0, c - 1));
      setReacted(false);
    } else {
      await supabase.from('reactions').insert({
        session_id: sessionId,
        parent_type: parentType,
        parent_id: parentId,
        reaction_type: reactionType,
      });
      setCount((c) => c + 1);
      setReacted(true);
    }
    setBusy(false);
  }

  const bg = reacted ? activeBg : '#F5F0E8';
  const textColor = reacted ? activeColor : colors.textMuted;

  return (
    <TouchableOpacity onPress={toggle} style={[styles.btn, { backgroundColor: bg }]} activeOpacity={0.75}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, { color: textColor }]}>
        {label}{count > 0 ? `  ·  ${count}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 5,
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 13, fontFamily: fonts.bodySemiBold },
});
