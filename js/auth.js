// js/auth.js
import { supabase } from './supabase.js';

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
  btn.textContent = 'Entrando...';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = traducirError(error.message);
    btn.disabled = false;
    btn.textContent = 'Entrar';
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
  btn.textContent = 'Creando cuenta...';

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
    btn.textContent = 'Crear cuenta';
    return;
  }

  window.location.href = 'app.html';
});

// ==========================================
// TRADUCCION DE ERRORES DE SUPABASE
// ==========================================
function traducirError(msg) {
  const errores = {
    'Invalid login credentials': 'Email o contrasena incorrectos.',
    'Email not confirmed': 'Debes confirmar tu email antes de entrar.',
    'User already registered': 'Este email ya esta registrado.',
    'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'El formato del email no es valido.',
    'Failed to fetch': 'No se pudo conectar con el servidor. Revisa tu conexion a internet o la URL de Supabase.'
  };
  return errores[msg] || msg;
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
