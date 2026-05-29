import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

const { width } = Dimensions.get('window');

interface Props {
  source: any;
  eyebrow: string;
  heading: string;
  sub: string;
  quote: string;
  quoteRef: string;
  height: number;
  onPhotoPress: () => void;
  headingSize?: number;
  children?: React.ReactNode;
}

export default function PhotoHeader({
  source, eyebrow, heading, sub, quote, quoteRef, height, onPhotoPress, headingSize, children,
}: Props) {
  return (
    <View style={[styles.container, { height }]}>

      {/* Photo — left side, fully shown */}
      <Image source={source} style={styles.photo} resizeMode="contain" />

      {/* Gradient blend at photo–text boundary */}
      <LinearGradient
        colors={['transparent', '#0D0604']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradBlend}
      />

      {/* Bottom gradient — protects title text on right */}
      <LinearGradient
        colors={['transparent', 'rgba(13,6,4,0.7)', '#0D0604']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradBottom}
      />

      {/* Bible quote — upper-right */}
      <View style={styles.quoteWrap}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={styles.quoteText}>{quote}</Text>
        <View style={styles.quoteDivider} />
        <Text style={styles.quoteRef}>{quoteRef}</Text>
      </View>

      {/* Screen title — bottom-right */}
      <View style={styles.titleWrap}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={[styles.heading, headingSize ? { fontSize: headingSize, lineHeight: headingSize * 1.12 } : null]}>{heading}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>

      {/* Optional overlay content */}
      {children}

      {/* Expand photo button */}
      <TouchableOpacity style={styles.expandBtn} onPress={onPhotoPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={styles.expandInner}>
          <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0604',
    overflow: 'hidden',
  },

  /* Photo occupies the full left half, fully contained */
  photo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: '100%',
  },

  /* Fade from transparent (photo side) to dark (text side) */
  gradBlend: {
    position: 'absolute',
    left: '38%',
    top: 0,
    width: '20%',
    height: '100%',
  },

  /* Darkens the bottom of the right text column */
  gradBottom: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '54%',
    height: '42%',
  },

  /* Quote — upper-right */
  quoteWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 48,
    left: '52%',
    right: 18,
  },
  quoteMark: {
    color: colors.goldLight,
    fontSize: 62,
    lineHeight: 54,
    fontFamily: fonts.heading,
    opacity: 0.5,
  },
  quoteText: {
    color: '#F0E8D8',
    fontSize: 14,
    lineHeight: 23,
    fontFamily: fonts.headingRegular,
    fontStyle: 'italic',
    marginTop: -8,
  },
  quoteDivider: {
    width: 26,
    height: 1.5,
    backgroundColor: colors.gold,
    marginVertical: 11,
    opacity: 0.6,
  },
  quoteRef: {
    color: colors.goldLight,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },

  /* Title — bottom-right */
  titleWrap: {
    position: 'absolute',
    bottom: 22,
    left: '52%',
    right: 18,
  },
  eyebrow: {
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2.5,
    fontFamily: fonts.bodySemiBold,
    marginBottom: 5,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: fonts.heading,
    lineHeight: 32,
  },
  sub: {
    color: '#F5D5A8',
    fontSize: 12,
    marginTop: 3,
    fontFamily: fonts.body,
  },

  /* Expand button — top-right */
  expandBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  expandInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
