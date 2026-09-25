// js/i18n.js

// ==========================================
// TRADUCCIONES
// ==========================================
export const TRADUCCIONES = {
  es: {
    // ---------- INDEX (Login/Registro) ----------
    'index.title': 'PYM Split - Iniciar sesion',
    'index.subtitle': 'Divide gastos, no amistades',
    'index.tab_login': 'Iniciar sesion',
    'index.tab_register': 'Crear cuenta',
    'index.email': 'Email',
    'index.email_placeholder': 'tu@email.com',
    'index.password': 'Contrasena',
    'index.password_placeholder': 'Minimo 6 caracteres',
    'index.login_button': 'Entrar',
    'index.register_name': 'Nombre completo',
    'index.register_name_placeholder': 'Juan Perez',
    'index.register_button': 'Crear cuenta',

    // ---------- ERRORES AUTH ----------
    'auth.error.invalid_credentials': 'Email o contrasena incorrectos.',
    'auth.error.email_not_confirmed': 'Debes confirmar tu email antes de entrar.',
    'auth.error.user_exists': 'Este email ya esta registrado.',
    'auth.error.password_short': 'La contrasena debe tener al menos 6 caracteres.',
    'auth.error.email_invalid': 'El formato del email no es valido.',
    'auth.error.fetch': 'No se pudo conectar con el servidor. Revisa tu conexion a internet.',
    'auth.loading.login': 'Entrando...',
    'auth.loading.register': 'Creando cuenta...',

    // ---------- HEADER ----------
    'header.manual': 'Manual de uso',
    'header.friends': 'Amigos',
    'header.profile': 'Perfil',
    'header.logout': 'Salir',

    // ---------- DASHBOARD ----------
    'dashboard.welcome': 'Hola, {nombre}',
    'dashboard.welcome_sub': 'Bienvenido a tu gestor de gastos',
    'dashboard.see_history': 'Ver historico',
    'dashboard.tab.active': 'Grupos activos',
    'dashboard.tab.archived': 'Grupos archivados',
    'dashboard.tab.all': 'Todos',
    'dashboard.total.active': 'Total gastado en grupos activos',
    'dashboard.total.archived': 'Total gastado en grupos archivados',
    'dashboard.total.all': 'Total gastado (todos los grupos)',
    'dashboard.they_owe': 'Te deben',
    'dashboard.you_owe': 'Debes',
    'dashboard.recent': 'Ultimos movimientos',
    'dashboard.recent_empty': 'No hay movimientos.',
    'dashboard.groups': 'Mis Grupos',
    'dashboard.groups_archived': 'Grupos Archivados',
    'dashboard.groups_empty': 'Aun no tienes grupos. Crea uno nuevo!',
    'dashboard.groups_archived_empty': 'No tienes grupos archivados.',
    'dashboard.groups_calc': 'Calculando totales...',
    'dashboard.btn_archived': 'Archivados',
    'dashboard.btn_active': 'Ver activos',
    'dashboard.btn_new': '+ Nuevo',
    'dashboard.loading': 'Cargando...',

    // ---------- PERFIL ----------
    'profile.title': 'Mi Perfil',
    'profile.email': 'Email',
    'profile.name': 'Nombre',
    'profile.name_placeholder': 'Tu nombre completo',
    'profile.phone': 'Telefono (opcional)',
    'profile.currency': 'Moneda preferida',
    'profile.currency_hint': 'El dashboard mostrara los totales en esta moneda.',
    'profile.language': 'Idioma',
    'profile.language_hint': 'Elegi el idioma de la app.',
    'profile.save': 'Guardar cambios',
    'profile.cancel': 'Cancelar',
    'profile.saving': 'Guardando...',
    'profile.success': 'Perfil guardado correctamente.',
    'profile.error': 'Error: {mensaje}',

    // ---------- IDIOMAS ----------
    'lang.es': 'Espanol',
    'lang.en': 'Ingles (EEUU)',

    // ---------- CATEGORIAS ----------
    'cat.comida': 'Comida',
    'cat.transporte': 'Transporte',
    'cat.alojamiento': 'Alojamiento',
    'cat.supermercado': 'Supermercado',
    'cat.ocio': 'Ocio',
    'cat.salud': 'Salud',
    'cat.servicios': 'Servicios',
    'cat.compras': 'Compras',
    'cat.viajes': 'Viajes',
    'cat.otros': 'Otros'
  },

  en: {
    // ---------- INDEX (Login/Register) ----------
    'index.title': 'PYM Split - Sign in',
    'index.subtitle': 'Split expenses, not friendships',
    'index.tab_login': 'Sign in',
    'index.tab_register': 'Create account',
    'index.email': 'Email',
    'index.email_placeholder': 'you@email.com',
    'index.password': 'Password',
    'index.password_placeholder': 'At least 6 characters',
    'index.login_button': 'Sign in',
    'index.register_name': 'Full name',
    'index.register_name_placeholder': 'John Smith',
    'index.register_button': 'Create account',

    // ---------- AUTH ERRORS ----------
    'auth.error.invalid_credentials': 'Incorrect email or password.',
    'auth.error.email_not_confirmed': 'You must confirm your email before signing in.',
    'auth.error.user_exists': 'This email is already registered.',
    'auth.error.password_short': 'Password must be at least 6 characters.',
    'auth.error.email_invalid': 'Invalid email format.',
    'auth.error.fetch': 'Could not connect to the server. Check your internet connection.',
    'auth.loading.login': 'Signing in...',
    'auth.loading.register': 'Creating account...',

    // ---------- HEADER ----------
    'header.manual': 'User manual',
    'header.friends': 'Friends',
    'header.profile': 'Profile',
    'header.logout': 'Sign out',

    // ---------- DASHBOARD ----------
    'dashboard.welcome': 'Hi, {nombre}',
    'dashboard.welcome_sub': 'Welcome to your expense manager',
    'dashboard.see_history': 'See history',
    'dashboard.tab.active': 'Active groups',
    'dashboard.tab.archived': 'Archived groups',
    'dashboard.tab.all': 'All',
    'dashboard.total.active': 'Total spent in active groups',
    'dashboard.total.archived': 'Total spent in archived groups',
    'dashboard.total.all': 'Total spent (all groups)',
    'dashboard.they_owe': 'They owe you',
    'dashboard.you_owe': 'You owe',
    'dashboard.recent': 'Recent activity',
    'dashboard.recent_empty': 'No activity.',
    'dashboard.groups': 'My Groups',
    'dashboard.groups_archived': 'Archived Groups',
    'dashboard.groups_empty': 'You have no groups yet. Create one!',
    'dashboard.groups_archived_empty': 'You have no archived groups.',
    'dashboard.groups_calc': 'Calculating totals...',
    'dashboard.btn_archived': 'Archived',
    'dashboard.btn_active': 'See active',
    'dashboard.btn_new': '+ New',
    'dashboard.loading': 'Loading...',

    // ---------- PROFILE ----------
    'profile.title': 'My Profile',
    'profile.email': 'Email',
    'profile.name': 'Name',
    'profile.name_placeholder': 'Your full name',
    'profile.phone': 'Phone (optional)',
    'profile.currency': 'Preferred currency',
    'profile.currency_hint': 'The dashboard will show totals in this currency.',
    'profile.language': 'Language',
    'profile.language_hint': 'Choose the app language.',
    'profile.save': 'Save changes',
    'profile.cancel': 'Cancel',
    'profile.saving': 'Saving...',
    'profile.success': 'Profile saved successfully.',
    'profile.error': 'Error: {mensaje}',

    // ---------- LANGUAGES ----------
    'lang.es': 'Spanish',
    'lang.en': 'English (US)',

    // ---------- CATEGORIES ----------
    'cat.comida': 'Food',
    'cat.transporte': 'Transport',
    'cat.alojamiento': 'Accommodation',
    'cat.supermercado': 'Groceries',
    'cat.ocio': 'Entertainment',
    'cat.salud': 'Health',
    'cat.servicios': 'Services',
    'cat.compras': 'Shopping',
    'cat.viajes': 'Travel',
    'cat.otros': 'Other'
  }
};

// ==========================================
// ESTADO
// ==========================================
let idiomaActual = 'en';

// ==========================================
// SET / GET IDIOMA
// ==========================================
export function setIdioma(idioma) {
  idiomaActual = (idioma === 'es') ? 'es' : 'en';
  localStorage.setItem('pym_idioma', idiomaActual);
  document.documentElement.lang = idiomaActual;
}

export function getIdioma() {
  return idiomaActual;
}

// ==========================================
// TRADUCIR
// ==========================================
export function t(clave, params = {}) {
  const textos = TRADUCCIONES[idiomaActual] || TRADUCCIONES.en;
  let texto = textos[clave] || TRADUCCIONES.en[clave] || clave;

  Object.entries(params).forEach(([k, v]) => {
    texto = texto.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });

  return texto;
}

// ==========================================
// APLICAR TRADUCCIONES AL DOM
// ==========================================
export function aplicarTraducciones(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}

// ==========================================
// DETECTAR IDIOMA INICIAL
// ==========================================
export function detectarIdioma() {
  const guardado = localStorage.getItem('pym_idioma');
  if (guardado) return guardado;

  const navegador = (navigator.language || 'en').toLowerCase();
  return navegador.startsWith('es') ? 'es' : 'en';
}

// ==========================================
// INICIALIZAR (llamar al arrancar la app)
// ==========================================
export function initI18n() {
  const idioma = detectarIdioma();
  setIdioma(idioma);
  aplicarTraducciones();
  return idioma;
}

// ==========================================
// TRADUCIR CATEGORIAS
// ==========================================
export function tCategoria(cat) {
  return t(`cat.${cat}`) || cat;
}
