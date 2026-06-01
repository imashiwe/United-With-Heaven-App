import React, { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { supabase } from '../lib/supabase';
import { getSessionId, getProfile } from '../utils/session';

interface Comment {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
  session_id: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  parentType: 'testimony' | 'message' | 'group_post';
  parentId: string;
  parentTitle: string;
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommentsModal({ visible, onClose, parentType, parentId, parentTitle }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      getSessionId().then(setSessionId);
      getProfile().then((p) => setDisplayName(p.displayName || 'Anonymous'));
      fetchComments();
    }
  }, [visible, parentId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_type', parentType)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });
    if (data) setComments(data as Comment[]);
    setLoading(false);
  }

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('comments').insert({
      session_id: sessionId,
      display_name: displayName || 'Anonymous',
      parent_type: parentType,
      parent_id: parentId,
      content: text.trim(),
    }).select().single();
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setText('');
    }
    setSending(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerLabel}>Comments</Text>
              <Text style={styles.headerSub} numberOfLines={1}>{parentTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {loading
            ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
            : (
              <FlatList
                data={comments}
                keyExtractor={(c) => c.id}
                style={styles.list}
                contentContainerStyle={comments.length === 0 ? styles.emptyContainer : { paddingBottom: 8 }}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="chatbubble-outline" size={40} color={colors.primaryLight} />
                    <Text style={styles.emptyText}>Be the first to comment</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.comment, item.session_id === sessionId && styles.myComment]}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{(item.display_name || 'A')[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentName}>{item.display_name}</Text>
                        <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                      <Text style={styles.commentText}>{item.content}</Text>
                    </View>
                  </View>
                )}
              />
            )}

          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              style={styles.composerInput}
              placeholder="Write a comment…"
              placeholderTextColor={colors.textLight}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity onPress={send} disabled={!text.trim() || sending} style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}>
              {sending
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Ionicons name="send" size={16} color={colors.white} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 14, maxHeight: '80%',
    borderTopWidth: 3, borderColor: colors.primary,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderColor: colors.borderLight },
  headerLabel: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bodyBold },
  headerSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  closeBtn: { padding: 6 },
  list: { maxHeight: 360 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  empty: { alignItems: 'center', gap: 10 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 14 },
  comment: {
    flexDirection: 'row', gap: 10, padding: 14,
    borderBottomWidth: 1, borderColor: colors.borderLight,
  },
  myComment: { backgroundColor: '#FFFBF0' },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  commentAvatarText: { color: colors.white, fontSize: 14, fontFamily: fonts.bodyBold },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentName: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bodyBold },
  commentTime: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.body },
  commentText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  composerInput: {
    flex: 1, backgroundColor: colors.parchment,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body,
    borderWidth: 1.5, borderColor: colors.border, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.borderLight },
});
