import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://eerhvwpauumffdzmpaox.supabase.co';
const SUPABASE_KEY = 'sb_publishable__SNcg2NRZk0l1An-55Xt6w_xICpoROW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
