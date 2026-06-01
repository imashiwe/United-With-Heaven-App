import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { getSessionId, getProfile, saveProfile } from '../utils/session';

type Tab = 'signin' | 'signup';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ visible, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) { Alert.alert('Please enter your email and password'); return; }
    if (password !== confirmPassword) { Alert.alert('Passwords do not match'); return; }
    if (password.length < 6) { Alert.alert('Password must be at least 6 characters'); return; }

    setLoading(true);
    const sessionId = await getSessionId();
    const profile = await getProfile();
    const name = displayName.trim() || profile.displayName || 'Friend';

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { display_name: name } },
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Link existing anonymous session to this account
      await supabase.from('profiles').upsert(
        {
          session_id: sessionId,
          user_id: data.user.id,
          email: email.trim().toLowerCase(),
          display_name: name,
          avatar_emoji: profile.avatarEmoji || '🙏',
        },
        { onConflict: 'session_id' }
      );
      await saveProfile({ displayName: name, avatarEmoji: profile.avatarEmoji || '🙏' });
    }

    setLoading(false);

    if (data.session) {
      // Logged in immediately (email confirmation disabled)
      onSuccess();
      onClose();
    } else {
      // Email confirmation required
      Alert.alert(
        '✅ Almost there!',
        `A confirmation link has been sent to ${email}. Tap it to activate your account, then sign in.`,
        [{ text: 'OK', onPress: () => setTab('signin') }]
      );
    }
  }

  async function handleSignIn() {
    if (!email.trim() || !password) { Alert.alert('Please enter your email and password'); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Find existing profile for this user and restore to local
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_emoji, session_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (existingProfile) {
        await saveProfile({
          displayName: existingProfile.display_name,
          avatarEmoji: existingProfile.avatar_emoji,
        });
      }

      // Also link current session_id to this account (in case signing in on new device)
      const currentSessionId = await getSessionId();
      if (existingProfile?.session_id !== currentSessionId) {
        await supabase.from('profiles').upsert(
          {
            session_id: currentSessionId,
            user_id: data.user.id,
            email: email.trim().toLowerCase(),
            display_name: existingProfile?.display_name ?? 'Friend',
            avatar_emoji: existingProfile?.avatar_emoji ?? '🙏',
          },
          { onConflict: 'session_id' }
        );
      }
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  async function handleForgotPassword() {
    if (!email.trim()) { Alert.alert('Enter your email address first'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setResetSent(true);
  }

  function reset() {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setDisplayName(''); setResetSent(false); setShowPassword(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {tab === 'signup' ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.sub}>
                {tab === 'signup'
                  ? 'Save your profile and access it from any device'
                  : 'Sign in to restore your profile and streak'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]} onPress={() => { setTab('signup'); reset(); }}>
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, tab === 'signin' && styles.tabBtnActive]} onPress={() => { setTab('signin'); reset(); }}>
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {resetSent ? (
              <View style={styles.resetSent}>
                <Text style={styles.resetSentIcon}>📧</Text>
                <Text style={styles.resetSentTitle}>Check Your Inbox</Text>
                <Text style={styles.resetSentText}>A password reset link has been sent to {email}.</Text>
                <TouchableOpacity onPress={() => setResetSent(false)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {tab === 'signup' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Your name or nickname"
                    placeholderTextColor={colors.textLight}
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={32}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {tab === 'signup' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.textLight}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                )}

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={tab === 'signup' ? handleSignUp : handleSignIn}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color={colors.white} />
                    : <Text style={styles.primaryBtnText}>{tab === 'signup' ? 'Create Account' : 'Sign In'}</Text>}
                </TouchableOpacity>

                {tab === 'signin' && (
                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.legalText}>
                  Your data is private and used only within the United With Heaven community.
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 3, borderColor: colors.primary,
    maxHeight: '90%',
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  title: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading },
  sub: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, lineHeight: 18, marginTop: 4 },
  closeBtn: { padding: 4 },

  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.borderLight },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.bodyBold },
  tabTextActive: { color: colors.white },

  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body,
    marginBottom: 12, borderWidth: 1.5, borderColor: colors.border,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  eyeBtn: { padding: 14, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4, marginBottom: 12,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontFamily: fonts.bodyBold },

  forgotBtn: { alignItems: 'center', paddingVertical: 8 },
  forgotText: { color: colors.primary, fontSize: 14, fontFamily: fonts.bodySemiBold },

  legalText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.body, textAlign: 'center', lineHeight: 18, marginTop: 8 },

  resetSent: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  resetSentIcon: { fontSize: 48 },
  resetSentTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading },
  resetSentText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.body, textAlign: 'center', lineHeight: 22 },
  backBtn: { marginTop: 8 },
  backBtnText: { color: colors.primary, fontSize: 14, fontFamily: fonts.bodySemiBold },
});
