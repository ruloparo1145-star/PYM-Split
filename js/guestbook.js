// js/guestbook.js
import { supabase } from './supabase.js';

// ==========================================
// CARGAR COMENTARIOS
// ==========================================
export async function cargarGuestbook() {
  const list = document.getElementById('guestbook-list');
  if (!list) return;

  list.innerHTML = '<p class="placeholder-text">Cargando comentarios...</p>';

  const { data: comentarios, error } = await supabase
    .from('guestbook')
    .select('id, message, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error guestbook:', error);
    list.innerHTML = '<p class="error-msg">Error al cargar los comentarios.</p>';
    return;
  }

  if (!comentarios || comentarios.length === 0) {
    list.innerHTML = '<p class="placeholder-text">Todavia no hay comentarios. Se el primero!</p>';
    return;
  }

  // Traer perfiles
  const userIds = [...new Set(comentarios.map(c => c.user_id))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email || 'Usuario');

  const { data: { user } } = await supabase.auth.getUser();

  list.innerHTML = comentarios.map(c => {
    const esPropio = user && c.user_id === user.id;
    const fecha = new Date(c.created_at).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const inicial = (nombres[c.user_id] || 'U').charAt(0).toUpperCase();

    return `
      <div class="guestbook-item">
        <div class="guestbook-avatar">${inicial}</div>
        <div class="guestbook-content">
          <div class="guestbook-header">
            <strong>${nombres[c.user_id] || 'Usuario'}</strong>
            <small>${fecha}</small>
            ${esPropio ? `<button class="guestbook-delete" data-id="${c.id}" title="Eliminar">&#128465;</button>` : ''}
          </div>
          <p>${escapeHtml(c.message)}</p>
        </div>
      </div>
    `;
  }).join('');

  // Listener para borrar
  list.querySelectorAll('.guestbook-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminar este comentario?')) return;
      const id = btn.dataset.id;
      const { error } = await supabase.from('guestbook').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        await cargarGuestbook();
      }
    });
  });
}

// ==========================================
// PUBLICAR COMENTARIO
// ==========================================
async function publicarComentario(mensaje) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('guestbook')
    .insert([{
      user_id: user.id,
      message: mensaje
    }]);

  if (error) throw error;
}

// ==========================================
// ESCAPAR HTML (para prevenir XSS)
// ==========================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// INICIALIZAR FORMULARIO
// ==========================================
export function initGuestbook() {
  const form = document.getElementById('form-guestbook');
  const textarea = document.getElementById('guestbook-message');
  const errorMsg = document.getElementById('guestbook-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const mensaje = textarea.value.trim();
    if (!mensaje) {
      errorMsg.textContent = 'Escribi un mensaje.';
      return;
    }
    if (mensaje.length > 500) {
      errorMsg.textContent = 'El mensaje es demasiado largo (maximo 500 caracteres).';
      return;
    }

    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Publicando...';

    try {
      await publicarComentario(mensaje);
      textarea.value = '';
      await cargarGuestbook();
    } catch (error) {
      errorMsg.textContent = 'Error: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Publicar';
    }
  });

  // Cargar comentarios la primera vez
  cargarGuestbook();
}
