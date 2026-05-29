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

const { height: screenHeight } = Dimensions.get('window');

interface PrayerRequest {
  id: string; name: string; request: string; prayed_count: number; created_at: string;
}

export default function PrayerScreen() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data } = await supabase.from('prayer_requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  }

  async function saveRequest() {
    if (!request.trim()) { Alert.alert('Please enter your prayer request'); return; }
    setSaving(true);
    const { error } = await supabase.from('prayer_requests').insert({
      name: name.trim() || 'Anonymous',
      request: request.trim(),
    });
    if (error) { Alert.alert('Error', 'Could not submit. Please try again.'); }
    else { setName(''); setRequest(''); setModalVisible(false); fetchRequests(); }
    setSaving(false);
  }

  async function markPrayed(id: string, current: number) {
    await supabase.from('prayer_requests').update({ prayed_count: current + 1 }).eq('id', id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, prayed_count: current + 1 } : r));
  }

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.happy}
        eyebrow="✦  Pray Together  ✦"
        heading="Prayer Requests"
        sub="Intercede together in faith"
        quote="Cast all your anxiety on him, because he cares for you."
        quoteRef="1 Peter 5:7"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.addBtn, shadow.small]} onPress={() => setModalVisible(true)}>
          <Ionicons name="hand-left" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Share Your Prayer Request</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

        {!loading && requests.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={52} color={colors.primaryLight} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No prayer requests yet.</Text>
            <Text style={styles.emptySubText}>Be the first to share your heart with the community.</Text>
          </View>
        )}

        {requests.map((item) => (
          <View key={item.id} style={[styles.card, shadow.small]}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.cardRequest}>{item.request}</Text>
            <TouchableOpacity style={styles.prayBtn} onPress={() => markPrayed(item.id, item.prayed_count)}>
              <Ionicons name="hand-left" size={14} color="#4A5AAA" style={{ marginRight: 6 }} />
              <Text style={styles.prayBtnText}>I Prayed  ·  {item.prayed_count}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Your Request</Text>
            <Text style={styles.modalSub}>Your request will be seen and prayed over by the community.</Text>
            <TextInput style={styles.input} placeholder="Your name (optional)" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your prayer request..."
              placeholderTextColor={colors.textLight}
              value={request} onChangeText={setRequest}
              multiline numberOfLines={5} textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={saveRequest} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FullscreenPhoto source={images.happy} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 24, gap: 8 },
  addBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptySubText: { color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  cardName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  cardDate: { color: colors.textMuted, fontSize: 12 },
  cardRequest: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  prayBtn: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF0FF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  prayBtnText: { color: '#4A5AAA', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeText: { color: colors.textMuted, fontSize: 14, marginBottom: 16 },
  modalTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', fontFamily: 'serif', marginBottom: 6 },
  modalSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 20, lineHeight: 20 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 14, borderWidth: 1.5, borderColor: colors.border },
  textArea: { height: 120 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
