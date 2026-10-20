// js/export.js
import { supabase } from './supabase.js';
import { t } from './i18n.js';

// Supabase/PostgREST devuelve como maximo 1000 filas por pedido (por defecto) y
// los filtros .in() viajan en la URL, que tiene limite de largo.
// Sin paginar ni dividir en lotes, el backup salia INCOMPLETO sin avisar.
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 100;

// Fecha LOCAL (YYYY-MM-DD). toISOString() usa UTC y de noche devuelve el dia siguiente.
function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Trae TODAS las filas de una consulta, paginando. `construir` debe devolver una consulta
// nueva (con orden estable) en cada llamada. Lanza el error si alguna pagina falla.
async function traerTodo(construir) {
  const filas = [];
  for (let desde = 0; ; desde += PAGE_SIZE) {
    const { data, error } = await construir().range(desde, desde + PAGE_SIZE - 1);
    if (error) throw error;
    const pagina = data || [];
    filas.push(...pagina);
    if (pagina.length < PAGE_SIZE) break;
  }
  return filas;
}

// Igual que traerTodo, pero dividiendo una lista de ids en lotes para no pasarse del largo de URL.
async function traerPorLotes(ids, construir) {
  const filas = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const lote = ids.slice(i, i + CHUNK_SIZE);
    filas.push(...await traerTodo(() => construir(lote)));
  }
  return filas;
}

function sinDuplicados(filas) {
  const vistos = new Set();
  return filas.filter(f => {
    if (vistos.has(f.id)) return false;
    vistos.add(f.id);
    return true;
  });
}

// ==========================================
// EXPORTAR TODOS LOS DATOS A JSON
// ==========================================
export async function exportarDatos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Perfil del usuario
  const { data: perfil, error: errPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (errPerfil) throw errPerfil;

  // 2. Grupos donde es miembro (+ los que creo, por si no quedo registrado como miembro)
  const membresias = await traerTodo(() => supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .order('group_id'));

  const idsMembresia = membresias.map(m => m.group_id);

  // 3. Grupos completos
  const gruposMiembro = await traerPorLotes(idsMembresia, (lote) => supabase
    .from('groups')
    .select('*')
    .in('id', lote)
    .order('id'));

  const gruposPropios = await traerTodo(() => supabase
    .from('groups')
    .select('*')
    .eq('owner_id', user.id)
    .order('id'));

  const grupos = sinDuplicados([...gruposMiembro, ...gruposPropios]);
  const groupIds = grupos.map(g => g.id);

  // 4. Miembros de esos grupos (con perfil publico)
  const miembros = await traerPorLotes(groupIds, (lote) => supabase
    .from('group_members')
    .select('group_id, user_id, joined_at, profile:profiles!group_members_user_id_fkey(id, email, full_name)')
    .in('group_id', lote)
    .order('group_id')
    .order('user_id'));

  // 5. Gastos de esos grupos
  const gastos = await traerPorLotes(groupIds, (lote) => supabase
    .from('expenses')
    .select('*')
    .in('group_id', lote)
    .order('id'));

  // 6. Divisiones (splits) de esos gastos
  const expenseIds = gastos.map(g => g.id);
  const splits = await traerPorLotes(expenseIds, (lote) => supabase
    .from('expense_splits')
    .select('*')
    .in('expense_id', lote)
    .order('id'));

  // 7. Pagos/saldos de esos grupos
  const settlements = await traerPorLotes(groupIds, (lote) => supabase
    .from('settlements')
    .select('*')
    .in('group_id', lote)
    .order('id'));

  // 8. Amistades (pendientes y aceptadas)
  const friendships = await traerTodo(() => supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .order('id'));

  // 9. Comentarios en el libro de visitas (solo los propios)
  const guestbook = await traerTodo(() => supabase
    .from('guestbook')
    .select('*')
    .eq('user_id', user.id)
    .order('id'));

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
    friendships,
    guestbook
  };

  // ==========================================
  // Descargar el archivo JSON
  // ==========================================
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pym-split-backup-${hoyISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000); // revocar de inmediato puede cancelar la descarga

  return {
    groups: gruposConDatos.length,
    expenses: gastos.length,
    size: blob.size // bytes reales (json.length contaba caracteres)
  };
}
