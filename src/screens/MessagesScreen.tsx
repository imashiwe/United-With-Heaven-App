import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { supabase } from '../lib/supabase';
import { inspirationalMessages as localMessages } from '../data/content';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';
import CommentsModal from '../components/CommentsModal';

const { height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string; title: string; content: string; author: string; created_at: string;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [commentsFor, setCommentsFor] = useState<Message | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setMessages(data);
    } else {
      setMessages(localMessages.map((m) => ({ id: m.id, title: m.title, content: m.message, author: m.author, created_at: m.date })));
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.somethingGood}
        eyebrow="✦  From the Heart  ✦"
        heading="Messages"
        sub="Words that carry heaven's breath"
        quote="How sweet are your words to my taste, sweeter than honey to my mouth!"
        quoteRef="Psalm 119:103"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

        {messages.map((msg, i) => (
          <TouchableOpacity key={msg.id} style={[styles.card, shadow.small, i === 0 && styles.featuredCard]} onPress={() => setSelected(msg)}>
            {i === 0 && <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>Latest</Text></View>}
            <Text style={styles.cardTitle}>{msg.title}</Text>
            <Text style={styles.cardPreview} numberOfLines={2}>{msg.content}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardAuthor}>— {msg.author}</Text>
              <Text style={styles.cardDate}>{new Date(msg.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardActions}>
              <Text style={styles.readMore}>Read message →</Text>
              <TouchableOpacity
                style={styles.commentBtn}
                onPress={(e) => { e.stopPropagation(); setCommentsFor(msg); }}
              >
                <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} style={{ marginRight: 5 }} />
                <Text style={styles.commentBtnText}>Comment</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalEyebrow}>✦  Message  ✦</Text>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <View style={styles.divider} />
                <Text style={styles.modalMessage}>{selected.content}</Text>
                <View style={styles.modalFooter}>
                  <Text style={styles.modalAuthor}>— {selected.author}</Text>
                  <Text style={styles.modalDate}>{new Date(selected.created_at).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.commentBtnLarge}
                  onPress={() => { setSelected(null); setCommentsFor(selected); }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.commentBtnLargeText}>Leave a Comment</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FullscreenPhoto source={images.somethingGood} visible={photoVisible} onClose={() => setPhotoVisible(false)} />

      {commentsFor && (
        <CommentsModal
          visible={!!commentsFor}
          onClose={() => setCommentsFor(null)}
          parentType="message"
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
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight },
  featuredCard: { backgroundColor: colors.parchment, borderColor: colors.border, borderWidth: 1.5 },
  featuredBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  featuredBadgeText: { color: colors.white, fontSize: 11, fontFamily: fonts.bodyBold },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.heading, marginBottom: 8 },
  cardPreview: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cardAuthor: { color: colors.primary, fontSize: 12, fontFamily: fonts.body, fontStyle: 'italic' },
  cardDate: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  readMore: { color: colors.primary, fontSize: 13, fontFamily: fonts.bodyBold },
  commentBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  commentBtnText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '88%', borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { marginBottom: 8 },
  closeText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
  modalEyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: fonts.bodyBold, marginBottom: 12 },
  modalTitle: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.heading },
  divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 20 },
  modalMessage: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontFamily: fonts.headingRegular },
  modalFooter: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  modalAuthor: { color: colors.primary, fontSize: 13, fontFamily: fonts.body, fontStyle: 'italic' },
  modalDate: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.body },
  commentBtnLarge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 14, padding: 14,
  },
  commentBtnLargeText: { color: colors.primary, fontSize: 14, fontFamily: fonts.bodyBold },
});
