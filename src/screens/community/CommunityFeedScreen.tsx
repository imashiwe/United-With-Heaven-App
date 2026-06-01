import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Dimensions, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadow } from '../../theme';
import { supabase } from '../../lib/supabase';
import { images } from '../../images';
import FullscreenPhoto from '../../components/FullscreenPhoto';
import PhotoHeader from '../../components/PhotoHeader';
import ReactionButton from '../../components/ReactionButton';
import CommentsModal from '../../components/CommentsModal';
import { getSessionId, getProfile } from '../../utils/session';

const { height: screenHeight } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Post {
  id: string; name: string; content: string | null; media_url: string | null;
  media_type: 'text' | 'image' | 'song' | 'link'; link_title: string | null;
  likes: number; created_at: string;
}
interface Group {
  id: string; name: string; description: string; icon: string; color: string; member_count: number;
}
interface GroupPost {
  id: string; group_id: string; display_name: string; content: string; likes: number; created_at: string;
}
interface PrayerMessage {
  id: string; display_name: string; content: string; created_at: string;
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function CommunityFeedScreen() {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'room'>('feed');
  const [photoVisible, setPhotoVisible] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [displayName, setDisplayName] = useState('Anonymous');

  useEffect(() => {
    getSessionId().then(setSessionId);
    getProfile().then((p) => { if (p.displayName) setDisplayName(p.displayName); });
  }, []);

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.happy}
        eyebrow="✦  United With Heaven  ✦"
        heading="Community"
        sub="Share what God is doing"
        quote="Let us not give up meeting together, but encourage one another."
        quoteRef="Hebrews 10:25"
        height={screenHeight * 0.45}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      {/* Segment control */}
      <View style={styles.segments}>
        {([['feed', 'people', 'Feed'], ['groups', 'grid', 'Groups'], ['room', 'radio', 'Prayer Room']] as const).map(([key, icon, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.segBtn, activeTab === key && styles.segBtnActive]}
            onPress={() => setActiveTab(key)}
          >
            <Ionicons name={activeTab === key ? icon : `${icon}-outline` as any} size={14} color={activeTab === key ? colors.white : colors.textSecondary} />
            <Text style={[styles.segLabel, activeTab === key && styles.segLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'feed' && <FeedPanel sessionId={sessionId} displayName={displayName} />}
      {activeTab === 'groups' && <GroupsPanel sessionId={sessionId} displayName={displayName} />}
      {activeTab === 'room' && <PrayerRoomPanel sessionId={sessionId} displayName={displayName} />}

      <FullscreenPhoto source={images.happy} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Feed Panel (existing community feed)
// ─────────────────────────────────────────────
const POST_TYPES = [
  { key: 'text',  label: 'Message', icon: 'chatbubble-ellipses' as const, color: '#B8722A' },
  { key: 'image', label: 'Photo',   icon: 'image' as const,               color: '#C9973A' },
  { key: 'song',  label: 'Song',    icon: 'musical-notes' as const,       color: '#8B6820' },
  { key: 'link',  label: 'Link',    icon: 'link' as const,                color: '#AA4A20' },
];

function FeedPanel({ sessionId, displayName }: { sessionId: string; displayName: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [commentsFor, setCommentsFor] = useState<Post | null>(null);

  const [postType, setPostType] = useState<'text' | 'image' | 'song' | 'link'>('text');
  const [name, setName] = useState(displayName);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { setName(displayName); }, [displayName]);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function submitPost() {
    if (!content.trim() && !mediaUrl.trim()) { Alert.alert('Please add some content'); return; }
    setSaving(true);
    const sid = sessionId || await getSessionId();
    const { error } = await supabase.from('community_posts').insert({
      name: name.trim() || 'Anonymous', content: content.trim() || null,
      media_url: mediaUrl.trim() || null, media_type: postType,
      link_title: linkTitle.trim() || null, session_id: sid,
    });
    if (error) { Alert.alert('Error', 'Could not submit. Please try again.'); }
    else { setContent(''); setMediaUrl(''); setLinkTitle(''); setPostType('text'); setModalVisible(false); fetchPosts(); }
    setSaving(false);
  }

  const typeInfo = POST_TYPES.find((t) => t.key === postType)!;

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.promptBar, shadow.small]} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.promptAvatar}><Ionicons name="person" size={18} color={colors.textLight} /></View>
          <Text style={styles.promptText}>Share something with the community…</Text>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.quickTypes}>
          {POST_TYPES.map((t) => (
            <TouchableOpacity key={t.key} style={styles.quickTypeBtn} onPress={() => { setPostType(t.key as any); setModalVisible(true); }}>
              <Ionicons name={t.icon} size={16} color={t.color} />
              <Text style={[styles.quickTypeLabel, { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
        {!loading && posts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={colors.primaryLight} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Be the first to post!</Text>
            <Text style={styles.emptySub}>Share what God is doing in your life.</Text>
          </View>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onImagePress={setFullscreenImage} onComment={() => setCommentsFor(post)} />
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>✕  Cancel</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>New Post</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, postType === t.key && { backgroundColor: t.color, borderColor: t.color }]} onPress={() => setPostType(t.key as any)}>
                  <Ionicons name={t.icon} size={16} color={postType === t.key ? '#FFF' : t.color} />
                  <Text style={[styles.typeBtnLabel, postType === t.key && { color: '#FFF' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Your name (optional)" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
            {postType === 'text' && (
              <TextInput style={[styles.input, styles.textArea]} placeholder="What is God doing in your life?" placeholderTextColor={colors.textLight} value={content} onChangeText={setContent} multiline numberOfLines={6} textAlignVertical="top" />
            )}
            {postType === 'image' && (
              <>
                <TextInput style={styles.input} placeholder="Paste image URL" placeholderTextColor={colors.textLight} value={mediaUrl} onChangeText={setMediaUrl} autoCapitalize="none" keyboardType="url" />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Caption (optional)" placeholderTextColor={colors.textLight} value={content} onChangeText={setContent} multiline numberOfLines={3} textAlignVertical="top" />
              </>
            )}
            {postType === 'song' && (
              <>
                <TextInput style={styles.input} placeholder="Song title or artist" placeholderTextColor={colors.textLight} value={linkTitle} onChangeText={setLinkTitle} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Share the lyrics or a verse…" placeholderTextColor={colors.textLight} value={content} onChangeText={setContent} multiline numberOfLines={5} textAlignVertical="top" />
              </>
            )}
            {postType === 'link' && (
              <>
                <TextInput style={styles.input} placeholder="Title or description" placeholderTextColor={colors.textLight} value={linkTitle} onChangeText={setLinkTitle} />
                <TextInput style={styles.input} placeholder="URL (https://...)" placeholderTextColor={colors.textLight} value={mediaUrl} onChangeText={setMediaUrl} autoCapitalize="none" keyboardType="url" />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Why are you sharing this?" placeholderTextColor={colors.textLight} value={content} onChangeText={setContent} multiline numberOfLines={3} textAlignVertical="top" />
              </>
            )}
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: typeInfo.color }]} onPress={submitPost} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : (
                <View style={styles.submitInner}>
                  <Ionicons name={typeInfo.icon} size={16} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Share {typeInfo.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {fullscreenImage && (
        <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={() => setFullscreenImage(null)}>
          <View style={styles.fsOverlay}>
            <Image source={{ uri: fullscreenImage }} style={styles.fsImage} resizeMode="contain" />
            <TouchableOpacity style={styles.fsClose} onPress={() => setFullscreenImage(null)}>
              <View style={styles.fsCloseInner}><Ionicons name="close" size={20} color="#FFF" /></View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {commentsFor && (
        <CommentsModal
          visible={!!commentsFor}
          onClose={() => setCommentsFor(null)}
          parentType="testimony"
          parentId={commentsFor.id}
          parentTitle={commentsFor.content?.slice(0, 60) ?? 'Post'}
        />
      )}
    </>
  );
}

function PostCard({ post, onImagePress, onComment }: { post: Post; onImagePress: (url: string) => void; onComment: () => void }) {
  const typeColors: Record<string, { icon: any; bg: string; tint: string }> = {
    text:  { icon: 'chatbubble-ellipses', bg: '#FFF8EE', tint: '#B8722A' },
    image: { icon: 'image',               bg: '#FFF8E0', tint: '#C9973A' },
    song:  { icon: 'musical-notes',       bg: '#FFF4D6', tint: '#8B6820' },
    link:  { icon: 'link',                bg: '#FFF0E8', tint: '#AA4A20' },
  };
  const tc = typeColors[post.media_type] || typeColors.text;

  return (
    <View style={[styles.card, shadow.small]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardAvatar, { backgroundColor: tc.tint }]}>
          <Text style={styles.cardAvatarText}>{(post.name || 'A')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{post.name}</Text>
          <Text style={styles.cardTime}>{timeAgo(post.created_at)}</Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: tc.bg }]}>
          <Ionicons name={tc.icon} size={11} color={tc.tint} style={{ marginRight: 4 }} />
          <Text style={[styles.typePillText, { color: tc.tint }]}>{post.media_type.charAt(0).toUpperCase() + post.media_type.slice(1)}</Text>
        </View>
      </View>
      {post.media_type === 'song' && post.link_title && (
        <View style={styles.songTitleRow}>
          <Ionicons name="musical-note" size={13} color="#4A4AAA" style={{ marginRight: 6 }} />
          <Text style={styles.songTitleText}>{post.link_title}</Text>
        </View>
      )}
      {post.media_type === 'image' && post.media_url && (
        <TouchableOpacity onPress={() => onImagePress(post.media_url!)} activeOpacity={0.9}>
          <Image source={{ uri: post.media_url }} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>
      )}
      {post.media_type === 'link' && post.media_url && (
        <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL(post.media_url!)} activeOpacity={0.85}>
          <Ionicons name="globe-outline" size={20} color="#AA4A20" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            {post.link_title && <Text style={styles.linkTitle}>{post.link_title}</Text>}
            <Text style={styles.linkUrl} numberOfLines={1}>{post.media_url}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#AA4A20" />
        </TouchableOpacity>
      )}
      {post.content && (
        <Text style={[styles.cardContent, post.media_type === 'song' && styles.cardContentSong]}>{post.content}</Text>
      )}
      <View style={styles.cardFooter}>
        <ReactionButton parentType="community_post" parentId={post.id} reactionType="amen" label="Amen" emoji="❤️" activeColor="#C04040" activeBg="#FFF0F0" />
        <TouchableOpacity style={styles.commentBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} style={{ marginRight: 5 }} />
          <Text style={styles.commentBtnText}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Groups Panel
// ─────────────────────────────────────────────
function GroupsPanel({ sessionId, displayName }: { sessionId: string; displayName: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchJoined();
  }, [sessionId]);

  async function fetchGroups() {
    setLoading(true);
    const { data } = await supabase.from('groups').select('*').order('created_at');
    if (data) setGroups(data as Group[]);
    setLoading(false);
  }

  async function fetchJoined() {
    if (!sessionId) return;
    const { data } = await supabase.from('group_members').select('group_id').eq('session_id', sessionId);
    if (data) setJoined(new Set(data.map((r) => r.group_id)));
  }

  async function toggleJoin(groupId: string) {
    if (!sessionId) return;
    if (joined.has(groupId)) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('session_id', sessionId);
      setJoined((prev) => { const s = new Set(prev); s.delete(groupId); return s; });
    } else {
      await supabase.from('group_members').insert({ group_id: groupId, session_id: sessionId });
      setJoined((prev) => new Set(prev).add(groupId));
    }
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.panelTitle}>Join a Circle</Text>
        <Text style={styles.panelSub}>Connect with others who share your journey</Text>
        {groups.map((g) => {
          const isMember = joined.has(g.id);
          return (
            <View key={g.id} style={[styles.groupCard, shadow.small]}>
              <TouchableOpacity style={styles.groupCardInner} onPress={() => setSelectedGroup(g)} activeOpacity={0.85}>
                <View style={[styles.groupIcon, { backgroundColor: g.color + '22' }]}>
                  <Text style={styles.groupEmoji}>{g.icon}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupDesc} numberOfLines={2}>{g.description}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.joinBtn, isMember && styles.joinBtnJoined]}
                onPress={() => toggleJoin(g.id)}
              >
                <Text style={[styles.joinBtnText, isMember && styles.joinBtnTextJoined]}>
                  {isMember ? 'Joined ✓' : 'Join'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          sessionId={sessionId}
          displayName={displayName}
          isMember={joined.has(selectedGroup.id)}
          onJoin={() => toggleJoin(selectedGroup.id)}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </>
  );
}

function GroupDetailModal({ group, sessionId, displayName, isMember, onJoin, onClose }: {
  group: Group; sessionId: string; displayName: string;
  isMember: boolean; onJoin: () => void; onClose: () => void;
}) {
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentsFor, setCommentsFor] = useState<GroupPost | null>(null);

  useEffect(() => { fetchPosts(); }, [group.id]);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase.from('group_posts').select('*').eq('group_id', group.id).order('created_at', { ascending: false });
    if (data) setPosts(data as GroupPost[]);
    setLoading(false);
  }

  async function post() {
    if (!text.trim() || !isMember) return;
    setPosting(true);
    const sid = sessionId || await getSessionId();
    await supabase.from('group_posts').insert({
      group_id: group.id, session_id: sid,
      display_name: displayName || 'Anonymous', content: text.trim(),
    });
    setText('');
    fetchPosts();
    setPosting(false);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.groupModalOverlay}>
        <View style={styles.groupModal}>
          <View style={styles.groupModalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.groupModalTitle}>
              <Text style={styles.groupEmoji2}>{group.icon}</Text>
              <Text style={styles.groupModalName}>{group.name}</Text>
            </View>
            <TouchableOpacity
              style={[styles.joinBtnSm, isMember && styles.joinBtnSmJoined]}
              onPress={onJoin}
            >
              <Text style={[styles.joinBtnSmText, isMember && styles.joinBtnSmTextJoined]}>{isMember ? 'Leave' : 'Join'}</Text>
            </TouchableOpacity>
          </View>

          {loading
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : (
              <FlatList
                data={posts}
                keyExtractor={(p) => p.id}
                style={{ flex: 1 }}
                contentContainerStyle={posts.length === 0 ? styles.emptyContainer : { padding: 16 }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>No posts yet</Text>
                    <Text style={styles.emptySub}>{isMember ? 'Be the first to post in this circle!' : 'Join to see and post in this circle.'}</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.groupPost, shadow.small]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardAvatar, { backgroundColor: group.color }]}>
                        <Text style={styles.cardAvatarText}>{(item.display_name || 'A')[0].toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.cardName}>{item.display_name}</Text>
                        <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.groupPostContent}>{item.content}</Text>
                    <View style={styles.cardFooter}>
                      <ReactionButton parentType="group_post" parentId={item.id} reactionType="amen" label="Amen" emoji="❤️" activeColor="#C04040" activeBg="#FFF0F0" />
                      <TouchableOpacity style={styles.commentBtn} onPress={() => setCommentsFor(item)}>
                        <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} style={{ marginRight: 5 }} />
                        <Text style={styles.commentBtnText}>Comment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

          {isMember && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.groupComposer}>
                <TextInput
                  style={styles.groupComposerInput}
                  placeholder="Share with the group…"
                  placeholderTextColor={colors.textLight}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity onPress={post} disabled={!text.trim() || posting} style={[styles.sendBtn, (!text.trim() || posting) && styles.sendBtnDisabled]}>
                  {posting ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={16} color={colors.white} />}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </View>

      {commentsFor && (
        <CommentsModal
          visible={!!commentsFor}
          onClose={() => setCommentsFor(null)}
          parentType="group_post"
          parentId={commentsFor.id}
          parentTitle={commentsFor.content.slice(0, 60)}
        />
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Prayer Room Panel
// ─────────────────────────────────────────────
function PrayerRoomPanel({ sessionId, displayName }: { sessionId: string; displayName: string }) {
  const [messages, setMessages] = useState<PrayerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState(1);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    setupRealtime();
    return () => { channelRef.current?.unsubscribe(); };
  }, [sessionId]);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('prayer_room_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages(data as PrayerMessage[]);
    setLoading(false);
  }

  function setupRealtime() {
    const channel = supabase.channel('prayer-room', { config: { presence: { key: sessionId || 'anon' } } });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prayer_room_messages' }, (payload) => {
        setMessages((prev) => [payload.new as PrayerMessage, ...prev]);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setParticipants(Math.max(1, Object.keys(state).length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && sessionId) {
          await channel.track({ sessionId, displayName, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    const sid = sessionId || await getSessionId();
    await supabase.from('prayer_room_messages').insert({
      session_id: sid,
      display_name: displayName || 'Anonymous',
      content: text.trim(),
    });
    setText('');
    setSending(false);
  }

  return (
    <View style={styles.roomContainer}>
      {/* Room header */}
      <View style={styles.roomHeader}>
        <View style={styles.roomLive}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.roomParticipants}>
          <Ionicons name="people" size={14} color={colors.textMuted} /> {participants} praying now
        </Text>
      </View>

      <Text style={styles.roomDesc}>
        Post a short prayer or word. Everyone in the room sees it in real time. 🙏
      </Text>

      {loading
        ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.roomList}
            contentContainerStyle={messages.length === 0 ? styles.emptyContainer : { padding: 12 }}
            inverted
            ListEmptyComponent={
              <View style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
                <Text style={{ fontSize: 36 }}>🕊️</Text>
                <Text style={styles.emptyTitle}>The room is quiet</Text>
                <Text style={styles.emptySub}>Be the first to lift up a prayer</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.roomMsg, item.session_id === sessionId && styles.roomMsgMine]}>
                <View style={[styles.roomMsgAvatar, item.session_id === sessionId && { backgroundColor: colors.primary }]}>
                  <Text style={styles.roomMsgAvatarText}>{(item.display_name || 'A')[0].toUpperCase()}</Text>
                </View>
                <View style={[styles.roomMsgBubble, item.session_id === sessionId && styles.roomMsgBubbleMine]}>
                  <Text style={styles.roomMsgName}>{item.session_id === sessionId ? 'You' : item.display_name}</Text>
                  <Text style={styles.roomMsgText}>{item.content}</Text>
                  <Text style={styles.roomMsgTime}>{timeAgo(item.created_at)}</Text>
                </View>
              </View>
            )}
          />
        )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.roomComposer}>
          <TextInput
            style={styles.roomInput}
            placeholder="Lift up a prayer…"
            placeholderTextColor={colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={200}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!text.trim() || sending} style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}>
            {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={16} color={colors.white} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Segment control
  segments: { flexDirection: 'row', margin: 16, backgroundColor: colors.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.borderLight },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  segBtnActive: { backgroundColor: colors.primary },
  segLabel: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  segLabelActive: { color: colors.white },

  // Common scroll
  scroll: { padding: 16, paddingBottom: 40 },

  // Panel headers
  panelTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading, marginBottom: 4 },
  panelSub: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, marginBottom: 20 },

  // Feed
  promptBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
  promptAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.border },
  promptText: { flex: 1, color: colors.textLight, fontSize: 14, fontFamily: fonts.body },
  quickTypes: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.borderLight, gap: 5 },
  quickTypeLabel: { fontSize: 12, fontFamily: fonts.bodyBold },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.heading },
  emptySub: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, textAlign: 'center', lineHeight: 20 },

  // Post card
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardAvatarText: { color: '#FFF', fontSize: 16, fontFamily: fonts.bodyBold },
  cardName: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodyBold },
  cardTime: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  typePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  typePillText: { fontSize: 11, fontFamily: fonts.bodyBold },
  songTitleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  songTitleText: { color: '#4A4AAA', fontSize: 14, fontFamily: fonts.bodySemiBold },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },
  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3EA', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
  linkTitle: { color: '#AA4A20', fontSize: 14, fontFamily: fonts.bodyBold, marginBottom: 2 },
  linkUrl: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body },
  cardContent: { color: colors.textPrimary, fontSize: 15, lineHeight: 24, fontFamily: fonts.body, marginBottom: 12 },
  cardContentSong: { fontStyle: 'italic', fontFamily: fonts.headingRegular, fontSize: 15, lineHeight: 26, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  commentBtnText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32, borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  closeText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 12, gap: 5, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  typeBtnLabel: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.textSecondary },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 12, borderWidth: 1.5, borderColor: colors.border, fontFamily: fonts.body },
  textArea: { height: 130 },
  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  submitInner: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  fsOverlay: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  fsImage: { width: '100%', height: '100%' },
  fsClose: { position: 'absolute', top: 50, right: 18 },
  fsCloseInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  // Groups
  groupCard: { backgroundColor: colors.white, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' },
  groupCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  groupIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 28 },
  groupEmoji2: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bodyBold, marginBottom: 4 },
  groupDesc: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, lineHeight: 18 },
  joinBtn: { marginHorizontal: 16, marginBottom: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center' },
  joinBtnJoined: { backgroundColor: '#E8F8EE', borderColor: '#2A8A5A' },
  joinBtnText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bodyBold },
  joinBtnTextJoined: { color: '#2A8A5A' },

  // Group detail modal
  groupModalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  groupModal: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '90%', borderTopWidth: 3, borderColor: colors.primary },
  groupModalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.borderLight },
  backBtn: { padding: 6, marginRight: 8 },
  groupModalTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupModalName: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bodyBold },
  joinBtnSm: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary },
  joinBtnSmJoined: { borderColor: '#AA3030', backgroundColor: '#FFF0F0' },
  joinBtnSmText: { color: colors.primary, fontSize: 12, fontFamily: fonts.bodyBold },
  joinBtnSmTextJoined: { color: '#AA3030' },
  groupPost: { backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight },
  groupPostContent: { color: colors.textPrimary, fontSize: 14, lineHeight: 22, fontFamily: fonts.body, marginBottom: 10 },
  groupComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14, borderTopWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card },
  groupComposerInput: { flex: 1, backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body, borderWidth: 1.5, borderColor: colors.border, maxHeight: 100 },

  // Prayer room
  roomContainer: { flex: 1 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.borderLight },
  roomLive: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E84040' },
  liveText: { color: '#E84040', fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  roomParticipants: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body },
  roomDesc: { paddingHorizontal: 16, paddingVertical: 10, color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, fontStyle: 'italic', backgroundColor: '#FFFBF5', borderBottomWidth: 1, borderColor: colors.borderLight },
  roomList: { flex: 1, backgroundColor: colors.background },
  roomMsg: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roomMsgMine: { flexDirection: 'row-reverse' },
  roomMsgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 },
  roomMsgAvatarText: { color: '#FFF', fontSize: 13, fontFamily: fonts.bodyBold },
  roomMsgBubble: { maxWidth: '75%', backgroundColor: colors.white, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.borderLight },
  roomMsgBubbleMine: { backgroundColor: '#FFF3E8', borderColor: colors.border },
  roomMsgName: { color: colors.primary, fontSize: 12, fontFamily: fonts.bodyBold, marginBottom: 4 },
  roomMsgText: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },
  roomMsgTime: { color: colors.textMuted, fontSize: 10, fontFamily: fonts.body, marginTop: 4 },
  roomComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14, borderTopWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card },
  roomInput: { flex: 1, backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body, borderWidth: 1.5, borderColor: colors.border, maxHeight: 100 },

  // Shared
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.borderLight },
});
