import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qudchfihspxebimbynrj.supabase.co';
const supabaseKey = 'sb_publishable_gt4ZXjNcbTak-toy7CTu0Q_Qrf7BiFE';

export const supabase = createClient(supabaseUrl, supabaseKey);