// js/export.js
import { supabase } from './supabase.js';
import { t } from './i18n.js';

// ==========================================
// EXPORTAR TODOS LOS DATOS A JSON
// ==========================================
export async function exportarDatos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Perfil del usuario
  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Grupos donde es miembro
  const { data: membresias } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  const groupIds = (membresias || []).map(m => m.group_id);

  // 3. Grupos completos
  let grupos = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);
    grupos = data || [];
  }

  // 4. Miembros de esos grupos (con perfil publico)
  let miembros = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, user_id, joined_at, profile:profiles!group_members_user_id_fkey(id, email, full_name)')
      .in('group_id', groupIds);
    miembros = data || [];
  }

  // 5. Gastos de esos grupos
  let gastos = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .in('group_id', groupIds);
    gastos = data || [];
  }

  // 6. Divisiones (splits) de esos gastos
  const expenseIds = gastos.map(g => g.id);
  let splits = [];
  if (expenseIds.length > 0) {
    const { data } = await supabase
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);
    splits = data || [];
  }

  // 7. Pagos/saldos de esos grupos
  let settlements = [];
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('settlements')
      .select('*')
      .in('group_id', groupIds);
    settlements = data || [];
  }

  // 8. Amistades (pendientes y aceptadas)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  // 9. Comentarios en el libro de visitas (solo los propios)
  const { data: guestbook } = await supabase
    .from('guestbook')
    .select('*')
    .eq('user_id', user.id);

  // ==========================================
  // Armar el JSON anidado por grupo
  // ==========================================
  const gruposConDatos = grupos.map(g => ({
    group: g,
    members: miembros.filter(m => m.group_id === g.id),
    expenses: gastos
      .filter(e => e.group_id === g.id)
      .map(e => ({
        expense: e,
        splits: splits.filter(s => s.expense_id === e.id)
      })),
    settlements: settlements.filter(s => s.group_id === g.id)
  }));

  const exportData = {
    app: 'PYM Split',
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    user: perfil,
    groups: gruposConDatos,
    friendships: friendships || [],
    guestbook: guestbook || []
  };

  // ==========================================
  // Descargar el archivo JSON
  // ==========================================
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pym-split-backup-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    groups: gruposConDatos.length,
    expenses: gastos.length,
    size: json.length
  };
}
