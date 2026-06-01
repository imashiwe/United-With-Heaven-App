import { useEffect, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  if (Platform.OS !== 'web') return null;
  return <PwaInstallPromptWeb />;
}

function PwaInstallPromptWeb() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(ua as string).includes('CriOS');
    const standalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    setIsIos(iosDevice);
    setIsStandalone(standalone);

    if (sessionStorage.getItem('pwa-dismissed')) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  function handleDismiss() {
    sessionStorage.setItem('pwa-dismissed', '1');
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') handleDismiss();
    else setDeferredPrompt(null);
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.card}>
        <Image source={require('../../assets/icon.png')} style={styles.icon} />
        <View style={styles.textGroup}>
          <Text style={styles.title}>United With Heaven</Text>
          {isIos ? (
            <Text style={styles.subtitle}>
              Tap the Share button below, then &quot;Add to Home Screen&quot; to install
            </Text>
          ) : (
            <Text style={styles.subtitle}>Add to your home screen for the best experience</Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Not now</Text>
          </TouchableOpacity>
          {!isIos && (
            <TouchableOpacity onPress={handleInstall} style={styles.installBtn}>
              <Text style={styles.installText}>Install</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D5A3',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: '#B8722A',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: '#4A3728',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  dismissBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: '#8A7060',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  installBtn: {
    backgroundColor: '#B8722A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  installText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: '#FAF6F0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
