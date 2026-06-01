import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadow } from '../theme';
import { getProfile, saveProfile, getSessionId, UserProfile } from '../utils/session';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import AuthModal from './AuthModal';

const AVATARS = ['🙏', '✨', '🕊️', '🔥', '👑', '💛', '🌿', '⚡', '🌸', '🦁', '🌊', '🎵'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export default function ProfileModal({ visible, onClose, onOpenAdmin }: Props) {
  const { user, isAdmin, refreshAdmin } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🙏');
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

    const upsertData: Record<string, unknown> = {
      session_id: sessionId,
      display_name: name,
      avatar_emoji: avatarEmoji,
    };
    if (user) {
      upsertData.user_id = user.id;
      upsertData.email = user.email;
    }

    await supabase.from('profiles').upsert(upsertData, { onConflict: 'session_id' });
    setSaving(false);
    onClose();
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          setSigningOut(true);
          await supabase.auth.signOut();
          setSigningOut(false);
        }
      }
    ]);
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Account status bar */}
            {user ? (
              <View style={styles.accountBar}>
                <View style={styles.accountInfo}>
                  <View style={styles.accountDot} />
                  <View>
                    <Text style={styles.accountEmail}>{user.email}</Text>
                    {isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>👑 Admin</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={handleSignOut} disabled={signingOut} style={styles.signOutBtn}>
                  {signingOut
                    ? <ActivityIndicator size="small" color={colors.textMuted} />
                    : <Text style={styles.signOutText}>Sign Out</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.saveAccountBanner} onPress={() => setAuthOpen(true)}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.saveAccountTitle}>Save your profile across devices</Text>
                  <Text style={styles.saveAccountSub}>Add an email to keep your streak and identity</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}

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

            {/* Admin panel access */}
            {isAdmin && onOpenAdmin && (
              <TouchableOpacity style={styles.adminBtn} onPress={() => { onClose(); setTimeout(() => onOpenAdmin(), 300); }}>
                <Text style={styles.adminBtnIcon}>👑</Text>
                <Text style={styles.adminBtnText}>Open Admin Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color="#8B6820" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AuthModal
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => { refreshAdmin(); setAuthOpen(false); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 3, borderColor: colors.primary,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // Account bar
  accountBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FFF8', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#A8E8C8',
  },
  accountInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  accountDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2A8A5A' },
  accountEmail: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.bodySemiBold },
  adminBadge: { backgroundColor: '#FFF8E0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  adminBadgeText: { color: '#8B6820', fontSize: 11, fontFamily: fonts.bodyBold },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFE8E8' },
  signOutText: { color: '#AA3030', fontSize: 12, fontFamily: fonts.bodyBold },

  // Save account banner
  saveAccountBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF3E8', borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  saveAccountTitle: { color: colors.primary, fontSize: 13, fontFamily: fonts.bodyBold },
  saveAccountSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },

  title: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading, marginBottom: 4 },
  sub: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, lineHeight: 18, marginBottom: 18 },
  label: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body,
    marginBottom: 18, borderWidth: 1.5, borderColor: colors.border,
  },
  avatarRow: { gap: 10, paddingBottom: 4, marginBottom: 18 },
  avatarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.borderLight,
  },
  avatarBtnActive: { borderColor: colors.primary, backgroundColor: '#FFF3E8' },
  avatarEmoji: { fontSize: 23 },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  previewAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  previewEmoji: { fontSize: 24 },
  previewName: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bodyBold },
  previewSub: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF8E0', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#E8C878', marginBottom: 12,
  },
  adminBtnIcon: { fontSize: 18 },
  adminBtnText: { flex: 1, color: '#8B6820', fontSize: 14, fontFamily: fonts.bodyBold },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
});
