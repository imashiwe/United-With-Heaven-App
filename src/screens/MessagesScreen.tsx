import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { supabase } from '../lib/supabase';
import { inspirationalMessages as localMessages } from '../data/content';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';

const { height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string; title: string; content: string; author: string; created_at: string;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
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
            <Text style={styles.readMore}>Read message →</Text>
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
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FullscreenPhoto source={images.somethingGood} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight },
  featuredCard: { backgroundColor: colors.parchment, borderColor: colors.border, borderWidth: 1.5 },
  featuredBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  featuredBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8, fontFamily: 'serif' },
  cardPreview: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cardAuthor: { color: colors.primary, fontSize: 12, fontStyle: 'italic' },
  cardDate: { color: colors.textMuted, fontSize: 12 },
  readMore: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '88%', borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { marginBottom: 8 },
  closeText: { color: colors.textMuted, fontSize: 14 },
  modalEyebrow: { color: colors.primary, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 12 },
  modalTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', fontFamily: 'serif' },
  divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 20 },
  modalMessage: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontFamily: 'serif' },
  modalFooter: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  modalAuthor: { color: colors.primary, fontSize: 13, fontStyle: 'italic' },
  modalDate: { color: colors.textMuted, fontSize: 13 },
});
