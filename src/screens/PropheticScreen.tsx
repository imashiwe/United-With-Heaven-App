import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { supabase } from '../lib/supabase';
import { propheticFlows as localFlows } from '../data/content';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';
import { getSessionId, getProfile } from '../utils/session';

const { height: screenHeight } = Dimensions.get('window');

interface PropheticFlow {
  id: string; title: string; content: string; author: string; created_at: string;
}

interface PropheticRequest {
  id: string; display_name: string; request: string;
  status: 'pending' | 'answered'; response: string | null; created_at: string;
}

export default function PropheticScreen() {
  const [flows, setFlows] = useState<PropheticFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PropheticFlow | null>(null);
  const [photoVisible, setPhotoVisible] = useState(false);

  // Request word
  const [requestModal, setRequestModal] = useState(false);
  const [myRequests, setMyRequests] = useState<PropheticRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestName, setRequestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    fetchFlows();
    getSessionId().then((id) => {
      setSessionId(id);
      fetchMyRequests(id);
    });
    getProfile().then((p) => { if (p.displayName) setRequestName(p.displayName); });
  }, []);

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

  async function fetchMyRequests(sid: string) {
    setMyRequestsLoading(true);
    const { data } = await supabase
      .from('prophetic_requests')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: false });
    if (data) setMyRequests(data as PropheticRequest[]);
    setMyRequestsLoading(false);
  }

  async function submitRequest() {
    if (!requestText.trim()) { Alert.alert('Please describe what you need prayer for'); return; }
    setSubmitting(true);
    const sid = sessionId || await getSessionId();
    const { error } = await supabase.from('prophetic_requests').insert({
      session_id: sid,
      display_name: requestName.trim() || 'Anonymous',
      request: requestText.trim(),
    });
    if (error) {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } else {
      setRequestText('');
      setRequestModal(false);
      fetchMyRequests(sid);
      Alert.alert('✦ Submitted', 'Your request has been received. Watch this space for a response from Imashi.');
    }
    setSubmitting(false);
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
        {/* Request a Word button */}
        <TouchableOpacity style={[styles.requestBtn, shadow.small]} onPress={() => setRequestModal(true)}>
          <Ionicons name="flash" size={20} color={colors.white} />
          <Text style={styles.requestBtnText}>Request a Prophetic Word</Text>
        </TouchableOpacity>

        {/* My requests */}
        {myRequests.length > 0 && (
          <View style={styles.myRequestsSection}>
            <Text style={styles.sectionLabel}>My Requests</Text>
            {myRequestsLoading && <ActivityIndicator color={colors.gold} />}
            {myRequests.map((r) => (
              <View key={r.id} style={[styles.myRequestCard, shadow.small, r.status === 'answered' && styles.myRequestAnswered]}>
                <View style={styles.myRequestHeader}>
                  <View style={[styles.statusBadge, r.status === 'answered' ? styles.statusAnswered : styles.statusPending]}>
                    <Text style={[styles.statusText, r.status === 'answered' ? styles.statusAnsweredText : styles.statusPendingText]}>
                      {r.status === 'answered' ? '✓ Answered' : '⏳ Pending'}
                    </Text>
                  </View>
                  <Text style={styles.myRequestDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.myRequestText} numberOfLines={2}>{r.request}</Text>
                {r.status === 'answered' && r.response && (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>✦  Prophetic Response</Text>
                    <Text style={styles.responseText}>{r.response}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

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

      {/* Flow detail modal */}
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

      {/* Request a word modal */}
      <Modal visible={requestModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.requestModalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity onPress={() => setRequestModal(false)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            <Ionicons name="flash" size={32} color={colors.gold} style={{ marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Request a Prophetic Word</Text>
            <Text style={styles.requestSub}>
              Share what is on your heart. Imashi will pray over your request and respond with a word from the Lord.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.textLight}
              value={requestName}
              onChangeText={setRequestName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What are you believing God for? Share your situation or prayer need…"
              placeholderTextColor={colors.textLight}
              value={requestText}
              onChangeText={setRequestText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitRequest} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FullscreenPhoto source={images.divineThoughts} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  requestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold, borderRadius: 14, padding: 16, marginBottom: 20, gap: 8 },
  requestBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },

  sectionLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: fonts.bodyBold, marginBottom: 12 },
  myRequestsSection: { marginBottom: 20 },
  myRequestCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4, borderLeftColor: colors.gold },
  myRequestAnswered: { borderLeftColor: '#2A8A5A', backgroundColor: '#F0FFF8' },
  myRequestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusAnswered: { backgroundColor: '#D0FFE8' },
  statusPending: { backgroundColor: '#FFF8E0' },
  statusText: { fontSize: 12, fontFamily: fonts.bodyBold },
  statusAnsweredText: { color: '#2A8A5A' },
  statusPendingText: { color: '#8A6A10' },
  myRequestDate: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body },
  myRequestText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  responseBox: { marginTop: 12, backgroundColor: '#FFFBF0', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: colors.propheticBorder },
  responseLabel: { color: colors.gold, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1, marginBottom: 8 },
  responseText: { color: colors.textPrimary, fontSize: 14, lineHeight: 22, fontFamily: fonts.headingRegular, fontStyle: 'italic' },

  banner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.propheticBg, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1.5, borderColor: colors.propheticBorder },
  bannerIcon: { marginRight: 10, marginTop: 1 },
  bannerText: { color: colors.propheticText, fontSize: 13, lineHeight: 20, flex: 1, fontStyle: 'italic', fontFamily: fonts.body },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4, borderLeftColor: colors.gold },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.propheticBg, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.propheticBorder },
  cardDate: { color: colors.gold, fontSize: 12, fontFamily: fonts.bodyBold },
  cardAuthor: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontFamily: fonts.body },
  cardTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: fonts.heading, marginBottom: 8 },
  cardPreview: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  readMore: { color: colors.gold, fontSize: 13, fontFamily: fonts.bodyBold, marginTop: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.propheticBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '88%', borderTopWidth: 3, borderColor: colors.gold },
  requestModalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '90%', borderTopWidth: 3, borderColor: colors.gold },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.propheticBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { marginBottom: 8 },
  closeText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body, marginBottom: 8 },
  modalIcon: { marginBottom: 8 },
  modalEyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: fonts.bodyBold, marginBottom: 8 },
  modalTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 6 },
  modalMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontFamily: fonts.body },
  divider: { height: 1.5, backgroundColor: colors.propheticBorder, marginVertical: 20 },
  modalBody: { color: colors.textPrimary, fontSize: 16, lineHeight: 30, fontFamily: fonts.headingRegular },
  requestSub: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: fonts.body, marginBottom: 20 },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, marginBottom: 14, borderWidth: 1.5, borderColor: colors.border, fontFamily: fonts.body },
  textArea: { height: 140 },
  submitBtn: { backgroundColor: colors.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
});
