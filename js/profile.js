// js/profile.js
import { supabase } from './supabase.js';

// ==========================================
// MONEDAS DISPONIBLES
// ==========================================
const MONEDAS = [
  // America
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'BOB', label: 'Boliviano' },
  { code: 'BRL', label: 'Real brasileno' },
  { code: 'CAD', label: 'Dolar canadiense' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'CRC', label: 'Colon costarricense' },
  { code: 'CUP', label: 'Peso cubano' },
  { code: 'DOP', label: 'Peso dominicano' },
  { code: 'GTQ', label: 'Quetzal guatemalteco' },
  { code: 'HNL', label: 'Lempira hondurena' },
  { code: 'MXN', label: 'Peso mexicano' },
  { code: 'NIO', label: 'Cordoba nicaraguense' },
  { code: 'PAB', label: 'Balboa panameno' },
  { code: 'PEN', label: 'Sol peruano' },
  { code: 'PYG', label: 'Guarani paraguayo' },
  { code: 'USD', label: 'Dolar estadounidense' },
  { code: 'UYU', label: 'Peso uruguayo' },
  { code: 'VES', label: 'Bolivar venezolano' },
  // Europa
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'Libra esterlina' },
  { code: 'CHF', label: 'Franco suizo' },
  { code: 'NOK', label: 'Corona noruega' },
  { code: 'SEK', label: 'Corona sueca' },
  { code: 'DKK', label: 'Corona danesa' },
  { code: 'PLN', label: 'Zloty polaco' },
  { code: 'CZK', label: 'Corona checa' },
  { code: 'HUF', label: 'Forinto hungaro' },
  { code: 'RON', label: 'Leu rumano' },
  { code: 'BGN', label: 'Lev bulgaro' },
  { code: 'TRY', label: 'Lira turca' },
  { code: 'RUB', label: 'Rublo ruso' },
  { code: 'UAH', label: 'Grivna ucraniana' }
];

// ==========================================
// 1. CARGAR PERFIL
// ==========================================
export async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, preferred_currency')
    .eq('id', user.id)
    .single();

  if (error || !perfil) {
    console.error('Error cargando perfil:', error);
    return;
  }

  // Llenar el select de monedas
  const selectMoneda = document.getElementById('profile-currency');
  selectMoneda.innerHTML = MONEDAS.map(m =>
    `<option value="${m.code}" ${m.code === (perfil.preferred_currency || 'EUR') ? 'selected' : ''}>
      ${m.code} - ${m.label}
    </option>`
  ).join('');

  // Llenar los otros campos
  document.getElementById('profile-email').value = perfil.email || '';
  document.getElementById('profile-name').value = perfil.full_name || '';
  document.getElementById('profile-phone').value = perfil.phone || '';

  document.getElementById('profile-error').textContent = '';
  document.getElementById('profile-success').textContent = '';
}

// ==========================================
// 2. GUARDAR PERFIL
// ==========================================
export async function guardarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const fullName = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const currency = document.getElementById('profile-currency').value;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      preferred_currency: currency
    })
    .eq('id', user.id);

  if (error) throw error;

  // Actualizar el mensaje de bienvenida si cambiÃ³ el nombre
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage && fullName) {
    welcomeMessage.textContent = `Hola, ${fullName}`;
  }
}

// ==========================================
// 3. INICIALIZAR MODAL DE PERFIL
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
    btnSubmit.textContent = 'Guardando...';

    try {
      await guardarPerfil();
      successMsg.style.color = '#38a169';
      successMsg.textContent = 'Perfil guardado correctamente.';

      // Cerrar despuÃ©s de 1.5s
      setTimeout(() => {
        modal.classList.add('hidden');
        successMsg.textContent = '';
      }, 1500);

    } catch (error) {
      errorMsg.textContent = 'Error: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Guardar cambios';
    }
  });
