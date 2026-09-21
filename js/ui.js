// js/ui.js
import { supabase } from './supabase.js';
import { cargarGrupos, initGroupModal } from './groups.js';

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
