import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../../theme';
import { supabase } from '../../lib/supabase';
import { images } from '../../images';
import FullscreenPhoto from '../../components/FullscreenPhoto';
import PhotoHeader from '../../components/PhotoHeader';
import ReactionButton from '../../components/ReactionButton';
import CommentsModal from '../../components/CommentsModal';
import { getSessionId, getProfile } from '../../utils/session';

const { height: screenHeight } = Dimensions.get('window');

interface Testimony {
  id: string; name: string; title: string; story: string;
  video_url: string | null; category: string; likes: number; created_at: string;
}

const CATEGORIES = ['General', 'Healing', 'Finances', 'Identity', 'Breakthrough', 'Guidance'];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Healing:      { bg: '#E8F8F0', text: '#2A8A5A' },
  Finances:     { bg: '#FFF8E0', text: '#8A6A10' },
  Identity:     { bg: '#F0F0FF', text: '#4A4AAA' },
  Breakthrough: { bg: '#FFF0E8', text: '#AA4A20' },
  Guidance:     { bg: '#E8F4FF', text: '#2A6AAA' },
  General:      { bg: '#FFF0DC', text: '#B8722A' },
};

export default function TestimoniesScreen() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [commentsFor, setCommentsFor] = useState<Testimony | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((p) => { if (p.displayName) setName(p.displayName); });
    fetchTestimonies();
  }, []);

  async function fetchTestimonies() {
    setLoading(true);
    const { data } = await supabase.from('testimonies').select('*').order('created_at', { ascending: false });
    if (data) setTestimonies(data);
    setLoading(false);
  }

  async function saveTestimony() {
    if (!title.trim() || !story.trim()) { Alert.alert('Please fill in the title and your testimony'); return; }
    setSaving(true);
    const sessionId = await getSessionId();
    const { error } = await supabase.from('testimonies').insert({
      name: name.trim() || 'Anonymous', title: title.trim(), story: story.trim(), category,
      session_id: sessionId,
    });
    if (error) { Alert.alert('Error', 'Could not submit. Please try again.'); }
    else { setTitle(''); setStory(''); setCategory('General'); setModalVisible(false); fetchTestimonies(); }
    setSaving(false);
  }

  const filtered = filterCategory === 'All' ? testimonies : testimonies.filter((t) => t.category === filterCategory);

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.flowers}
        eyebrow="✦  Give God Glory  ✦"
        heading="Testimonies"
        sub="God is still in the miracle business"
        quote="Give thanks to the Lord, for he is good; his love endures forever."
        quoteRef="Psalm 107:1"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.addBtn, shadow.small]} onPress={() => setModalVisible(true)}>
          <Ionicons name="flame" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Share Your Testimony</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8 }}>
          {['All', ...CATEGORIES].map((cat) => (
            <TouchableOpacity key={cat} style={[styles.filterBtn, filterCategory === cat && styles.filterActive]} onPress={() => setFilterCategory(cat)}>
              <Text style={[styles.filterText, filterCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

        {!loading && filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={48} color={colors.primaryLight} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No testimonies yet in this category.</Text>
            <Text style={styles.emptySubText}>Be the first to share what God has done!</Text>
          </View>
        )}

        {filtered.map((item) => {
          const col = categoryColors[item.category] || categoryColors['General'];
          return (
            <View key={item.id} style={[styles.card, shadow.small]}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name || 'A')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: col.bg }]}>
                  <Text style={[styles.categoryBadgeText, { color: col.text }]}>{item.category}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardStory} numberOfLines={4}>{item.story}</Text>
              <View style={styles.actionRow}>
                <ReactionButton
                  parentType="testimony"
                  parentId={item.id}
                  reactionType="amen"
                  label="Amen"
                  emoji="🔥"
                  activeColor="#AA4A2A"
                  activeBg="#FFF0E8"
                />
                <TouchableOpacity
                  style={styles.commentBtn}
                  onPress={() => setCommentsFor(item)}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                  <Text style={styles.commentBtnText}>Comment</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Compose modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Your Testimony</Text>
            <Text style={styles.modalSub}>Encourage someone today with what God has done for you.</Text>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="Your name (optional)" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Title (e.g. God restored my marriage)" placeholderTextColor={colors.textLight} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Tell your story..." placeholderTextColor={colors.textLight} value={story} onChangeText={setStory} multiline numberOfLines={6} textAlignVertical="top" />
            <TouchableOpacity style={styles.submitBtn} onPress={saveTestimony} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Share Testimony</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FullscreenPhoto source={images.flowers} visible={photoVisible} onClose={() => setPhotoVisible(false)} />

      {commentsFor && (
        <CommentsModal
          visible={!!commentsFor}
          onClose={() => setCommentsFor(null)}
          parentType="testimony"
          parentId={commentsFor.id}
          parentTitle={commentsFor.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 16, gap: 8 },
  addBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  filterScroll: { marginBottom: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bodySemiBold },
  filterTextActive: { color: colors.white },
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bodyBold },
  emptySubText: { color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', fontFamily: fonts.body },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: colors.white, fontSize: 16, fontFamily: fonts.bodyBold },
  cardName: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bodyBold },
  cardDate: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryBadgeText: { fontSize: 11, fontFamily: fonts.bodyBold },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.heading, marginBottom: 8 },
  cardStory: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  commentBtnText: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.bodySemiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeText: { color: colors.textMuted, fontSize: 14, marginBottom: 16, fontFamily: fonts.body },
  modalTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 6 },
  modalSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 20, fontFamily: fonts.body },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catBtnText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bodySemiBold },
  catBtnTextActive: { color: colors.white },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 14, borderWidth: 1.5, borderColor: colors.border, fontFamily: fonts.body },
  textArea: { height: 140 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
});
