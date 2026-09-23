// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// âš ï¸� IMPORTANTE: Reemplaza estos valores con los de TU proyecto de Supabase
// Los encontras en: Supabase -> Project Settings -> API Keys
const SUPABASE_URL = 'https://gwqyzubncmvfxxnnyqfs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9IFxrFf4qrqEwTOnArNLzg_PixbxgYt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase conectado correctamente a:', SUPABASE_URL);
