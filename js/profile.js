// js/profile.js
import { supabase } from './supabase.js';
import { t, setIdioma, getIdioma, aplicarTraducciones } from './i18n.js';

// ==========================================
// MONEDAS DISPONIBLES
// ==========================================
const MONEDAS = [
  { code: 'ARS', label_es: 'Peso argentino', label_en: 'Argentine Peso' },
  { code: 'BOB', label_es: 'Boliviano', label_en: 'Bolivian Boliviano' },
  { code: 'BRL', label_es: 'Real brasileno', label_en: 'Brazilian Real' },
  { code: 'CAD', label_es: 'Dolar canadiense', label_en: 'Canadian Dollar' },
  { code: 'CLP', label_es: 'Peso chileno', label_en: 'Chilean Peso' },
  { code: 'COP', label_es: 'Peso colombiano', label_en: 'Colombian Peso' },
  { code: 'CRC', label_es: 'Colon costarricense', label_en: 'Costa Rican Colon' },
  { code: 'CUP', label_es: 'Peso cubano', label_en: 'Cuban Peso' },
  { code: 'DOP', label_es: 'Peso dominicano', label_en: 'Dominican Peso' },
  { code: 'GTQ', label_es: 'Quetzal guatemalteco', label_en: 'Guatemalan Quetzal' },
  { code: 'HNL', label_es: 'Lempira hondurena', label_en: 'Honduran Lempira' },
  { code: 'MXN', label_es: 'Peso mexicano', label_en: 'Mexican Peso' },
  { code: 'NIO', label_es: 'Cordoba nicaraguense', label_en: 'Nicaraguan Cordoba' },
  { code: 'PAB', label_es: 'Balboa panameno', label_en: 'Panamanian Balboa' },
  { code: 'PEN', label_es: 'Sol peruano', label_en: 'Peruvian Sol' },
  { code: 'PYG', label_es: 'Guarani paraguayo', label_en: 'Paraguayan Guarani' },
  { code: 'USD', label_es: 'Dolar estadounidense', label_en: 'US Dollar' },
  { code: 'UYU', label_es: 'Peso uruguayo', label_en: 'Uruguayan Peso' },
  { code: 'VES', label_es: 'Bolivar venezolano', label_en: 'Venezuelan Bolivar' },
  { code: 'EUR', label_es: 'Euro', label_en: 'Euro' },
  { code: 'GBP', label_es: 'Libra esterlina', label_en: 'British Pound' },
  { code: 'CHF', label_es: 'Franco suizo', label_en: 'Swiss Franc' },
  { code: 'NOK', label_es: 'Corona noruega', label_en: 'Norwegian Krone' },
  { code: 'SEK', label_es: 'Corona sueca', label_en: 'Swedish Krona' },
  { code: 'DKK', label_es: 'Corona danesa', label_en: 'Danish Krone' },
  { code: 'PLN', label_es: 'Zloty polaco', label_en: 'Polish Zloty' },
  { code: 'CZK', label_es: 'Corona checa', label_en: 'Czech Koruna' },
  { code: 'HUF', label_es: 'Forinto hungaro', label_en: 'Hungarian Forint' },
  { code: 'RON', label_es: 'Leu rumano', label_en: 'Romanian Leu' },
  { code: 'BGN', label_es: 'Lev bulgaro', label_en: 'Bulgarian Lev' },
  { code: 'TRY', label_es: 'Lira turca', label_en: 'Turkish Lira' },
  { code: 'RUB', label_es: 'Rublo ruso', label_en: 'Russian Ruble' },
  { code: 'UAH', label_es: 'Grivna ucraniana', label_en: 'Ukrainian Hryvnia' }
];

const IDIOMAS = [
  { code: 'es', key: 'lang.es' },
  { code: 'en', key: 'lang.en' }
];

// ==========================================
// CARGAR PERFIL
// ==========================================
export async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, preferred_currency, language')
    .eq('id', user.id)
    .single();

  if (error || !perfil) {
    console.error('Error cargando perfil:', error);
    return;
  }

  const idioma = getIdioma();
  const labelKey = idioma === 'es' ? 'label_es' : 'label_en';

  // Selector de moneda
  const selectMoneda = document.getElementById('profile-currency');
  selectMoneda.innerHTML = MONEDAS.map(m =>
    `<option value="${m.code}" ${m.code === (perfil.preferred_currency || 'EUR') ? 'selected' : ''}>${m.code} - ${m[labelKey]}</option>`
  ).join('');

  // Selector de idioma
  const selectIdioma = document.getElementById('profile-language');
  if (selectIdioma) {
    selectIdioma.innerHTML = IDIOMAS.map(i =>
      `<option value="${i.code}" ${i.code === (perfil.language || idioma) ? 'selected' : ''}>${t(i.key)}</option>`
    ).join('');
  }

  document.getElementById('profile-email').value = perfil.email || '';
  document.getElementById('profile-name').value = perfil.full_name || '';
  document.getElementById('profile-phone').value = perfil.phone || '';

  document.getElementById('profile-error').textContent = '';
  document.getElementById('profile-success').textContent = '';
}

// ==========================================
// GUARDAR PERFIL
// ==========================================
export async function guardarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fullName = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const currency = document.getElementById('profile-currency').value;
  const language = document.getElementById('profile-language')?.value || getIdioma();

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      preferred_currency: currency,
      language: language
    })
    .eq('id', user.id);

  if (error) throw error;

  // Si cambio el idioma, aplicarlo ya
  if (language !== getIdioma()) {
    setIdioma(language);
    aplicarTraducciones();

    // Actualizar welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && fullName) {
      welcomeMessage.textContent = t('dashboard.welcome', { nombre: fullName });
    }

    // Recargar la app despues de un momento para que todo se retraduzca
    setTimeout(() => {
      window.location.reload();
    }, 800);
    return;
  }

  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage && fullName) {
    welcomeMessage.textContent = t('dashboard.welcome', { nombre: fullName });
  }
}

// ==========================================
// INICIALIZAR MODAL DE PERFIL
// ==========================================
export function initProfileModal() {
  const modal = document.getElementById('modal-profile');
  const btnOpen = document.getElementById('btn-profile');
  const btnClose = document.getElementById('btn-close-profile');
  const btnCancel = document.getElementById('btn-cancel-profile');
  const form = document.getElementById('form-profile');
  const errorMsg = document.getElementById('profile-error');
  const successMsg = document.getElementById('profile-success');

  btnOpen?.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    await cargarPerfil();
  });

  btnClose?.addEventListener('click', () => modal.classList.add('hidden'));
  btnCancel?.addEventListener('click', () => modal.classList.add('hidden'));

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    successMsg.textContent = '';

    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = t('profile.saving');

    try {
      await guardarPerfil();
      successMsg.style.color = '#38a169';
      successMsg.textContent = t('profile.success');

      setTimeout(() => {
        modal.classList.add('hidden');
        successMsg.textContent = '';
      }, 1500);

    } catch (error) {
      errorMsg.textContent = t('profile.error', { mensaje: error.message });
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = t('profile.save');
    }
  });
}
