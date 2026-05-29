import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadow } from '../theme';
import { images } from '../images';
import { songs } from '../data/content';
import { tracks, albums, Track } from '../data/music';
import FullscreenPhoto from '../components/FullscreenPhoto';
import PhotoHeader from '../components/PhotoHeader';

const { height: screenHeight } = Dimensions.get('window');

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongsScreen() {
  const [tab, setTab] = useState<'music' | 'lyrics'>('music');

  // Lyrics state
  const [selected, setSelected] = useState<typeof songs[0] | null>(null);
  const [filter, setFilter] = useState('All');
  const [photoVisible, setPhotoVisible] = useState(false);

  // Music player state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function playTrack(track: Track) {
    setLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        track.file,
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis ?? 0);
            setDuration(status.durationMillis ?? 0);
            setPlaying(status.isPlaying);
            if (status.didJustFinish) advanceTrack(track);
          }
        }
      );
      soundRef.current = sound;
      setCurrentTrack(track);
      setPlaying(true);
    } catch (e) {
      console.warn('Audio error', e);
    }
    setLoading(false);
  }

  function advanceTrack(track: Track) {
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx >= 0 && idx < tracks.length - 1) playTrack(tracks[idx + 1]);
  }

  async function togglePlayPause() {
    if (!soundRef.current) return;
    if (playing) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }

  async function playNext() {
    if (!currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    if (idx < tracks.length - 1) playTrack(tracks[idx + 1]);
  }

  async function playPrev() {
    if (!currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) playTrack(tracks[idx - 1]);
  }

  const categories = ['All', 'Worship', 'Gospel'];
  const filtered = filter === 'All' ? songs : songs.filter((s) => s.category === filter);

  return (
    <View style={styles.container}>
      <PhotoHeader
        source={images.unifiedChurch}
        eyebrow="✦  Lift Your Voice  ✦"
        heading="Songs"
        sub="Worship & Gospel"
        quote="Sing joyfully to the Lord, you righteous; it is fitting for the upright to praise him."
        quoteRef="Psalm 33:1"
        height={screenHeight * 0.52}
        onPhotoPress={() => setPhotoVisible(true)}
      />

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'music' && styles.tabBtnActive]}
          onPress={() => setTab('music')}
        >
          <Ionicons name="musical-notes" size={14} color={tab === 'music' ? colors.white : colors.textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.tabBtnText, tab === 'music' && styles.tabBtnTextActive]}>My Music</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'lyrics' && styles.tabBtnActive]}
          onPress={() => setTab('lyrics')}
        >
          <Ionicons name="document-text" size={14} color={tab === 'lyrics' ? colors.white : colors.textSecondary} style={{ marginRight: 5 }} />
          <Text style={[styles.tabBtnText, tab === 'lyrics' && styles.tabBtnTextActive]}>Lyrics</Text>
        </TouchableOpacity>
      </View>

      {tab === 'music' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.albumIntro}>Glory is Here  ·  Imashi Wetakepotha</Text>

          {albums.map((album) => {
            const albumTracks = tracks.filter((t) => t.album === album.id);
            return (
              <View key={album.id} style={[styles.albumSection, shadow.small]}>
                <LinearGradient colors={[album.bg, '#FFFFFF']} style={styles.albumHeader}>
                  <View style={[styles.albumDot, { backgroundColor: album.accent }]} />
                  <Text style={[styles.albumName, { color: album.accent }]}>{album.name}</Text>
                  <Text style={styles.albumCount}>{albumTracks.length} tracks</Text>
                </LinearGradient>
                {albumTracks.map((track, i) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <TouchableOpacity
                      key={track.id}
                      style={[styles.trackRow, isActive && { backgroundColor: album.bg }, i < albumTracks.length - 1 && styles.trackBorder]}
                      onPress={() => isActive ? togglePlayPause() : playTrack(track)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.trackNum, isActive && { backgroundColor: album.accent }]}>
                        {loading && isActive
                          ? <ActivityIndicator size="small" color={colors.white} />
                          : isActive && playing
                          ? <Ionicons name="pause" size={14} color={colors.white} />
                          : isActive
                          ? <Ionicons name="play" size={14} color={colors.white} />
                          : <Text style={styles.trackNumText}>{i + 1}</Text>
                        }
                      </View>
                      <Text style={[styles.trackTitle, isActive && { color: album.accent, fontFamily: fonts.bodyBold }]}>
                        {track.title}
                      </Text>
                      {isActive && (
                        <Text style={[styles.nowPlayingLabel, { color: album.accent, marginRight: 8 }]}>
                          {playing ? '▶' : '⏸'}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={styles.lyricsBtn}
                        onPress={() => setLyricsTrack(track)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="document-text-outline" size={16} color={isActive ? album.accent : colors.textLight} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          <View style={{ height: currentTrack ? 110 : 20 }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.filterBtn, filter === cat && styles.filterActive]} onPress={() => setFilter(cat)}>
                <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filtered.map((song) => (
            <TouchableOpacity key={song.id} style={[styles.songCard, shadow.small]} onPress={() => setSelected(song)}>
              <View style={[styles.songCardInner, { backgroundColor: song.category === 'Gospel' ? '#FFF0E0' : '#FFF8EE' }]}>
                <View style={styles.songNumber}>
                  <Ionicons name="musical-note" size={16} color={colors.primary} />
                </View>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
                <View style={[styles.badge, song.category === 'Gospel' ? styles.badgeGospel : styles.badgeWorship]}>
                  <Text style={[styles.badgeText, song.category === 'Gospel' ? styles.gospelText : styles.worshipText]}>
                    {song.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating Now Playing bar */}
      {currentTrack && (
        <View style={[styles.nowPlayingBar, shadow.large]}>
          <View style={styles.nowPlayingInfo}>
            <View style={styles.nowPlayingIcon}>
              <Ionicons name="musical-note" size={16} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressTime}>{formatTime(position)}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }]} />
                </View>
                <Text style={styles.progressTime}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.playerControls}>
            <TouchableOpacity onPress={playPrev} style={styles.controlBtn}>
              <Ionicons name="play-skip-back" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
              {loading
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.white} />
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={playNext} style={styles.controlBtn}>
              <Ionicons name="play-skip-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lyrics modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Ionicons name="musical-notes" size={36} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.modalArtist}>{selected.artist}</Text>
                <View style={styles.divider} />
                <Text style={styles.lyrics}>{selected.lyrics}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* My Music lyrics modal */}
      <Modal visible={!!lyricsTrack} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setLyricsTrack(null)}>
              <Text style={styles.closeText}>✕  Close</Text>
            </TouchableOpacity>
            {lyricsTrack && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Ionicons name="musical-notes" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.modalTitle}>{lyricsTrack.title}</Text>
                <Text style={styles.modalArtist}>Imashi Wetakepotha</Text>
                <View style={styles.divider} />
                <Text style={styles.lyrics}>
                  {lyricsTrack.lyrics || 'Lyrics coming soon…'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FullscreenPhoto source={images.unifiedChurch} visible={photoVisible} onClose={() => setPhotoVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 18, paddingBottom: 40 },

  // Tab toggle
  tabRow: {
    flexDirection: 'row', margin: 16, marginBottom: 4,
    backgroundColor: colors.parchment, borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 11,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bodyBold },
  tabBtnTextActive: { color: colors.white },

  // Album intro
  albumIntro: {
    color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold,
    textAlign: 'center', letterSpacing: 1, marginBottom: 20, marginTop: 4,
    textTransform: 'uppercase',
  },

  // Album section
  albumSection: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  albumHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  albumDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  albumName: { flex: 1, fontSize: 14, fontFamily: fonts.bodyBold },
  albumCount: { color: colors.textLight, fontSize: 12, fontFamily: fonts.body },

  // Track rows
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: colors.white,
  },
  trackBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  trackNum: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.parchment, alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  trackNumText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold },
  trackTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontFamily: fonts.body },
  nowPlayingLabel: { fontSize: 11, fontFamily: fonts.bodyBold },
  lyricsBtn: { padding: 4 },

  // Now playing bar
  nowPlayingBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
  },
  nowPlayingInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nowPlayingIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  nowPlayingTitle: { color: colors.white, fontSize: 14, fontFamily: fonts.bodyBold, marginBottom: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTime: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: fonts.body, minWidth: 30 },
  progressBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: colors.goldLight, borderRadius: 2 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  controlBtn: { padding: 6 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Lyrics tab
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.bodyBold },
  filterTextActive: { color: colors.white },
  songCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
  songCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  songNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(184,114,42,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  songInfo: { flex: 1 },
  songTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bodyBold },
  songArtist: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeWorship: { backgroundColor: 'rgba(184,114,42,0.12)' },
  badgeGospel: { backgroundColor: 'rgba(42,138,42,0.12)' },
  badgeText: { fontSize: 11, fontFamily: fonts.bodyBold },
  worshipText: { color: colors.primary },
  gospelText: { color: '#2A6A2A' },

  // Lyrics modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.parchment, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '88%', borderTopWidth: 3, borderColor: colors.primary },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { marginBottom: 16 },
  closeText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.body },
  modalTitle: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.heading },
  modalArtist: { color: colors.primary, fontSize: 15, fontFamily: fonts.bodySemiBold, marginTop: 4 },
  divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 20 },
  lyrics: { color: colors.textSecondary, fontSize: 16, lineHeight: 30, fontFamily: fonts.body },
});
