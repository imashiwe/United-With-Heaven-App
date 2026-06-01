import React, { useEffect, useState, useCallback } from 'react';
import {
  TouchableOpacity, View, Text, Modal, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { supabase } from '../lib/supabase';
import { getSessionId, getLastNotifCheck, markNotificationsRead } from '../utils/session';

interface NotifItem {
  id: string;
  text: string;
  time: string;
  icon: string;
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    getSessionId().then((id) => {
      setSessionId(id);
      countUnread(id);
    });
  }, []);

  async function countUnread(sid: string) {
    const lastCheck = await getLastNotifCheck();
    const since = new Date(lastCheck).toISOString();

    // Count new reactions on my posts
    const [reactRes, commentRes, propRes] = await Promise.all([
      supabase.from('reactions')
        .select('id', { count: 'exact', head: true })
        .neq('session_id', sid)
        .gt('created_at', since),
      supabase.from('comments')
        .select('id', { count: 'exact', head: true })
        .neq('session_id', sid)
        .gt('created_at', since),
      supabase.from('prophetic_requests')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sid)
        .eq('status', 'answered')
        .gt('answered_at', since),
    ]);

    const total = (reactRes.count ?? 0) + (commentRes.count ?? 0) + (propRes.count ?? 0);
    setUnread(Math.min(total, 99));
  }

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [reactData, commentData, propData] = await Promise.all([
      supabase.from('reactions')
        .select('id, reaction_type, created_at')
        .neq('session_id', sessionId)
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('comments')
        .select('id, display_name, content, created_at')
        .neq('session_id', sessionId)
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('prophetic_requests')
        .select('id, answered_at, response')
        .eq('session_id', sessionId)
        .eq('status', 'answered')
        .order('answered_at', { ascending: false })
        .limit(10),
    ]);

    const notifs: NotifItem[] = [];

    (propData.data ?? []).forEach((r) => {
      notifs.push({ id: `p-${r.id}`, text: 'Your prophetic request received a response!', time: r.answered_at ?? '', icon: '⚡' });
    });
    (reactData.data ?? []).forEach((r) => {
      const label = r.reaction_type === 'pray' ? 'Someone prayed 🙏 in the community' : 'Someone said Amen ✦ in the community';
      notifs.push({ id: `r-${r.id}`, text: label, time: r.created_at, icon: r.reaction_type === 'pray' ? '🙏' : '✦' });
    });
    (commentData.data ?? []).forEach((c) => {
      notifs.push({ id: `c-${c.id}`, text: `${c.display_name} commented: "${c.content.slice(0, 50)}${c.content.length > 50 ? '…' : ''}"`, time: c.created_at, icon: '💬' });
    });

    notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setItems(notifs.slice(0, 30));
    setLoading(false);

    await markNotificationsRead();
    setUnread(0);
  }

  return (
    <>
      <TouchableOpacity onPress={openPanel} style={styles.btn}>
        <Ionicons name="notifications-outline" size={24} color={colors.white} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {loading
              ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
              : (
                <FlatList
                  data={items}
                  keyExtractor={(i) => i.id}
                  contentContainerStyle={items.length === 0 ? styles.emptyContainer : { paddingBottom: 20 }}
                  ListEmptyComponent={
                    <View style={styles.empty}>
                      <Text style={styles.emptyIcon}>🔔</Text>
                      <Text style={styles.emptyText}>No new notifications</Text>
                      <Text style={styles.emptySub}>Community activity will appear here</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.item}>
                      <Text style={styles.itemIcon}>{item.icon}</Text>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemText}>{item.text}</Text>
                        <Text style={styles.itemTime}>{item.time ? timeAgo(item.time) : ''}</Text>
                      </View>
                    </View>
                  )}
                />
              )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { position: 'relative', padding: 6 },
  badge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E84040', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontFamily: fonts.bodyBold },
  overlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 14, maxHeight: '75%',
    borderTopWidth: 3, borderColor: colors.primary,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.borderLight },
  title: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  closeBtn: { padding: 6 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  empty: { alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bodyBold },
  emptySub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 16, borderBottomWidth: 1, borderColor: colors.borderLight,
  },
  itemIcon: { fontSize: 20, marginTop: 2 },
  itemBody: { flex: 1 },
  itemText: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },
  itemTime: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 4 },
});
