import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../../theme';
import { supabase } from '../../lib/supabase';
import { images } from '../../images';
import FullscreenPhoto from '../../components/FullscreenPhoto';
import PhotoHeader from '../../components/PhotoHeader';

const { height: screenHeight } = Dimensions.get('window');

interface DiaryEntry {
  id: string; title: string; entry: string; mood: string; entry_date: string; created_at: string;
}

interface DiaryComment {
  id: string; entry_id: string; name: string; comment: string; created_at: string;
}

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '💪', label: 'Powerful' },
  { emoji: '🦁', label: 'Strong' },
  { emoji: '✨', label: 'Glorious' },
  { emoji: '👑', label: 'Victorious' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '🕊️', label: 'Peaceful' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '🌟', label: 'Blessed' },
  { emoji: '🌈', label: 'Hopeful' },
  { emoji: '😢', label: 'Struggling' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DiaryScreen() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewEntry, setViewEntry] = useState<DiaryEntry | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);

  // Write form
  const [title, setTitle] = useState('');
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState('🙏');
  const [saving, setSaving] = useState(false);

  // Comments
  const [comments, setComments] = useState<DiaryComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchEntries(); }, []);

  useEffect(() => {
    if (viewEntry) fetchComments(viewEntry.id);
    else setComments([]);
  }, [viewEntry]);

  async function fetchEntries() {
    setLoading(true);
    const { data } = await supabase.from('diary_entries').select('*').order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }

  async function fetchComments(entryId: string) {
    setLoadingComments(true);
    const { data } = await supabase
      .from('diary_comments')
      .select('*')
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
    setLoadingComments(false);
  }

  async function publishEntry() {
    if (!entry.trim()) { Alert.alert('Please write something'); return; }
    setSaving(true);
    const { error } = await supabase.from('diary_entries').insert({
      title: title.trim() || 'My Reflection',
      entry: entry.trim(),
      mood,
      entry_date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    });
    if (error) { Alert.alert('Error', 'Could not publish entry.'); }
    else { setTitle(''); setEntry(''); setMood('🙏'); setModalVisible(false); fetchEntries(); }
    setSaving(false);
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('diary_comments').insert({
      entry_id: viewEntry!.id,
      name: commentName.trim() || 'Anonymous',
      comment: commentText.trim(),
    });
    if (error) { Alert.alert('Error', 'Could not post comment.'); }
    else {
      setCommentName('');
      setCommentText('');
      fetchComments(viewEntry!.id);
    }
    setSubmitting(false);
  }

  async function deleteEntry(id: string) {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('diary_entries').delete().eq('id', id);
          setViewEntry(null);
          fetchEntries();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View>
        <PhotoHeader
          source={images.blessed}
          eyebrow="✦  Personal  ✦"
          heading="My Diary"
          sub="Imashi's Walk With God"
          quote="The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning."
          quoteRef="Lamentations 3:22–23"
          height={screenHeight * 0.52}
          onPhotoPress={() => setPhotoVisible(true)}
        />
        <TouchableOpacity style={styles.newEntryBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color={colors.white} style={{ marginRight: 5 }} />
          <Text style={styles.newEntryBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

        {!loading && entries.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={60} color={colors.primaryLight} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>Your journey starts here.</Text>
            <Text style={styles.emptySubText}>Write your first entry — capture today's moment with God.</Text>
            <TouchableOpacity style={[styles.emptyBtn, shadow.small]} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Begin Writing</Text>
            </TouchableOpacity>
          </View>
        )}

        {entries.map((item) => (
          <View key={item.id} style={[styles.card, shadow.small]}>
            {/* Top row: mood + title + menu */}
            <View style={styles.cardTop}>
              <View style={styles.moodBubble}>
                <Text style={styles.moodEmoji}>{item.mood}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.entry_date}</Text>
                {(() => { const m = MOODS.find(x => x.emoji === item.mood); return m ? <Text style={styles.cardMoodLabel}>{m.label}</Text> : null; })()}
              </View>
              <TouchableOpacity
                style={styles.cardMenu}
                onPress={() => Alert.alert(item.title, 'What would you like to do?', [
                  { text: 'Read Entry', onPress: () => setViewEntry(item) },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(item.id) },
                  { text: 'Cancel', style: 'cancel' },
                ])}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {/* Preview tap area */}
            <TouchableOpacity onPress={() => setViewEntry(item)} activeOpacity={0.7}>
              <Text style={styles.cardPreview} numberOfLines={2}>{item.entry}</Text>
              <View style={styles.cardFooterRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.textLight} style={{ marginRight: 4 }} />
                <Text style={styles.cardCommentHint}>Read & comment</Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Write / Publish Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Entry</Text>
            <Text style={styles.moodLabel}>How are you feeling today?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll} contentContainerStyle={styles.moodScrollContent}>
              {MOODS.map((m) => (
                <TouchableOpacity key={m.emoji} style={[styles.moodBtn, mood === m.emoji && styles.moodBtnActive]} onPress={() => setMood(m.emoji)}>
                  <Text style={styles.moodBtnEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodBtnLabel, mood === m.emoji && styles.moodBtnLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="Title your entry..." placeholderTextColor={colors.textLight} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Write about your walk with God today..." placeholderTextColor={colors.textLight} value={entry} onChangeText={setEntry} multiline numberOfLines={8} textAlignVertical="top" />
            <TouchableOpacity style={styles.publishBtn} onPress={publishEntry} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.white} />
                : (
                  <View style={styles.publishInner}>
                    <Ionicons name="cloud-upload-outline" size={16} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.publishBtnText}>Publish</Text>
                  </View>
                )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Entry + Comments Modal */}
      <Modal visible={!!viewEntry} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.viewHeader}>
              <TouchableOpacity onPress={() => setViewEntry(null)}>
                <Text style={styles.closeText}>✕  Close</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => viewEntry && deleteEntry(viewEntry.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {viewEntry && (
                <>
                  <View style={styles.viewMoodRow}>
                    <Text style={styles.viewMood}>{viewEntry.mood}</Text>
                    {(() => { const m = MOODS.find(x => x.emoji === viewEntry.mood); return m ? <View style={styles.viewMoodPill}><Text style={styles.viewMoodPillText}>{m.label}</Text></View> : null; })()}
                  </View>
                  <Text style={styles.viewTitle}>{viewEntry.title}</Text>
                  <Text style={styles.viewDate}>{viewEntry.entry_date}</Text>
                  <View style={styles.divider} />
                  <Text style={styles.viewEntryText}>{viewEntry.entry}</Text>

                  {/* Comments section */}
                  <View style={styles.commentsSection}>
                    <View style={styles.commentsSectionHeader}>
                      <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} style={{ marginRight: 7 }} />
                      <Text style={styles.commentsSectionTitle}>
                        Comments {comments.length > 0 ? `· ${comments.length}` : ''}
                      </Text>
                    </View>

                    {loadingComments && <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />}

                    {!loadingComments && comments.length === 0 && (
                      <Text style={styles.noComments}>Be the first to leave a comment ✨</Text>
                    )}

                    {comments.map((c) => (
                      <View key={c.id} style={styles.commentCard}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>{c.name[0].toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentName}>{c.name}</Text>
                            <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                          </View>
                          <Text style={styles.commentText}>{c.comment}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Add comment form */}
                  <View style={styles.addCommentForm}>
                    <Text style={styles.addCommentLabel}>Leave a comment</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your name (optional)"
                      placeholderTextColor={colors.textLight}
                      value={commentName}
                      onChangeText={setCommentName}
                    />
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={[styles.input, styles.commentInput]}
                        placeholder="Write something encouraging…"
                        placeholderTextColor={colors.textLight}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        style={[styles.commentSubmitBtn, !commentText.trim() && { opacity: 0.5 }]}
                        onPress={submitComment}
                        disabled={submitting || !commentText.trim()}
                      >
                        {submitting
                          ? <ActivityIndicator color={colors.white} size="small" />
                          : <Ionicons name="send" size={18} color={colors.white} />}
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FullscreenPhoto source={images.blessed} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  newEntryBtn: {
    position: 'absolute', bottom: 22, right: 18,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(184,114,42,0.85)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  newEntryBtnText: { color: colors.white, fontSize: 13, fontFamily: fonts.bodyBold },
  scroll: { padding: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading },
  emptySubText: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  moodBubble: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.border },
  moodEmoji: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bodyBold },
  cardDate: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 4 },
  cardMoodLabel: { color: colors.primaryLight, fontSize: 11, fontFamily: fonts.bodyBold },
  cardMenu: { padding: 4, marginLeft: 8 },
  cardPreview: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fonts.body, marginBottom: 10 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center' },
  cardCommentHint: { color: colors.textLight, fontSize: 12, fontFamily: fonts.body },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeText: { color: colors.textMuted, fontSize: 14, marginBottom: 16, fontFamily: fonts.body },
  modalTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 16 },
  moodLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 10, fontFamily: fonts.body },
  moodScroll: { marginBottom: 18 },
  moodScrollContent: { gap: 8, paddingRight: 4 },
  moodBtn: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card, minWidth: 64,
  },
  moodBtnActive: { backgroundColor: colors.parchment, borderColor: colors.primary },
  moodBtnEmoji: { fontSize: 26, marginBottom: 4 },
  moodBtnLabel: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.textMuted, textAlign: 'center' },
  moodBtnLabelActive: { color: colors.primary },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 12, borderWidth: 1.5, borderColor: colors.border, fontFamily: fonts.body },
  textArea: { height: 160 },

  // Publish button
  publishBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  publishInner: { flexDirection: 'row', alignItems: 'center' },
  publishBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },

  // View entry
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deleteText: { color: '#CC3333', fontSize: 14, fontFamily: fonts.body },
  viewMoodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  viewMood: { fontSize: 44 },
  viewMoodPill: { backgroundColor: colors.parchment, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  viewMoodPillText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bodyBold },
  viewTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.heading },
  viewDate: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 20 },
  viewEntryText: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontFamily: fonts.headingRegular },

  // Comments section
  commentsSection: { marginTop: 28 },
  commentsSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  commentsSectionTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodyBold },
  noComments: { color: colors.textLight, fontSize: 13, fontFamily: fonts.body, fontStyle: 'italic', marginBottom: 16 },
  commentCard: { flexDirection: 'row', marginBottom: 14 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  commentAvatarText: { color: colors.white, fontSize: 14, fontFamily: fonts.bodyBold },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentName: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bodyBold },
  commentTime: { color: colors.textLight, fontSize: 11, fontFamily: fonts.body },
  commentText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: fonts.body },

  // Add comment
  addCommentForm: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.borderLight },
  addCommentLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  commentInputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  commentInput: { flex: 1, height: 90, marginBottom: 0 },
  commentSubmitBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
