// js/members.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR MIEMBROS DEL GRUPO
// ==========================================
export async function cargarMiembrosDelGrupo(groupId) {
  const list = document.getElementById('group-members-list');
  
  const { data: miembros, error } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('group_id', groupId);

  if (error || !miembros) {
    list.innerHTML = '<p class="error-msg">Error al cargar miembros.</p>';
    return;
  }

  list.innerHTML = miembros.map(m => `
    <div class="member-chip">
      ${m.profiles.full_name || m.profiles.email}
    </div>
  `).join('');
}

// ==========================================
// 2. CARGAR AMIGOS DISPONIBLES (NO EN EL GRUPO)
// ==========================================
export async function cargarAmigosDisponibles(groupId) {
  const list = document.getElementById('available-friends-list');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Traer mis amigos (aceptados)
  const { data: amistades } = await supabase
    .from('friendships')
    .select(`
      user_id, friend_id,
      user:profiles!friendships_user_id_fkey(id, full_name, email),
      friend:profiles!friendships_friend_id_fkey(id, full_name, email)
    `)
    .eq('status', 'accepted')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (!amistades || amistades.length === 0) {
    list.innerHTML = '<p class="placeholder-text">No tienes amigos aún. Añade uno desde el botón "Amigos".</p>';
    return;
  }

  // 2. Traer miembros actuales del grupo
  const { data: miembrosActuales } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const idsEnGrupo = (miembrosActuales || []).map(m => m.user_id);

  // 3. Filtrar amigos que no estén ya en el grupo
  const amigosDisponibles = amistades
    .map(a => a.user_id === user.id ? a.friend : a.user)
    .filter(a => !idsEnGrupo.includes(a.id));

  if (amigosDisponibles.length === 0) {
    list.innerHTML = '<p class="placeholder-text">Todos tus amigos ya están en este grupo.</p>';
    return;
  }

  // 4. Renderizar
  list.innerHTML = amigosDisponibles.map(a => `
    <div class="friend-card clickable" data-friend-id="${a.id}">
      <div class="friend-info">
        <h4>${a.full_name || a.email}</h4>
        <span>${a.email}</span>
      </div>
      <button class="btn-small btn-accept">Añadir</button>
    </div>
  `).join('');

  // 5. Listeners
  list.querySelectorAll('.clickable').forEach(card => {
    card.addEventListener('click', async () => {
      const friendId = card.dataset.friendId;
      await agregarMiembroAlGrupo(groupId, friendId);
      await cargarAmigosDisponibles(groupId); // Recargar la lista
    });
  });
}

// ==========================================
// 3. AGREGAR MIEMBRO AL GRUPO
// ==========================================
async function agregarMiembroAlGrupo(groupId, userId) {
  const { error } = await supabase
    .from('group_members')
    .insert([{
      group_id: groupId,
      user_id: userId
    }]);

  if (error) {
    if (error.code === '23505') {
      alert('Ese amigo ya está en el grupo.');
    } else {
      alert('Error al añadir: ' + error.message);
    }
  } else {
    // Recargar la lista de miembros del grupo
    await cargarMiembrosDelGrupo(groupId);
  }
}

// ==========================================
// 4. INICIALIZAR MODAL DE AÑADIR MIEMBRO
// ==========================================
export function initAddMemberModal() {
  const modal = document.getElementById('modal-add-member');
  const btnOpen = document.getElementById('btn-add-member');
  const btnClose = document.getElementById('btn-cancel-add-member');
  const detailModal = document.getElementById('modal-group-detail');

  btnOpen?.addEventListener('click', async () => {
    const groupId = detailModal.dataset.groupId;
    if (!groupId) return;
    modal.classList.remove('hidden');
    await cargarAmigosDisponibles(groupId);
  });

  btnClose?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
}
