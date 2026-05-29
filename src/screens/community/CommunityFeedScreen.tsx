import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
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

const { height: screenHeight } = Dimensions.get('window');

interface Post {
  id: string;
  name: string;
  content: string | null;
  media_url: string | null;
  media_type: 'text' | 'image' | 'song' | 'link';
  link_title: string | null;
  likes: number;
  created_at: string;
}

const POST_TYPES = [
  { key: 'text',  label: 'Message', icon: 'chatbubble-ellipses' as const, color: '#B8722A' },
  { key: 'image', label: 'Photo',   icon: 'image' as const,               color: '#C9973A' },
  { key: 'song',  label: 'Song',    icon: 'musical-notes' as const,       color: '#8B6820' },
  { key: 'link',  label: 'Link',    icon: 'link' as const,                color: '#AA4A20' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CommunityFeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Form state
  const [postType, setPostType] = useState<'text' | 'image' | 'song' | 'link'>('text');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function submitPost() {
    if (!content.trim() && !mediaUrl.trim()) {
      Alert.alert('Please add some content to your post');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('community_posts').insert({
      name: name.trim() || 'Anonymous',
      content: content.trim() || null,
      media_url: mediaUrl.trim() || null,
      media_type: postType,
      link_title: linkTitle.trim() || null,
    });
    if (error) {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } else {
      setName(''); setContent(''); setMediaUrl(''); setLinkTitle('');
      setPostType('text');
      setModalVisible(false);
      fetchPosts();
    }
    setSaving(false);
  }

  async function likePost(id: string, current: number) {
    await supabase.from('community_posts').update({ likes: current + 1 }).eq('id', id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likes: current + 1 } : p));
  }

  function resetForm() {
    setName(''); setContent(''); setMediaUrl(''); setLinkTitle('');
    setPostType('text');
  }

  const typeInfo = POST_TYPES.find((t) => t.key === postType)!;

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.happy}
        eyebrow="✦  United With Heaven  ✦"
        heading="Community"
        sub="Share what God is doing"
        quote="Let us not give up meeting together, but encourage one another."
        quoteRef="Hebrews 10:25"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Post prompt bar */}
        <TouchableOpacity style={[styles.promptBar, shadow.small]} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.promptAvatar}>
            <Ionicons name="person" size={18} color={colors.textLight} />
          </View>
          <Text style={styles.promptText}>Share something with the community…</Text>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Post type quick-select */}
        <View style={styles.quickTypes}>
          {POST_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.quickTypeBtn}
              onPress={() => { setPostType(t.key as any); setModalVisible(true); }}
            >
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
            <Text style={styles.emptySub}>Share what God is doing in your life — a word, a photo, a song, or a link.</Text>
          </View>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={likePost} onImagePress={(url) => setFullscreenImage(url)} />
        ))}
      </ScrollView>

      {/* Compose modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.closeText}>✕  Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Post</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Type selector */}
            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, postType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                  onPress={() => setPostType(t.key as any)}
                >
                  <Ionicons name={t.icon} size={16} color={postType === t.key ? '#FFF' : t.color} />
                  <Text style={[styles.typeBtnLabel, postType === t.key && { color: '#FFF' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
            />

            {postType === 'text' && (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is God doing in your life? Share a word, encouragement, or reflection…"
                placeholderTextColor={colors.textLight}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            )}

            {postType === 'image' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Paste image URL (https://...)"
                  placeholderTextColor={colors.textLight}
                  value={mediaUrl}
                  onChangeText={setMediaUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Caption (optional)"
                  placeholderTextColor={colors.textLight}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

            {postType === 'song' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Song title or artist"
                  placeholderTextColor={colors.textLight}
                  value={linkTitle}
                  onChangeText={setLinkTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share the lyrics, or a verse that spoke to you…"
                  placeholderTextColor={colors.textLight}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </>
            )}

            {postType === 'link' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Title or description of the link"
                  placeholderTextColor={colors.textLight}
                  value={linkTitle}
                  onChangeText={setLinkTitle}
                />
                <TextInput
                  style={styles.input}
                  placeholder="URL (https://...)"
                  placeholderTextColor={colors.textLight}
                  value={mediaUrl}
                  onChangeText={setMediaUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Why are you sharing this? (optional)"
                  placeholderTextColor={colors.textLight}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: typeInfo.color }]} onPress={submitPost} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.white} />
                : (
                  <View style={styles.submitInner}>
                    <Ionicons name={typeInfo.icon} size={16} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Share {typeInfo.label}</Text>
                  </View>
                )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FullscreenPhoto source={images.happy} visible={photoVisible} onClose={() => setPhotoVisible(false)} />

      {/* Fullscreen for user-posted images (URL-based) */}
      {fullscreenImage && (
        <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={() => setFullscreenImage(null)}>
          <View style={styles.fsOverlay}>
            <Image source={{ uri: fullscreenImage }} style={styles.fsImage} resizeMode="contain" />
            <TouchableOpacity style={styles.fsClose} onPress={() => setFullscreenImage(null)}>
              <View style={styles.fsCloseInner}>
                <Ionicons name="close" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

function PostCard({ post, onLike, onImagePress }: {
  post: Post;
  onLike: (id: string, likes: number) => void;
  onImagePress: (url: string) => void;
}) {
  const typeColors: Record<string, { icon: any; bg: string; tint: string }> = {
    text:  { icon: 'chatbubble-ellipses',  bg: '#FFF8EE', tint: '#B8722A' },
    image: { icon: 'image',                bg: '#FFF8E0', tint: '#C9973A' },
    song:  { icon: 'musical-notes',        bg: '#FFF4D6', tint: '#8B6820' },
    link:  { icon: 'link',                 bg: '#FFF0E8', tint: '#AA4A20' },
  };
  const tc = typeColors[post.media_type] || typeColors.text;

  return (
    <View style={[styles.card, shadow.small]}>
      {/* Card header */}
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
          <Text style={[styles.typePillText, { color: tc.tint }]}>
            {post.media_type.charAt(0).toUpperCase() + post.media_type.slice(1)}
          </Text>
        </View>
      </View>

      {/* Song title */}
      {post.media_type === 'song' && post.link_title && (
        <View style={styles.songTitleRow}>
          <Ionicons name="musical-note" size={13} color="#4A4AAA" style={{ marginRight: 6 }} />
          <Text style={styles.songTitleText}>{post.link_title}</Text>
        </View>
      )}

      {/* Image */}
      {post.media_type === 'image' && post.media_url && (
        <TouchableOpacity onPress={() => onImagePress(post.media_url!)} activeOpacity={0.9}>
          <Image
            source={{ uri: post.media_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {/* Link card */}
      {post.media_type === 'link' && post.media_url && (
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL(post.media_url!)}
          activeOpacity={0.85}
        >
          <Ionicons name="globe-outline" size={20} color="#AA4A20" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            {post.link_title && <Text style={styles.linkTitle}>{post.link_title}</Text>}
            <Text style={styles.linkUrl} numberOfLines={1}>{post.media_url}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#AA4A20" />
        </TouchableOpacity>
      )}

      {/* Text content */}
      {post.content && (
        <Text style={[
          styles.cardContent,
          post.media_type === 'song' && styles.cardContentSong,
        ]}>
          {post.content}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(post.id, post.likes)}>
          <Ionicons name="heart" size={14} color="#C04040" style={{ marginRight: 5 }} />
          <Text style={styles.likeBtnText}>Amen  ·  {post.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 18, paddingBottom: 40 },

  // Prompt bar
  promptBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  promptAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1, borderColor: colors.border,
  },
  promptText: { flex: 1, color: colors.textLight, fontSize: 14, fontFamily: fonts.body },

  // Quick type buttons
  quickTypes: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderRadius: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.borderLight, gap: 5,
  },
  quickTypeLabel: { fontSize: 12, fontFamily: fonts.bodyBold },

  // Empty state
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading, marginBottom: 10 },
  emptySub: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center', fontFamily: fonts.body },

  // Post card
  card: {
    backgroundColor: colors.white, borderRadius: 18,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardAvatarText: { color: '#FFF', fontSize: 16, fontFamily: fonts.bodyBold },
  cardName: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodyBold },
  cardTime: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  typePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12,
  },
  typePillText: { fontSize: 11, fontFamily: fonts.bodyBold },

  // Song title row
  songTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F0FF', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  songTitleText: { color: '#4A4AAA', fontSize: 14, fontFamily: fonts.bodySemiBold },

  // Image
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 10 },

  // Link card
  linkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF3EA', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  linkTitle: { color: '#AA4A20', fontSize: 14, fontFamily: fonts.bodyBold, marginBottom: 2 },
  linkUrl: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body },

  // Content
  cardContent: {
    color: colors.textPrimary, fontSize: 15,
    lineHeight: 24, fontFamily: fonts.body,
    marginBottom: 12,
  },
  cardContentSong: {
    fontStyle: 'italic',
    fontFamily: fonts.headingRegular,
    fontSize: 15, lineHeight: 26,
    color: colors.textSecondary,
  },

  // Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  likeBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF0F0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  likeBtnText: { color: '#C04040', fontSize: 13, fontFamily: fonts.bodySemiBold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 32,
    borderTopWidth: 3, borderColor: colors.primary,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  closeText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },

  // Type row
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 12, gap: 5,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
  },
  typeBtnLabel: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.textSecondary },

  // Form
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    color: colors.textPrimary, fontSize: 15, marginBottom: 12,
    borderWidth: 1.5, borderColor: colors.border,
    fontFamily: fonts.body,
  },
  textArea: { height: 130 },

  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  submitInner: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },

  // Fullscreen image modal
  fsOverlay: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  fsImage: { width: '100%', height: '100%' },
  fsClose: { position: 'absolute', top: 50, right: 18 },
  fsCloseInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
});
