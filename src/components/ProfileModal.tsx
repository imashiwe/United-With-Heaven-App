import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { colors, fonts, shadow } from '../theme';
import { getProfile, saveProfile, getSessionId, UserProfile } from '../utils/session';
import { supabase } from '../lib/supabase';

const AVATARS = ['🙏', '✨', '🕊️', '🔥', '👑', '💛', '🌿', '⚡', '🌸', '🦁', '🌊', '🎵'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileModal({ visible, onClose }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🙏');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      getProfile().then((p) => {
        setDisplayName(p.displayName);
        setAvatarEmoji(p.avatarEmoji);
      });
    }
  }, [visible]);

  async function handleSave() {
    const name = displayName.trim() || 'Friend';
    const profile: UserProfile = { displayName: name, avatarEmoji };
    setSaving(true);
    await saveProfile(profile);
    const sessionId = await getSessionId();
    await supabase.from('profiles').upsert(
      { session_id: sessionId, display_name: name, avatar_emoji: avatarEmoji },
      { onConflict: 'session_id' }
    );
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.sub}>This name appears on your prayer requests, testimonies, and posts.</Text>

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name or nickname"
            placeholderTextColor={colors.textLight}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={32}
          />

          <Text style={styles.label}>Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
            {AVATARS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => setAvatarEmoji(emoji)}
                style={[styles.avatarBtn, avatarEmoji === emoji && styles.avatarBtnActive]}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Preview */}
          <View style={styles.preview}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewEmoji}>{avatarEmoji}</Text>
            </View>
            <View>
              <Text style={styles.previewName}>{displayName.trim() || 'Friend'}</Text>
              <Text style={styles.previewSub}>Community member</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.saveBtnText}>Save Profile</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
    borderTopWidth: 3, borderColor: colors.primary,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 6 },
  sub: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, lineHeight: 20, marginBottom: 20 },
  label: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body,
    marginBottom: 20, borderWidth: 1.5, borderColor: colors.border,
  },
  avatarRow: { gap: 10, paddingBottom: 4, marginBottom: 20 },
  avatarBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.borderLight,
  },
  avatarBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF3E8' },
  avatarEmoji: { fontSize: 24 },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight,
  },
  previewAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  previewEmoji: { fontSize: 26 },
  previewName: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bodyBold },
  previewSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
});
