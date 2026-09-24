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

  // Inicializar el modal del historico (con delay para asegurar que el DOM este listo)
  setTimeout(() => {
    initChartHistoryModal();
  }, 100);

  console.log('PYM Split iniciado correctamente');
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
  const btnVer = document.getElementById('btn-ver-historico');
  const modal = document.getElementById('modal-chart-history');
  const btnClose = document.getElementById('btn-close-chart-history');

  console.log('Inicializando modal historico...');
  console.log('btn-ver-historico:', btnVer);
  console.log('modal-chart-history:', modal);

  if (!btnVer) {
    console.warn('Boton "Ver historico" no encontrado');
    return;
  }

  if (!modal) {
    console.warn('Modal "modal-chart-history" no encontrado');
    return;
  }

  // Remover listeners previos (por si se llama 2 veces)
  const nuevoBtn = btnVer.cloneNode(true);
  btnVer.parentNode.replaceChild(nuevoBtn, btnVer);

  nuevoBtn.addEventListener('click', () => {
    console.log('Click en Ver historico');
    modal.classList.remove('hidden');
    // Forzar resize del chart despues de abrir
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  });

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target.id === 'modal-chart-history') {
      modal.classList.add('hidden');
    }
  });

  console.log('Modal historico inicializado OK');
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
