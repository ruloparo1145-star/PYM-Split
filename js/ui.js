// js/ui.js
import { supabase } from './supabase.js';
import { initI18n, t, setIdioma, getIdioma, aplicarTraducciones } from './i18n.js';
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

  // 1. Cargar perfil PRIMERO para saber su idioma preferido
  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, email, language')
    .eq('id', session.user.id)
    .single();

  // 2. Determinar idioma: perfil > localStorage > navegador
  let idioma = perfil?.language || null;

  if (!idioma) {
    idioma = localStorage.getItem('pym_idioma')
      || ((navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en');
  }

  setIdioma(idioma);
  aplicarTraducciones();

  // 3. Mostrar nombre del usuario
  const welcomeMessage = document.getElementById('welcome-message');
  const fullName = perfil?.full_name
    || session.user.user_metadata?.full_name
    || perfil?.email
    || session.user.email
    || 'User';

  if (welcomeMessage) {
    welcomeMessage.textContent = t('dashboard.welcome', { nombre: fullName });
  }

  // 4. Cargar datos
  await cargarGrupos();
  await cargarDashboard();

  // 5. Inicializar modales y funcionalidades
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

  // 6. Inicializar modal del historico
  setTimeout(() => {
    initChartHistoryModal();
  }, 100);

  console.log('PYM Split iniciado correctamente en idioma:', getIdioma());
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

  if (!btnVer || !modal) {
    console.warn('Modal historico no encontrado');
    return;
  }

  // Remover listeners previos
  const nuevoBtn = btnVer.cloneNode(true);
  btnVer.parentNode.replaceChild(nuevoBtn, btnVer);

  nuevoBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
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
}

// ==========================================
// 4. CERRAR SESION
// ==========================================
document.getElementById('btn-logout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    window.location.href = 'index.html';
  } else {
    alert('Error: ' + error.message);
  }
});
