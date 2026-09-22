// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase conectado correctamente');
