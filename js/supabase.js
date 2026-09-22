// js/supabase.js
window.addEventListener('load', () => {
  if (typeof supabase === 'undefined') {
    console.error('Error: La libreria de Supabase no se cargo.');
    return;
  }
  window.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase conectado correctamente');
  window.dispatchEvent(new Event('supabase-ready'));
});
