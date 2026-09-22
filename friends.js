// js/friends.js
import { supabase } from './supabase.js';

// ==========================================
// 1. BUSCAR USUARIO POR EMAIL Y ENVIAR SOLICITUD
// ==========================================
export async function enviarSolicitudAmistad(email) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Buscar al usuario por email
  const { data: perfil, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (findError || !perfil) {
    throw new Error('No se encontrÃ³ ningÃºn usuario con ese email.');
  }

  if (perfil.id === user.id) {
    throw new Error('No puedes agregarte a ti mismo.');
  }

  // 2. Verificar si ya son amigos o hay una solicitud pendiente
  const { data: existente } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${perfil.id}),and(user_id.eq.${perfil.id},friend_id.eq.${user.id})`)
    .maybeSingle();

  if (existente) {
    if (existente.status === 'accepted') throw new Error('Ya son amigos.');
    if (existente.status === 'pending') throw new Error('Ya hay una solicitud pendiente.');
  }

  // 3. Insertar solicitud
  const { error: insertError } = await supabase
    .from('friendships')
    .insert([{
      user_id: user.id,
      friend_id: perfil.id,
      status: 'pending'
    }]);

  if (insertError) throw insertError;
  return perfil.full_name || perfil.email;
}

// ==========================================
// 2. CARGAR SOLICITUDES PENDIENTES Y AMIGOS
// ==========================================
export async function cargarAmigos() {
  const requestsList = document.getElementById('friend-requests-list');
  const friendsList = document.getElementById('friends-list');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Traemos todas las amistades donde el usuario estÃ© involucrado
  const { data: amistades, error } = await supabase
    .from('friendships')
    .select(`
      id, status, user_id, friend_id,
      user:profiles!friendships_user_id_fkey(id, full_name, email),
      friend:profiles!friendships_friend_id_fkey(id, full_name, email)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) {
    console.error('Error cargando amistades:', error);
    requestsList.innerHTML = '<p class="error-msg">Error al cargar.</p>';
    friendsList.innerHTML = '<p class="error-msg">Error al cargar.</p>';
    return;
  }

  const pendientes = amistades.filter(a => a.status === 'pending');
  const aceptadas = amistades.filter(a => a.status === 'accepted');

  // Renderizar solicitudes pendientes
  if (pendientes.length === 0) {
    requestsList.innerHTML = '<p class="placeholder-text">No hay solicitudes pendientes.</p>';
  } else {
    requestsList.innerHTML = pendientes.map(solicitud => {
      const esEntrante = solicitud.friend_id === user.id;
      const otroUsuario = esEntrante ? solicitud.user : solicitud.friend;
      
      return `
        <div class="friend-card">
          <div class="friend-info">
            <h4>${otroUsuario.full_name || otroUsuario.email}</h4>
            <span>${esEntrante ? 'Te enviÃ³ solicitud' : 'Solicitud enviada'}</span>
          </div>
          ${esEntrante ? `
            <div class="friend-actions">
              <button class="btn-small btn-accept" data-id="${solicitud.id}">Aceptar</button>
              <button class="btn-small btn-reject" data-id="${solicitud.id}">Rechazar</button>
            </div>
          ` : `<span class="badge-pending">Pendiente</span>`}
        </div>
      `;
    }).join('');
    
    document.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', () => aceptarSolicitud(btn.dataset.id));
    });
    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => rechazarSolicitud(btn.dataset.id));
    });
  }

  // Renderizar amigos aceptados
  if (aceptadas.length === 0) {
    friendsList.innerHTML = '<p class="placeholder-text">AÃºn no tienes amigos agregados.</p>';
  } else {
    friendsList.innerHTML = aceptadas.map(amistad => {
      const otroUsuario = amistad.user_id === user.id ? amistad.friend : amistad.user;
      return `
        <div class="friend-card">
          <div class="friend-info">
            <h4>${otroUsuario.full_name || otroUsuario.email}</h4>
            <span>${otroUsuario.email}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ==========================================
// 3. ACEPTAR / RECHAZAR SOLICITUD
// ==========================================
async function aceptarSolicitud(id) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', id);
  
  if (error) alert('Error al aceptar: ' + error.message);
  else cargarAmigos();
}

async function rechazarSolicitud(id) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', id);

  if (error) alert('Error al rechazar: ' + error.message);
  else cargarAmigos();
}

// ==========================================
// 4. INICIALIZAR MODAL DE AMIGOS
// ==========================================
export function initFriendsModal() {
  const modal = document.getElementById('modal-friends');
  const btnOpen = document.getElementById('btn-friends');
  const btnClose = document.getElementById('btn-cancel-friends');
  const form = document.getElementById('form-add-friend');
  const errorMsg = document.getElementById('friend-error');

  btnOpen.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
    await cargarAmigos();
  });

  btnClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = '...';

    const email = document.getElementById('friend-email').value.trim();

    try {
      const nombre = await enviarSolicitudAmistad(email);
      errorMsg.style.color = '#38a169';
      errorMsg.textContent = `Â¡Solicitud enviada a ${nombre}!`;
      form.reset();
      await cargarAmigos();
    } catch (error) {
      errorMsg.style.color = '#e53e3e';
      errorMsg.textContent = error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar';
    }
  });
}
