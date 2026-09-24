// js/ui.js
import { supabase } from './supabase.js';
import { cargarGrupos, initGroupModal, initArchivedToggle } from './groups.js';
import { initFriendsModal } from './friends.js';
import { initExpenseModal, initFiltroCategoria } from './expenses.js';
import { initAddMemberModal } from './members.js';
import { cargarDashboard, initDashboardTabs } from './dashboard.js';
import { initProfileModal } from './profile.js';
import { initGuestbook } from './guestbook.js';

// ==========================================
// 1. PROTEGER LA RUTA Y CARGAR DATOS
// ==========================================
(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    window.location.href = 'index.html';
    return;
  }

  // Mostrar nombre del usuario (desde profiles)
  const welcomeMessage = document.getElementById('welcome-message');
  
  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  const fullName = perfil?.full_name
    || session.user.user_metadata?.full_name
    || perfil?.email
    || session.user.email
    || 'Usuario';

  welcomeMessage.textContent = `Hola, ${fullName}`;

  // Cargar datos
  await cargarGrupos();
  await cargarDashboard();

  // Inicializar modales y funcionalidades
  initGroupModal();
  initFriendsModal();
  initExpenseModal();
  initFiltroCategoria();
  initAddMemberModal();
  initArchivedToggle();
  initProfileModal();
  initManualModal();
  initGuestbook();
  initDashboardTabs();
  initChartHistoryModal();
})();

// ==========================================
// 2. MANUAL DE USO
// ==========================================
function initManualModal() {
  const btnManual = document.getElementById('btn-manual');
  const modal = document.getElementById('modal-manual');
  const btnClose = document.getElementById('btn-close-manual');

  btnManual?.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  btnClose?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-manual') {
      modal.classList.add('hidden');
    }
  });
}

// ==========================================
// 3. MODAL: GRAFICO HISTORICO
// ==========================================
function initChartHistoryModal() {
  const btnVer = document.getElementById('btn-ver-grafico');
  const modal = document.getElementById('modal-chart-history');
  const btnClose = document.getElementById('btn-close-chart-history');

  btnVer?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    // Forzar redibujado del chart (el canvas puede tener tamaÃ±o 0 al inicio)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  });

  btnClose?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-chart-history') {
      modal.classList.add('hidden');
    }
  });
}

// ==========================================
// 4. CERRAR SESION (Logout)
// ==========================================
document.getElementById('btn-logout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = 'index.html';
  } else {
    alert('Error al cerrar sesion: ' + error.message);
  }
});
