import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { supabase } from '../lib/supabase';
import { propheticFlows as localFlows } from '../data/content';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';

const { height: screenHeight } = Dimensions.get('window');

interface PropheticFlow {
  id: string; title: string; content: string; author: string; created_at: string;
}

export default function PropheticScreen() {
  const [flows, setFlows] = useState<PropheticFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PropheticFlow | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);

  useEffect(() => { fetchFlows(); }, []);

  async function fetchFlows() {
    setLoading(true);
    const { data } = await supabase.from('prophetic_flows').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setFlows(data);
    } else {
      setFlows(localFlows.map((f) => ({ id: f.id, title: f.title, content: f.content, author: f.author, created_at: f.date })));
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.divineThoughts}
        eyebrow="✦  A Word for This Season  ✦"
        heading="Prophetic Flows"
        sub="Words released in the Spirit"
        quote="For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope."
        quoteRef="Jeremiah 29:11"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Ionicons name="flash" size={20} color={colors.gold} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            Receive with an open heart and test all things by the Word of God.
          </Text>
        </View>

        {loading && <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />}

        {flows.map((flow) => (
          <TouchableOpacity key={flow.id} style={[styles.card, shadow.small]} onPress={() => setSelected(flow)}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="flash" size={18} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.cardDate}>{new Date(flow.created_at).toLocaleDateString()}</Text>
                <Text style={styles.cardAuthor}>{flow.author}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{flow.title}</Text>
            <Text style={styles.cardPreview} numberOfLines={2}>{flow.content}</Text>
            <Text style={styles.readMore}>Read full word →</Text>
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
                <Ionicons name="flash" size={36} color={colors.gold} style={styles.modalIcon} />
                <Text style={styles.modalEyebrow}>Prophetic Word</Text>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.modalMeta}>{selected.author} · {new Date(selected.created_at).toLocaleDateString()}</Text>
                <View style={styles.divider} />
                <Text style={styles.modalBody}>{selected.content}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FullscreenPhoto source={images.divineThoughts} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.propheticBg, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1.5, borderColor: colors.propheticBorder },
  bannerIcon: { marginRight: 10, marginTop: 1 },
  bannerText: { color: colors.propheticText, fontSize: 13, lineHeight: 20, flex: 1, fontStyle: 'italic' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4, borderLeftColor: colors.gold },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.propheticBg, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.propheticBorder },
  cardDate: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  cardAuthor: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 8, fontFamily: 'serif' },
  cardPreview: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  readMore: { color: colors.gold, fontSize: 13, fontWeight: '700', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.propheticBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '88%', borderTopWidth: 3, borderColor: colors.gold },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.propheticBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { marginBottom: 8 },
  closeText: { color: colors.textMuted, fontSize: 14 },
  modalIcon: { marginBottom: 8 },
  modalEyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 },
  modalTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', fontFamily: 'serif' },
  modalMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  divider: { height: 1.5, backgroundColor: colors.propheticBorder, marginVertical: 20 },
  modalBody: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontFamily: 'serif' },
});
