import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, ScrollView, FlatList, StyleSheet,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { supabase } from '../lib/supabase';

interface PropheticRequest {
  id: string; session_id: string; display_name: string;
  request: string; status: 'pending' | 'answered';
  response: string | null; created_at: string;
}
interface CommunityPost {
  id: string; name: string; content: string | null;
  media_type: string; likes: number; created_at: string;
}
interface Stats {
  total_profiles: number; total_prayer_requests: number;
  total_testimonies: number; total_posts: number;
  total_group_joins: number; pending_prophetic: number;
  checkins_today: number;
}

type Tab = 'prophetic' | 'moderation' | 'stats';

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AdminScreen({ visible, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('prophetic');

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.crown}>👑</Text>
            <Text style={styles.title}>Admin Dashboard</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            ['prophetic', '⚡', 'Prophetic'],
            ['moderation', '🛡️', 'Moderation'],
            ['stats', '📊', 'Stats'],
          ] as const).map(([key, icon, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Text style={styles.tabIcon}>{icon}</Text>
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'prophetic' && <PropheticTab />}
        {tab === 'moderation' && <ModerationTab />}
        {tab === 'stats' && <StatsTab />}
      </View>
    </Modal>
  );
}

// ── Prophetic Requests Tab ────────────────────────────────────
function PropheticTab() {
  const [requests, setRequests] = useState<PropheticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PropheticRequest | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data } = await supabase
      .from('prophetic_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as PropheticRequest[]);
    setLoading(false);
  }

  async function sendResponse() {
    if (!response.trim() || !selected) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('prophetic_requests')
      .update({
        response: response.trim(),
        status: 'answered',
        answered_at: new Date().toISOString(),
      })
      .eq('id', selected.id);

    if (error) { Alert.alert('Error', error.message); }
    else {
      setRequests(prev => prev.map(r =>
        r.id === selected.id ? { ...r, status: 'answered', response: response.trim() } : r
      ));
      setSelected(null);
      setResponse('');
      Alert.alert('✦ Response Sent', 'The user will see your prophetic word in their requests.');
    }
    setSubmitting(false);
  }

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <>
      <View style={styles.filterRow}>
        {(['pending', 'answered', 'all'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && ` (${requests.filter(r => r.status === 'pending').length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={filtered}
            keyExtractor={r => r.id}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { padding: 16 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⚡</Text>
                <Text style={styles.emptyText}>No {filter} requests</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.requestCard, shadow.small, item.status === 'answered' && styles.requestCardAnswered]}
                onPress={() => { setSelected(item); setResponse(item.response ?? ''); }}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>{(item.display_name || 'A')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestName}>{item.display_name}</Text>
                    <Text style={styles.requestTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <View style={[styles.statusPill, item.status === 'answered' ? styles.statusAnswered : styles.statusPending]}>
                    <Text style={[styles.statusText, item.status === 'answered' ? styles.statusAnsweredText : styles.statusPendingText]}>
                      {item.status === 'answered' ? '✓ Answered' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestText} numberOfLines={3}>{item.request}</Text>
                {item.status === 'answered' && item.response && (
                  <View style={styles.responsePreview}>
                    <Text style={styles.responsePreviewLabel}>Your response:</Text>
                    <Text style={styles.responsePreviewText} numberOfLines={2}>{item.response}</Text>
                  </View>
                )}
                <Text style={styles.tapToRespond}>
                  {item.status === 'pending' ? 'Tap to respond →' : 'Tap to edit response →'}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

      {/* Response modal */}
      {selected && (
        <Modal visible animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.responseOverlay}>
            <View style={styles.responseSheet}>
              <View style={styles.responseHandle} />
              <TouchableOpacity onPress={() => { setSelected(null); setResponse(''); }} style={styles.responseClose}>
                <Text style={styles.responseCloseText}>✕  Close</Text>
              </TouchableOpacity>

              <Text style={styles.responseTitle}>Prophetic Response</Text>
              <Text style={styles.responseFor}>For: {selected.display_name}</Text>

              <View style={styles.requestBox}>
                <Text style={styles.requestBoxLabel}>Their request:</Text>
                <Text style={styles.requestBoxText}>{selected.request}</Text>
              </View>

              <Text style={styles.responseLabel}>Your prophetic word:</Text>
              <TextInput
                style={styles.responseInput}
                placeholder="Write what the Lord has placed on your heart for this person…"
                placeholderTextColor={colors.textLight}
                value={response}
                onChangeText={setResponse}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.sendResponseBtn} onPress={sendResponse} disabled={submitting || !response.trim()}>
                {submitting
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.sendResponseText}>✦ Send Prophetic Word</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </>
  );
}

// ── Moderation Tab ─────────────────────────────────────────────
function ModerationTab() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select('id, name, content, media_type, likes, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data as CommunityPost[]);
    setLoading(false);
  }

  async function deletePost(id: string, name: string) {
    Alert.alert('Delete Post', `Remove this post by ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('community_posts').delete().eq('id', id);
          setPosts(prev => prev.filter(p => p.id !== id));
        }
      }
    ]);
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <FlatList
      data={posts}
      keyExtractor={p => p.id}
      contentContainerStyle={posts.length === 0 ? styles.emptyContainer : { padding: 16 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.modCard, shadow.small]}>
          <View style={styles.modHeader}>
            <View style={styles.requestAvatar}>
              <Text style={styles.requestAvatarText}>{(item.name || 'A')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.requestName}>{item.name}</Text>
              <Text style={styles.requestTime}>{timeAgo(item.created_at)} · {item.media_type}</Text>
            </View>
            <TouchableOpacity onPress={() => deletePost(item.id, item.name)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color="#AA3030" />
            </TouchableOpacity>
          </View>
          {item.content && (
            <Text style={styles.modContent} numberOfLines={3}>{item.content}</Text>
          )}
          <Text style={styles.modLikes}>❤️ {item.likes} amens</Text>
        </View>
      )}
    />
  );
}

// ── Stats Tab ──────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    const { data } = await supabase.from('community_stats').select('*').maybeSingle();
    if (data) setStats(data as Stats);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  if (!stats) return <Text style={styles.emptyText}>Could not load stats</Text>;

  const items = [
    { icon: '👥', label: 'Community Members', value: stats.total_profiles },
    { icon: '🙏', label: 'Prayer Requests', value: stats.total_prayer_requests },
    { icon: '🔥', label: 'Testimonies', value: stats.total_testimonies },
    { icon: '💬', label: 'Community Posts', value: stats.total_posts },
    { icon: '🤝', label: 'Group Joins', value: stats.total_group_joins },
    { icon: '⚡', label: 'Prophetic Requests', value: stats.pending_prophetic, sub: 'pending' },
    { icon: '📅', label: "Today's Check-ins", value: stats.checkins_today },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.statsTitle}>Community Overview</Text>
      {items.map(item => (
        <View key={item.label} style={[styles.statCard, shadow.small]}>
          <Text style={styles.statIcon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>{item.label}</Text>
            {item.sub && <Text style={styles.statSub}>{item.sub}</Text>}
          </View>
          <Text style={styles.statValue}>{item.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.parchment, borderBottomWidth: 1, borderColor: colors.borderLight },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  crown: { fontSize: 22 },
  title: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },

  // Tab row
  tabRow: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.borderLight },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 2, borderBottomWidth: 3, borderColor: 'transparent' },
  tabBtnActive: { borderColor: colors.gold },
  tabIcon: { fontSize: 18 },
  tabLabel: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.bodyBold },
  tabLabelActive: { color: colors.gold },

  // Filter
  filterRow: { flexDirection: 'row', gap: 8, padding: 16 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.card },
  filterBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold },
  filterTextActive: { color: colors.white },

  // Prophetic request card
  requestCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4, borderLeftColor: colors.gold },
  requestCardAnswered: { borderLeftColor: '#2A8A5A', opacity: 0.85 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  requestAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  requestAvatarText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  requestName: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bodyBold },
  requestTime: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.body, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPending: { backgroundColor: '#FFF8E0' },
  statusAnswered: { backgroundColor: '#D0FFE8' },
  statusText: { fontSize: 11, fontFamily: fonts.bodyBold },
  statusPendingText: { color: '#8A6A10' },
  statusAnsweredText: { color: '#2A8A5A' },
  requestText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  responsePreview: { marginTop: 10, backgroundColor: '#FFFBF0', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.propheticBorder },
  responsePreviewLabel: { color: colors.gold, fontSize: 11, fontFamily: fonts.bodyBold, marginBottom: 4 },
  responsePreviewText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body },
  tapToRespond: { color: colors.gold, fontSize: 12, fontFamily: fonts.bodyBold, marginTop: 10 },

  // Response modal
  responseOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  responseSheet: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', borderTopWidth: 3, borderColor: colors.gold },
  responseHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  responseClose: { marginBottom: 12 },
  responseCloseText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
  responseTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading, marginBottom: 2 },
  responseFor: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body, marginBottom: 14 },
  requestBox: { backgroundColor: '#FFFBF0', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.propheticBorder },
  requestBoxLabel: { color: colors.gold, fontSize: 11, fontFamily: fonts.bodyBold, marginBottom: 6 },
  requestBoxText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  responseLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  responseInput: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, fontFamily: fonts.headingRegular, marginBottom: 16, borderWidth: 1.5, borderColor: colors.border, height: 180, textAlignVertical: 'top' },
  sendResponseBtn: { backgroundColor: colors.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
  sendResponseText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },

  // Moderation
  modCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
  modHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 10 },
  modContent: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  modLikes: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 8 },

  // Stats
  statsTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading, marginBottom: 16 },
  statCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
  statIcon: { fontSize: 26 },
  statLabel: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodyBold },
  statSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  statValue: { color: colors.primary, fontSize: 26, fontFamily: fonts.heading },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  empty: { alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.body },
});
