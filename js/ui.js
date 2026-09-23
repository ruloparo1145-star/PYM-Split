// js/ui.js
import { supabase } from './supabase.js';
import { cargarGrupos, initGroupModal } from './groups.js';
import { initFriendsModal } from './friends.js';
import { initExpenseModal } from './expenses.js';
import { initAddMemberModal } from './members.js';

// ==========================================
// 1. PROTEGER LA RUTA Y CARGAR DATOS
// ==========================================
(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    window.location.href = 'index.html';
    return;
  }

  // Mostrar nombre del usuario
  const welcomeMessage = document.getElementById('welcome-message');
  const fullName = session.user.user_metadata?.full_name || 'Usuario';
  welcomeMessage.textContent = `Hola, ${fullName}`;

  // Inicializar todos los modales y funcionalidades
  await cargarGrupos();
  initGroupModal();
  initFriendsModal();
  initExpenseModal();
  initAddMemberModal();
})();

// ==========================================
// 2. CERRAR SESIÃ“N (Logout)
// ==========================================
document.getElementById('btn-logout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = 'index.html';
  } else {
    alert('Error al cerrar sesiÃ³n: ' + error.message);
  }
});
