import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@uwh/session_id';
const PROFILE_KEY = '@uwh/profile';
const NOTIF_CHECK_KEY = '@uwh/last_notif_check';

function makeUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getSessionId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeUUID();
      await AsyncStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return makeUUID();
  }
}

export interface UserProfile {
  displayName: string;
  avatarEmoji: string;
}

export async function getProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { displayName: '', avatarEmoji: '🙏' };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export async function getLastNotifCheck(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_CHECK_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function markNotificationsRead(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_CHECK_KEY, Date.now().toString());
  } catch {}
}
