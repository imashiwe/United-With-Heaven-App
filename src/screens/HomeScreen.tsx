import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { inspirationalMessages, bibleVerses } from '../data/content';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';
import DailyCheckin from '../components/DailyCheckin';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';

const { width, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigation = useNavigation<any>();

  const today = new Date();
  const verseOfDay = bibleVerses[today.getDate() % bibleVerses.length];
  const latestMessage = inspirationalMessages[0];

  return (
    <View style={styles.container}>
      {/* Floating header bar with notification bell + profile */}
      <View style={styles.floatingBar}>
        <NotificationBell />
        <TouchableOpacity onPress={() => setProfileOpen(true)} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Section ── */}
        <PhotoHeader
          source={images.unifiedChurch}
          eyebrow=""
          heading={"United\nWith Heaven"}
          sub="Where earth meets eternity"
          quote="You make known to me the path of life; in your presence there is fullness of joy."
          quoteRef="Psalm 16:11"
          height={screenHeight * 0.64}
          headingSize={38}
          onPhotoPress={() => setHeroVisible(true)}
        />

        {/* ── Daily Check-In ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Daily Devotion</Text>
          <DailyCheckin />
        </View>

        {/* ── Verse of the Day ── */}
        <View style={styles.section}>
          <View style={[styles.verseCard, shadow.large]}>
            <LinearGradient colors={['#FFFBF5', '#FFF3E8']} style={styles.verseGradient}>
              <Text style={styles.eyebrow}>✦  Verse of the Day  ✦</Text>
              <Text style={styles.verseText}>"{verseOfDay.verse}"</Text>
              <View style={styles.verseDivider} />
              <Text style={styles.verseRef}>— {verseOfDay.reference}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Latest Message ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Latest Message</Text>
          <View style={[styles.messageCard, shadow.medium]}>
            <View style={styles.messageAccent} />
            <View style={styles.messageBody}>
              <Text style={styles.messageTitle}>{latestMessage.title}</Text>
              <Text style={styles.messagePreview} numberOfLines={3}>{latestMessage.message}</Text>
              <View style={styles.messageFooter}>
                <Text style={styles.messageAuthor}>— {latestMessage.author}</Text>
                <View style={styles.readMoreBtn}>
                  <Text style={styles.readMoreText}>Read →</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Feature Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Explore</Text>
          <View style={styles.featuredRow}>
            <FeatureTile icon="flash" label="Prophetic Flows" color={['#FFF3D0', '#FFE8A0']} accent="#8B6820" onPress={() => navigation.navigate('Prophetic')} />
            <FeatureTile icon="musical-notes" label="Songs" color={['#FFF0E0', '#FFE0C0']} accent="#AA4A20" onPress={() => navigation.navigate('Songs')} />
          </View>
          <View style={styles.featuredRow}>
            <FeatureTile icon="hand-left" label="Prayer Requests" color={['#FFF4EC', '#FFE8D4']} accent="#9A6030" onPress={() => navigation.navigate('Prayer')} />
            <FeatureTile icon="flame" label="Testimonies" color={['#FFF0E8', '#FFE0D0']} accent="#AA3A20" onPress={() => navigation.navigate('Testimonies')} />
          </View>
          <View style={styles.featuredRow}>
            <FeatureTile icon="people" label="Community" color={['#F0F4FF', '#E0E8FF']} accent="#4A5AAA" onPress={() => navigation.navigate('Community')} />
            <FeatureTile icon="radio" label="Prayer Room" color={['#F0FFF4', '#D0FFE0']} accent="#2A8A5A" onPress={() => navigation.navigate('Community')} />
          </View>
        </View>

        {/* ── Quick Links Row ── */}
        <View style={styles.section}>
          <View style={styles.quickRow}>
            {[
              { icon: 'book' as const, label: 'Bible', tab: 'Bible' },
              { icon: 'chatbubbles' as const, label: 'Messages', tab: 'Messages' },
              { icon: 'document-text' as const, label: 'Diary', tab: 'Diary' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={[styles.quickTile, shadow.small]} onPress={() => navigation.navigate(item.tab)}>
                <Ionicons name={item.icon} size={26} color={colors.primary} />
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── About Imashi ── */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.aboutCard, shadow.medium]} onPress={() => setAboutVisible(true)} activeOpacity={0.95}>
            <Image source={images.smiles} style={styles.aboutImage} resizeMode="contain" />
            <LinearGradient colors={['transparent', 'rgba(44,24,16,0.85)']} style={styles.aboutOverlay} />
            <View style={styles.aboutContent}>
              <Text style={styles.aboutName}>Imashi Wetakepotha</Text>
              <Text style={styles.aboutTitle}>Founder · United With Heaven</Text>
            </View>
            <View style={styles.expandHintAbout}>
              <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Footer Quote ── */}
        <View style={styles.footerQuote}>
          <Text style={styles.footerLine} />
          <Text style={styles.footerText}>His mercies are new every morning</Text>
          <Text style={styles.footerRef}>Lamentations 3:23</Text>
          <Text style={styles.footerLine} />
        </View>

      </ScrollView>

      <FullscreenPhoto source={images.unifiedChurch} visible={heroVisible} onClose={() => setHeroVisible(false)} />
      <FullscreenPhoto source={images.smiles} visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </View>
  );
}

function FeatureTile({ icon, label, color, accent, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string[];
  accent: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.featureTileWrap} onPress={onPress} activeOpacity={0.82}>
      <LinearGradient colors={color as [string, string]} style={[styles.featureTile, shadow.small]}>
        <Ionicons name={icon} size={28} color={accent} style={styles.featureIcon} />
        <Text style={[styles.featureLabel, { color: accent }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },

  floatingBar: {
    position: 'absolute', top: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingTop: 14, paddingRight: 16,
  },
  profileBtn: { padding: 6 },

  // Sections
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: fonts.bodyBold, marginBottom: 14 },

  // Verse card
  verseCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
  verseGradient: { padding: 28, alignItems: 'center' },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2, fontFamily: fonts.bodyBold, marginBottom: 18 },
  verseText: { color: colors.textSecondary, fontSize: 18, lineHeight: 30, fontFamily: fonts.headingRegular, textAlign: 'center', fontStyle: 'italic' },
  verseDivider: { width: 40, height: 1.5, backgroundColor: colors.borderLight, marginVertical: 16 },
  verseRef: { color: colors.primaryLight, fontSize: 14, fontFamily: fonts.bodyBold },

  // Message card
  messageCard: { backgroundColor: colors.white, borderRadius: 18, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
  messageAccent: { width: 5, backgroundColor: colors.primary },
  messageBody: { flex: 1, padding: 20 },
  messageTitle: { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading, marginBottom: 8 },
  messagePreview: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: fonts.body },
  messageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  messageAuthor: { color: colors.primary, fontSize: 12, fontFamily: fonts.bodySemiBold, fontStyle: 'italic' },
  readMoreBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  readMoreText: { color: colors.white, fontSize: 12, fontFamily: fonts.bodyBold },

  // Feature tiles
  featuredRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  featureTileWrap: { flex: 1 },
  featureTile: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  featureIcon: { marginBottom: 10 },
  featureLabel: { fontSize: 14, fontFamily: fonts.bodyBold },

  // Quick links
  quickRow: { flexDirection: 'row', gap: 12 },
  quickTile: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  quickLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.bodyBold, marginTop: 8 },

  // About card
  aboutCard: { borderRadius: 20, overflow: 'hidden', height: 360, borderWidth: 1, borderColor: colors.border, backgroundColor: '#000000' },
  aboutImage: { width: '100%', height: '100%', position: 'absolute' },
  aboutOverlay: { position: 'absolute', width: '100%', height: '100%' },
  aboutContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  aboutName: { color: colors.white, fontSize: 20, fontFamily: fonts.heading },
  aboutTitle: { color: '#F5D5A8', fontSize: 13, fontFamily: fonts.bodySemiBold, marginTop: 3 },
  expandHintAbout: {
    position: 'absolute', top: 14, right: 14,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },

  // Footer
  footerQuote: { alignItems: 'center', marginTop: 36, marginBottom: 10, paddingHorizontal: 20 },
  footerLine: { width: 60, height: 1, backgroundColor: colors.border, marginVertical: 10 },
  footerText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.headingRegular, fontStyle: 'italic' },
  footerRef: { color: colors.textLight, fontSize: 12, fontFamily: fonts.body, marginTop: 4 },
});
