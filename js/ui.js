// js/ui.js
import { supabase } from './supabase.js';
import { cargarGrupos, initGroupModal } from './groups.js';

<!-- MODAL: Amigos -->
  <div id="modal-friends" class="modal-overlay hidden">
    <div class="modal-content" style="max-width: 500px;">
      <h3>GestiÃ³n de Amigos</h3>
      
      <!-- Formulario para aÃ±adir amigo -->
      <form id="form-add-friend" style="margin-bottom: 20px;">
        <div class="form-group">
          <label for="friend-email">Agregar amigo por email</label>
          <div style="display: flex; gap: 10px;">
            <input type="email" id="friend-email" placeholder="amigo@email.com" required style="flex:1;">
            <button type="submit" class="btn-primary" style="width: auto; padding: 0 20px;">Enviar</button>
          </div>
          <p id="friend-error" class="error-msg" style="text-align: left; margin-top: 5px;"></p>
        </div>
      </form>

      <div style="border-top: 1px solid #edf2f7; padding-top: 15px;">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem; color: #4a5568;">Solicitudes Pendientes</h4>
        <div id="friend-requests-list">
          <p class="placeholder-text">Cargando...</p>
        </div>
      </div>

      <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 15px;">
        <h4 style="margin-bottom: 10px; font-size: 0.9rem; color: #4a5568;">Mis Amigos</h4>
        <div id="friends-list">
          <p class="placeholder-text">Cargando...</p>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" id="btn-cancel-friends" class="btn-secondary">Cerrar</button>
      </div>
    </div>
  </div>
// ==========================================
// 1. PROTEGER LA RUTA (Verificar sesiÃ³n)
// ==========================================
(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Si no hay sesiÃ³n, redirigir al login
    window.location.href = 'index.html';
    return;
  }

  // Si hay sesiÃ³n, mostrar los datos del usuario
  mostrarDatosUsuario(session.user);
})();

// ==========================================
// 2. MOSTRAR DATOS DEL USUARIO
// ==========================================
function mostrarDatosUsuario(user) {
  const welcomeMessage = document.getElementById('welcome-message');
  // El nombre completo lo guardamos en el metadata al registrarse
  const fullName = user.user_metadata?.full_name || 'Usuario';
  welcomeMessage.textContent = `Hola, ${fullName}`;
}

// ==========================================
// 3. CERRAR SESIÃ“N (Logout)
// ==========================================
document.getElementById('btn-logout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    window.location.href = 'index.html';
  } else {
    alert('Error al cerrar sesiÃ³n: ' + error.message);
  }
});

// ==========================================
// 4. INICIALIZAR GRUPOS Y MODAL
// ==========================================
// El botÃ³n flotante (#fab-add) y el botÃ³n "+ Nuevo" (#btn-new-group)
// abren el modal de crear grupo desde groups.js
initGroupModal();
cargarGrupos();
