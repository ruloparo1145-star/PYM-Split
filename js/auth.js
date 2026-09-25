// js/auth.js
import { supabase } from './supabase.js';
import { initI18n, t } from './i18n.js';

// Inicializar idioma antes que nada
initI18n();

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// ==========================================
// CAMBIO DE TABS
// ==========================================
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.remove('hidden');
  formRegister.classList.add('hidden');
  loginError.textContent = '';
  registerError.textContent = '';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.remove('hidden');
  formLogin.classList.add('hidden');
  loginError.textContent = '';
  registerError.textContent = '';
});

// ==========================================
// LOGIN
// ==========================================
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const btn = formLogin.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = t('auth.loading.login');

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = traducirError(error.message);
    btn.disabled = false;
    btn.textContent = t('index.login_button');
    return;
  }

  window.location.href = 'app.html';
});

// ==========================================
// REGISTRO
// ==========================================
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.textContent = '';
  const btn = formRegister.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = t('auth.loading.register');

  const fullName = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    registerError.textContent = traducirError(error.message);
    btn.disabled = false;
    btn.textContent = t('index.register_button');
    return;
  }

  window.location.href = 'app.html';
});

// ==========================================
// TRADUCCION DE ERRORES
// ==========================================
function traducirError(msg) {
  const mapa = {
    'Invalid login credentials': 'auth.error.invalid_credentials',
    'Email not confirmed': 'auth.error.email_not_confirmed',
    'User already registered': 'auth.error.user_exists',
    'Password should be at least 6 characters': 'auth.error.password_short',
    'Unable to validate email address: invalid format': 'auth.error.email_invalid',
    'Failed to fetch': 'auth.error.fetch'
  };

  const clave = mapa[msg];
  return clave ? t(clave) : msg;
}

// ==========================================
// VERIFICAR SI YA HAY SESION ACTIVA
// ==========================================
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'app.html';
  }
})();
