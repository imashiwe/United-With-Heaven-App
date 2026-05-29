import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eerhvwpauumffdzmpaox.supabase.co';
const SUPABASE_KEY = 'sb_publishable__SNcg2NRZk0l1An-55Xt6w_xICpoROW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
