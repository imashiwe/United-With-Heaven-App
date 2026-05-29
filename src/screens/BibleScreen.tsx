import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadow } from '../theme';
import { bibleVerses } from '../data/content';

const categoryMeta: Record<string, { bg: string[]; text: string; border: string; emoji: string }> = {
  Hope:     { bg: ['#FFFBF0', '#FFF3D8'], text: '#9A7028', border: '#E8C878', emoji: '🌅' },
  Strength: { bg: ['#FFF2E8', '#FFE4CC'], text: '#A04A20', border: '#DDA070', emoji: '💪' },
  Faith:    { bg: ['#F8F4E8', '#F0E8CC'], text: '#7A6228', border: '#C8A858', emoji: '✝️' },
  Peace:    { bg: ['#FFF6F0', '#FFE8DC'], text: '#8A4A38', border: '#D4A090', emoji: '🕊️' },
  Love:     { bg: ['#FFF0EC', '#FFE2D6'], text: '#A04038', border: '#D89888', emoji: '❤️' },
  Trust:    { bg: ['#FFFBEE', '#FFF3D0'], text: '#8A6220', border: '#D4B060', emoji: '🤲' },
  Rest:     { bg: ['#FFFAEC', '#FFF0D0'], text: '#8A5818', border: '#D8B058', emoji: '🌙' },
};

export default function BibleScreen() {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Hope', 'Strength', 'Faith', 'Peace', 'Love', 'Trust', 'Rest'];
  const today = new Date();
  const verseOfDay = bibleVerses[today.getDate() % bibleVerses.length];
  const filtered = filter === 'All' ? bibleVerses : bibleVerses.filter((v) => v.category === filter);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7A3A10', '#B8722A', '#D4934A']} style={styles.header}>
        <Text style={styles.eyebrow}>✦  The Living Word  ✦</Text>
        <Text style={styles.heading}>Bible Verses</Text>
        <Text style={styles.sub}>For every season of the soul</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Today's verse */}
        <View style={[styles.todayCard, shadow.large]}>
          <LinearGradient colors={['#FFF8EE', '#F5ECD8', '#EDD8B8']} style={styles.todayGradient}>
            <Text style={styles.todayEyebrow}>✦  Today's Verse  ✦</Text>
            <Text style={styles.todayVerse}>"{verseOfDay.verse}"</Text>
            <View style={styles.todayDivider} />
            <Text style={styles.todayRef}>— {verseOfDay.reference}</Text>
          </LinearGradient>
        </View>

        {/* Category pills */}
        <Text style={styles.sectionLabel}>Browse by Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterBtn, filter === cat && styles.filterActive]}
              onPress={() => setFilter(cat)}
            >
              {cat !== 'All' && <Text style={styles.filterEmoji}>{categoryMeta[cat]?.emoji}</Text>}
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Verse cards */}
        {filtered.map((verse) => {
          const meta = categoryMeta[verse.category] || { bg: ['#FFF8EE', '#F5ECD8'], text: colors.primary, border: colors.border, emoji: '📖' };
          return (
            <View key={verse.id} style={[styles.verseCard, shadow.small]}>
              <LinearGradient colors={meta.bg as [string,string]} style={styles.verseCardInner}>
                <View style={styles.verseCardHeader}>
                  <Text style={styles.verseEmoji}>{meta.emoji}</Text>
                  <View style={[styles.categoryPill, { borderColor: meta.border }]}>
                    <Text style={[styles.categoryPillText, { color: meta.text }]}>{verse.category}</Text>
                  </View>
                </View>
                <Text style={[styles.verseText, { color: colors.textPrimary }]}>"{verse.verse}"</Text>
                <Text style={[styles.verseRef, { color: meta.text }]}>— {verse.reference}</Text>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
  eyebrow: { color: colors.goldLight, fontSize: 11, letterSpacing: 2.5, fontFamily: fonts.bodySemiBold, marginBottom: 8 },
  heading: { color: colors.white, fontSize: 36, fontFamily: fonts.heading },
  sub: { color: '#F5D5A8', fontSize: 14, marginTop: 6, fontFamily: fonts.body },
  scroll: { padding: 20, paddingBottom: 40 },
  todayCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 28, borderWidth: 1, borderColor: colors.borderLight },
  todayGradient: { padding: 28, alignItems: 'center' },
  todayEyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 2, fontFamily: fonts.bodyBold, marginBottom: 18 },
  todayVerse: { color: colors.textSecondary, fontSize: 18, lineHeight: 30, fontFamily: fonts.headingRegular, textAlign: 'center', fontStyle: 'italic' },
  todayDivider: { width: 40, height: 1.5, backgroundColor: colors.borderLight, marginVertical: 16 },
  todayRef: { color: colors.primaryLight, fontSize: 14, fontFamily: fonts.bodyBold },
  sectionLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: fonts.bodyBold, marginBottom: 12 },
  filterScroll: { marginBottom: 22 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterEmoji: { fontSize: 13 },
  filterText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bodyBold },
  filterTextActive: { color: colors.white },
  verseCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight },
  verseCardInner: { padding: 22 },
  verseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  verseEmoji: { fontSize: 22 },
  categoryPill: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  categoryPillText: { fontSize: 11, fontFamily: fonts.bodyBold },
  verseText: { fontSize: 16, lineHeight: 26, fontFamily: fonts.headingRegular, fontStyle: 'italic' },
  verseRef: { fontSize: 13, fontFamily: fonts.bodyBold, marginTop: 14, textAlign: 'right' },
});
