// js/i18n.js

export const TRADUCCIONES = {
  es: {
    // ---------- INDEX ----------
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

    // ---------- AUTH ERRORS ----------
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
    'dashboard.cat_filter_all': 'Todas las categorias',

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
    'cat.otros': 'Otros',

    // ---------- GRUPOS: CREAR MODAL ----------
    'group.create.title': 'Crear Nuevo Grupo',
    'group.create.name': 'Nombre del Grupo',
    'group.create.name_placeholder': 'Ej: Viaje a Bariloche',
    'group.create.type': 'Tipo',
    'group.create.type.trip': 'Viaje',
    'group.create.type.flat': 'Departamento',
    'group.create.type.outings': 'Salidas',
    'group.create.type.other': 'Otro',
    'group.create.currency': 'Moneda',
    'group.create.date_start': 'Fecha de inicio (opcional)',
    'group.create.date_end': 'Fecha de fin (opcional)',
    'group.create.manual_rate': 'Cotizacion manual (opcional)',
    'group.create.manual_rate_label': '1 {moneda} =',
    'group.create.manual_rate_currency': 'Moneda grupo',
    'group.create.manual_rate_placeholder': 'Ej: 1200',
    'group.create.manual_rate_hint': 'Si la cotizacion no esta en la web, se usara esta. Si esta vacio, queda en 0.',
    'group.create.cancel': 'Cancelar',
    'group.create.submit': 'Crear Grupo',
    'group.create.creating': 'Creando...',
    'group.create.error': 'Error al crear el grupo: {mensaje}',
    'group.create.no_auth': 'Usuario no autenticado',

    // ---------- GRUPOS: LISTA ----------
    'group.list.type_suffix': 'TIPO',
    'group.list.total': 'Total',
    'group.list.my_share': 'Mi parte',
    'group.list.expenses_count': '{count} gastos',
    'group.list.badge_archived': 'Archivado',
    'group.list.badge_closed': 'Cerrado',
    'group.list.dates_from': 'Desde {fecha}',
    'group.list.dates_until': 'Hasta {fecha}',
    'group.list.dates_range': '{inicio} - {fin}',

    // ---------- GRUPOS: ACCIONES ----------
    'group.action.archive_title': 'Archivar',
    'group.action.delete_title': 'Eliminar',
    'group.action.restore_title': 'Restaurar',
    'group.action.archive_confirm': 'Archivar el grupo "{nombre}"? Podras verlo desde el boton "Archivados".',
    'group.action.need_close_computo': 'Primero debes cerrar el computo del grupo antes de archivarlo. Anda al detalle del grupo y toca "Cerrar computo".',
    'group.action.delete_confirm': 'Eliminar el grupo "{nombre}" y TODOS sus datos? Esta accion no se puede deshacer.',
    'group.action.archive_error': 'Error al archivar: {mensaje}',
    'group.action.restore_error': 'Error al restaurar: {mensaje}',
    'group.action.delete_error': 'Error al eliminar el grupo: {mensaje}',
    'group.action.load_error': 'Error: {mensaje}',
    'group.action.db_error': 'No se pudo conectar con Supabase',

    // ---------- GRUPOS: DETALLE ----------
    'group.detail.title': 'Detalle del Grupo',
    'group.detail.total_final': 'Total final',
    'group.detail.total_trip': 'Total del viaje',
    'group.detail.my_part': 'Mi parte',
    'group.detail.closed_on': 'Cerrado el {fecha}',
    'group.detail.manual_rate_badge': 'Cotizacion manual',
    'group.detail.manual_rate_value': '1 {moneda} = {rate} USD',
    'group.detail.no_rate_badge': 'Sin cotizacion automatica',
    'group.detail.no_rate_hint': 'Carga una cotizacion manual',
    'group.detail.balance': 'Balance',
    'group.detail.balance_loading': 'Calculando balances...',
    'group.detail.balance_empty': 'Sin movimientos todavia.',
    'group.detail.balance_settled': 'Todo saldado!',
    'group.detail.expenses_section': 'Gastos',
    'group.detail.expenses_add': '+ Anadir',
    'group.detail.expenses_loading': 'Cargando gastos...',
    'group.detail.members_section': 'Miembros',
    'group.detail.members_add': '+ Anadir miembro',
    'group.detail.members_loading': 'Cargando miembros...',
    'group.detail.members_error': 'Error al cargar miembros.',
    'group.detail.charts_by_person': 'Grafico por persona',
    'group.detail.charts_by_category': 'Grafico por categoria',
    'group.detail.totals_by_category': 'Totales por categoria',
    'group.detail.no_data': 'Sin datos.',
    'group.detail.history_section': 'Historial',
    'group.detail.history_loading': 'Cargando historial...',
    'group.detail.no_activity': 'Sin actividad aun.',
    'group.detail.close': 'Cerrar',
    'group.detail.add_member_title': 'Anadir miembro al grupo',
    'group.detail.add_member_hint': 'Selecciona un amigo para anadirlo a este grupo',
    'group.detail.add_member_loading': 'Cargando amigos...',
    'group.detail.add_member_no_friends': 'No tienes amigos aun. Anade uno desde el boton "Amigos".',
    'group.detail.add_member_all_in': 'Todos tus amigos ya estan en este grupo.',
    'group.detail.add_member_add': 'Anadir',
    'group.detail.add_member_already': 'Ese amigo ya esta en el grupo.',
    'group.detail.add_member_error': 'Error al anadir: {mensaje}',

    // ---------- GRUPOS: BOTONES DETALLE ----------
    'group.btn.calc_today': 'Calcular en moneda de hoy',
    'group.btn.edit_rate': 'Editar cotizacion',
    'group.btn.close_computo': 'Cerrar computo',
    'group.btn.reopen_computo': 'Reabrir',
    'group.btn.view_extras': 'Ver graficos, totales e historial',
    'group.btn.hide_extras': 'Ocultar graficos e historial',
    'group.btn.view_archived_expenses': 'Ver gastos archivados',
    'group.btn.hide_archived_expenses': 'Ocultar gastos archivados',

    // ---------- GRUPOS: CERRAR/REABRIR COMPUTO ----------
    'group.computo.close_confirm': 'Cerrar el computo de este grupo? Se guardara la fecha y el total final.',
    'group.computo.reopen_confirm': 'Reabrir el computo? Se borrara la fecha de cierre y el total final guardado.',
    'group.computo.close_error': 'Error al cerrar computo: {mensaje}',
    'group.computo.reopen_error': 'Error al reabrir computo: {mensaje}',

    // ---------- GRUPOS: COTIZACION MANUAL ----------
    'group.rate.label': 'Cotizacion manual',
    'group.rate.save': 'Guardar',
    'group.rate.cancel': 'Cancelar',
    'group.rate.invalid': 'Ingresa un numero valido.',
    'group.rate.save_error': 'Error al guardar: {mensaje}',
    'group.rate.no_auth': 'No autenticado',

    // ---------- GRUPOS: CALCULADORA HOY ----------
    'group.calc.title': 'Calculadora de hoy',
    'group.calc.group': 'Grupo: {nombre}',
    'group.calc.historic_label': 'Total gastado (con tasas del momento)',
    'group.calc.today_label': 'Si lo hicieras HOY',
    'group.calc.diff_label': 'Diferencia',
    'group.calc.diff_note_up': 'La moneda subio respecto al momento del viaje.',
    'group.calc.diff_note_down': 'La moneda bajo respecto al momento del viaje.',
    'group.calc.diff_note_same': 'La moneda esta igual respecto al momento del viaje.',
    'group.calc.footer': 'Este calculo es solo informativo. No modifica ningun dato.',
    'group.calc.empty': 'Este grupo no tiene gastos.',
    'group.calc.error': 'Error al calcular.',
    'group.calc.loading': 'Calculando...',

    // ---------- BALANCE / DEUDAS ----------
    'debt.settle': 'Saldar',
    'debt.settle_confirm': 'Confirmas que se pagaron {monto} {moneda}?',
    'debt.settle_error': 'Error al saldar: {mensaje}',
    'debt.someone': 'Alguien',
    'debt.user': 'Usuario',

    // ---------- HISTORIAL ----------
    'history.debt_settled': 'Deuda saldada',
    'history.paid_by': '{nombre} pago {monto} {moneda}',
    'history.paid_from_to': '{from} pago a {to} {monto} {moneda}',

    // ---------- GASTOS: MODAL CREAR ----------
    'expense.create.title': 'Nuevo Gasto',
    'expense.create.description': 'Que fue?',
    'expense.create.description_placeholder': 'Ej: Cena en el restaurante',
    'expense.create.amount': 'Monto',
    'expense.create.amount_placeholder': '0.00',
    'expense.create.group': 'Grupo',
    'expense.create.group_placeholder': 'Seleccionar grupo...',
    'expense.create.paid_by': 'Quien pago?',
    'expense.create.paid_by_placeholder': 'Seleccionar quien pago...',
    'expense.create.currency': 'Moneda',
    'expense.create.category': 'Categoria',
    'expense.create.split_type': 'Tipo de division:',
    'expense.create.split_equal': 'Partes iguales',
    'expense.create.split_percentage': 'Por porcentaje (%)',
    'expense.create.split_exact': 'Montos exactos',
    'expense.create.split_shares': 'Por partes (shares)',
    'expense.create.split_between': 'Dividir entre:',
    'expense.create.split_summary': 'Resumen de la division:',
    'expense.create.split_no_group': 'Selecciona un grupo para ver los miembros...',
    'expense.create.split_no_group_hint': 'Selecciona un grupo y ajusta los valores.',
    'expense.create.cancel': 'Cancelar',
    'expense.create.submit': 'Guardar Gasto',
    'expense.create.saving': 'Guardando...',
    'expense.create.success': 'Gasto guardado con exito!',
    'expense.create.error': 'Error: {mensaje}',
    'expense.create.no_members': 'Error al cargar miembros.',
    'expense.create.need_one': 'Selecciona al menos una persona.',
    'expense.create.need_group': 'Debes seleccionar al menos una persona para dividir.',
    'expense.create.equal_summary': '{monto} {moneda} por persona ({count} personas)',
    'expense.create.percent_sum': 'Los porcentajes suman {total}%, deberian sumar 100%.',
    'expense.create.percent_ok': 'OK. Suma 100%.',
    'expense.create.exact_sum': 'Suma {total} {moneda}, deberia sumar {esperado} {moneda}.',
    'expense.create.exact_ok': 'OK. Suma correcta.',
    'expense.create.shares_need': 'Asigna al menos una parte a alguien.',
    'expense.create.shares_line': '{shares} partes -> {monto} {moneda}',
    'expense.create.shares_ok': 'OK. Total: {total} partes.',
    'expense.create.percent_error': 'Los porcentajes suman {total}%, deben sumar 100%.',
    'expense.create.exact_error': 'Los montos suman {total}, deben sumar {esperado}.',
    'expense.create.shares_error': 'Debes asignar al menos una parte.',

    // ---------- GASTOS: LISTA ----------
    'expense.list.empty': 'No hay gastos aun. Anade el primero!',
    'expense.list.empty_filter': 'No hay gastos con esa categoria.',
    'expense.list.error': 'Error al cargar gastos.',
    'expense.list.paid_by': 'Pago: {nombre} - {fecha}',

    // ---------- GASTOS: DETALLE ----------
    'expense.detail.title': 'Detalle del Gasto',
    'expense.detail.loading': 'Cargando...',
    'expense.detail.error': 'Error al cargar el gasto.',
    'expense.detail.paid_by': 'Pago:',
    'expense.detail.split': 'Division:',
    'expense.detail.no_split': 'Sin divisiones.',
    'expense.detail.unknown': 'Desconocido',
    'expense.detail.archived_notice': 'Este gasto esta archivado y no forma parte de los calculos del grupo.',
    'expense.detail.edit': 'Editar',
    'expense.detail.archive': 'Archivar',
    'expense.detail.close': 'Cerrar',

    // ---------- GASTOS: ARCHIVAR ----------
    'expense.archive.confirm': 'Archivar este gasto? Dejara de formar parte de los calculos del grupo. Podes restaurarlo despues.',
    'expense.archive.need_close': 'Primero debes cerrar el computo del grupo para poder archivar gastos.',
    'expense.archive.error': 'Error al archivar: {mensaje}',
    'expense.archive.restore_confirm': 'Restaurar este gasto? Volvera a formar parte de los calculos del grupo.',
    'expense.archive.restore_error': 'Error al restaurar: {mensaje}',
    'expense.archive.badge_one': '{count} gasto archivado',
    'expense.archive.badge_many': '{count} gastos archivados',
    'expense.archive.badge_amount': '({monto} {moneda} no incluidos)',
    'expense.archive.archived_on': 'Archivado el {fecha}',
    'expense.archive.restore': 'Restaurar',
    'expense.archive.empty': 'No hay gastos archivados en este grupo.',
    'expense.archive.error_load': 'Error al cargar gastos archivados.',

    // ---------- GASTOS: EDITAR ----------
    'expense.edit.title': 'Editar Gasto',
    'expense.edit.description': 'Que fue?',
    'expense.edit.amount': 'Monto',
    'expense.edit.category': 'Categoria',
    'expense.edit.currency': 'Moneda',
    'expense.edit.paid_by': 'Quien pago?',
    'expense.edit.cancel': 'Cancelar',
    'expense.edit.submit': 'Guardar cambios',
    'expense.edit.saving': 'Guardando...',
    'expense.edit.error': 'Error: {mensaje}',
    'expense.edit.cant_archived': 'No se puede editar un gasto archivado. Restauralo primero.',

    // ---------- CATEGORIA: FILTRO ----------
    'category.filter.all': 'Todas las categorias'
  },

  en: {
    // ---------- INDEX ----------
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
    'dashboard.cat_filter_all': 'All categories',

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
    'cat.otros': 'Other',

    // ---------- GROUPS: CREATE MODAL ----------
    'group.create.title': 'Create New Group',
    'group.create.name': 'Group Name',
    'group.create.name_placeholder': 'Ex: Trip to Bariloche',
    'group.create.type': 'Type',
    'group.create.type.trip': 'Trip',
    'group.create.type.flat': 'Apartment',
    'group.create.type.outings': 'Outings',
    'group.create.type.other': 'Other',
    'group.create.currency': 'Currency',
    'group.create.date_start': 'Start date (optional)',
    'group.create.date_end': 'End date (optional)',
    'group.create.manual_rate': 'Manual exchange rate (optional)',
    'group.create.manual_rate_label': '1 {moneda} =',
    'group.create.manual_rate_currency': 'Group currency',
    'group.create.manual_rate_placeholder': 'Ex: 1200',
    'group.create.manual_rate_hint': 'If the rate is not available online, this will be used. If empty, it stays at 0.',
    'group.create.cancel': 'Cancel',
    'group.create.submit': 'Create Group',
    'group.create.creating': 'Creating...',
    'group.create.error': 'Error creating group: {mensaje}',
    'group.create.no_auth': 'User not authenticated',

    // ---------- GROUPS: LIST ----------
    'group.list.type_suffix': 'TYPE',
    'group.list.total': 'Total',
    'group.list.my_share': 'My share',
    'group.list.expenses_count': '{count} expenses',
    'group.list.badge_archived': 'Archived',
    'group.list.badge_closed': 'Closed',
    'group.list.dates_from': 'From {fecha}',
    'group.list.dates_until': 'Until {fecha}',
    'group.list.dates_range': '{inicio} - {fin}',

    // ---------- GROUPS: ACTIONS ----------
    'group.action.archive_title': 'Archive',
    'group.action.delete_title': 'Delete',
    'group.action.restore_title': 'Restore',
    'group.action.archive_confirm': 'Archive group "{nombre}"? You can see it from the "Archived" button.',
    'group.action.need_close_computo': 'You must first close the group\'s calculation before archiving it. Go to the group details and tap "Close calculation".',
    'group.action.delete_confirm': 'Delete group "{nombre}" and ALL its data? This action cannot be undone.',
    'group.action.archive_error': 'Error archiving: {mensaje}',
    'group.action.restore_error': 'Error restoring: {mensaje}',
    'group.action.delete_error': 'Error deleting group: {mensaje}',
    'group.action.load_error': 'Error: {mensaje}',
    'group.action.db_error': 'Could not connect to Supabase',

    // ---------- GROUPS: DETAIL ----------
    'group.detail.title': 'Group Details',
    'group.detail.total_final': 'Final total',
    'group.detail.total_trip': 'Trip total',
    'group.detail.my_part': 'My share',
    'group.detail.closed_on': 'Closed on {fecha}',
    'group.detail.manual_rate_badge': 'Manual rate',
    'group.detail.manual_rate_value': '1 {moneda} = {rate} USD',
    'group.detail.no_rate_badge': 'No automatic rate',
    'group.detail.no_rate_hint': 'Set a manual rate',
    'group.detail.balance': 'Balance',
    'group.detail.balance_loading': 'Calculating balances...',
    'group.detail.balance_empty': 'No activity yet.',
    'group.detail.balance_settled': 'All settled!',
    'group.detail.expenses_section': 'Expenses',
    'group.detail.expenses_add': '+ Add',
    'group.detail.expenses_loading': 'Loading expenses...',
    'group.detail.members_section': 'Members',
    'group.detail.members_add': '+ Add member',
    'group.detail.members_loading': 'Loading members...',
    'group.detail.members_error': 'Error loading members.',
    'group.detail.charts_by_person': 'Chart by person',
    'group.detail.charts_by_category': 'Chart by category',
    'group.detail.totals_by_category': 'Totals by category',
    'group.detail.no_data': 'No data.',
    'group.detail.history_section': 'History',
    'group.detail.history_loading': 'Loading history...',
    'group.detail.no_activity': 'No activity yet.',
    'group.detail.close': 'Close',
    'group.detail.add_member_title': 'Add member to ' group',
    'group.detail.add_member_hint': 'Select a friend to add to this group',
    'group.detail.add_member_loading': 'Loading friends...',
    'group.detail.add_member_no_friends': 'You have no friends yet. Add one from the "Friends" button.',
    'group.detail.add_member_all_in': 'All your friends are already in this group.',
    'group.detail.add_member_add': 'Add',
    'group.detail.add_member_already': 'That friend is already in the group.',
    'group.detail.add_member_error': 'Error adding: {mensaje}',

    // ---------- GROUPS: DETAIL BUTTONS ----------
    'group.btn.calc_today': 'Calculate in today\'s rate',
    'group.btn.edit_rate': 'Edit rate',
    'group.btn.close_computo': 'Close calculation',
    'group.btn.reopen_computo': 'Reopen',
    'group.btn.view_extras': 'View charts, totals and history',
    'group.btn.hide_extras':Hide charts and history',
    'group.btn.view_archived_expenses': 'View archived expenses',
    'group.btn.hide_archived_expenses': 'Hide archived expenses',

    // ---------- GROUPS: CLOSE/REOPEN ----------
    'group.computo.close_confirm': 'Close this group\'s calculation? The date and final total will be saved.',
    'group.computo.reopen_confirm': 'Reopen the calculation? The closing date and saved final total will be deleted.',
    'group.computo.close_error': 'Error closing calculation: {mensaje}',
    'group.computo.reopen_error': 'Error reopening calculation: {mensaje}',

    // ---------- GROUPS: MANUAL RATE ----------
    'group.rate.label': 'Manual rate',
    'group.rate.save': 'Save',
    'group.rate.cancel': 'Cancel',
    'group.rate.invalid': 'Enter a valid number.',
    'group.rate.save_error': 'Error saving: {mensaje}',
    'group.rate.no_auth': 'Not authenticated',

    // ---------- GROUPS: TODAY CALCULATOR ----------
    'group.calc.title': 'Today\'s calculator',
    'group.calc.group': 'Group: {nombre}',
    'group.calc.historic_label': 'Total spent (with rates at the time)',
    'group.calc.today_label': 'If you did it TODAY',
    'group.calc.diff_label': 'Difference',
    'group.calc.diff_note_up': 'The currency went up compared to the trip time.',
    'group.calc.diff_note_down': 'The currency went down compared to the trip time.',
    'group.calc.diff_note_same': 'The currency is the same as at the trip time.',
    'group.calc.footer': 'This calculation is informative only. It does not modify any data.',
    'group.calc.empty': 'This group has no expenses.',
    'group.calc.error': 'Error calculating.',
    'group.calc.loading': 'Calculating...',

    // ---------- BALANCE / DEBTS ----------
    'debt.settle': 'Settle',
    'debt.settle_confirm': 'Confirm that {monto} {moneda} was paid?',
    'debt.settle_error': 'Error settling: {mensaje}',
    'debt.someone': 'Someone',
    'debt.user': 'User',

    // ---------- HISTORY ----------
    'history.debt_settled': 'Debt settled',
    'history.paid_by': '{nombre} paid {monto} {moneda}',
    'history.paid_from_to': '{from} paid {to} {monto} {moneda}',

    // ---------- EXPENSES: CREATE MODAL ----------
    'expense.create.title': 'New Expense',
    'expense.create.description': 'What was it?',
    'expense.create.description_placeholder': 'Ex: Dinner at the restaurant',
    'expense.create.amount': 'Amount',
    'expense.create.amount_placeholder': '0.00',
    'expense.create.group': 'Group',
    'expense.create.group_placeholder': 'Select group...',
    'expense.create.paid_by': 'Who paid?',
    'expense.create.paid_by_placeholder': 'Select who paid...',
    'expense.create.currency': 'Currency',
    'expense.create.category': 'Category',
    'expense.create.split_type': 'Split type:',
    'expense.create.split_equal': 'Equal parts',
    'expense.create.split_percentage': 'By percentage (%)',
    'expense.create.split_exact': 'Exact amounts',
    'expense.create.split_shares': 'By shares',
    'expense.create.split_between': 'Split between:',
    'expense.create.split_summary': 'Split summary:',
    'expense.create.split_no_group': 'Select a group to see members...',
    'expense.create.split_no_group_hint': 'Select a group and adjust the values.',
    'expense.create.cancel': 'Cancel',
    'expense.create.submit': 'Save Expense',
    'expense.create.saving': 'Saving...',
    'expense.create.success': 'Expense saved successfully!',
    'expense.create.error': 'Error: {mensaje}',
    'expense.create.no_members': 'Error loading members.',
    'expense.create.need_one': 'Select at least one person.',
    'expense.create.need_group': 'You must select at least one person to split.',
    'expense.create.equal_summary': '{monto} {moneda} per person ({count} people)',
    'expense.create.percent_sum': 'Percentages add up to {total}%, they should add up to 100%.',
    'expense.create.percent_ok': 'OK. Adds up to 100%.',
    'expense.create.exact_sum': 'Adds up to {total} {moneda}, should add up to {esperado} {moneda}.',
    'expense.create.exact_ok': 'OK. Correct sum.',
    'expense.create.shares_need': 'Assign at least one share to someone.',
    'expense.create.shares_line': '{shares} shares -> {monto} {moneda}',
    'expense.create.shares_ok': 'OK. Total: {total} shares.',
    'expense.create.percent_error': 'Percentages add up to {total}%, they must add up to 100%.',
    'expense.create.exact_error': 'Amounts add up to {total}, they must add up to {esperado}.',
    'expense.create.shares_error': 'You must assign at least one share.',

    // ---------- EXPENSES: LIST ----------
    'expense.list.empty': 'No expenses yet. Add the first one!',
    'expense.list.empty_filter': 'No expenses with that category.',
    'expense.list.error': 'Error loading expenses.',
    'expense.list.paid_by': 'Paid: {nombre} - {fecha}',

    // ---------- EXPENSES: DETAIL ----------
    'expense.detail.title': 'Expense Details',
    'expense.detail.loading': 'Loading...',
    'expense.detail.error': 'Error loading expense.',
    'expense.detail.paid_by': 'Paid:',
    'expense.detail.split': 'Split:',
    'expense.detail.no_split': 'No splits.',
    'expense.detail.unknown': 'Unknown',
    'expense.detail.archived_notice': 'This expense is archived and is not part of the group\'s calculations.',
    'expense.detail.edit': 'Edit',
    'expense.detail.archive': 'Archive',
    'expense.detail.close': 'Close',

    // ---------- EXPENSES: ARCHIVE ----------
    'expense.archive.confirm': 'Archive this expense? It will stop being part of the group\'s calculations. You can restore it later.',
    'expense.archive.need_close': 'You must first close the group\'s calculation to archive expenses.',
    'expense.archive.error': 'Error archiving: {mensaje}',
    'expense.archive.restore_confirm': 'Restore this expense? It will be part of the group\'s calculations again.',
    'expense.archive.restore_error': 'Error restoring: {mensaje}',
    'expense.archive.badge_one': '{count} archived expense',
    'expense.archive.badge_many': '{count} archived expenses',
    'expense.archive.badge_amount': '({monto} {moneda} not included)',
    'expense.archive.archived_on': 'Archived on {fecha}',
    'expense.archive.restore': 'Restore',
    'expense.archive.empty': 'No archived expenses in this group.',
    'expense.archive.error_load': 'Error loading archived expenses.',

    // ---------- EXPENSES: EDIT ----------
    'expense.edit.title': 'Edit Expense',
    'expense.edit.description': 'What was it?',
    'expense.edit.amount': 'Amount',
    'expense.edit.category': 'Category',
    'expense.edit.currency': 'Currency',
    'expense.edit.paid_by': 'Who paid?',
    'expense.edit.cancel': 'Cancel',
    'expense.edit.submit': 'Save changes',
    'expense.edit.saving': 'Saving...',
    'expense.edit.error': 'Error: {mensaje}',
    'expense.edit.cant_archived': 'Cannot edit an archived expense. Restore it first.',

    // ---------- CATEGORY: FILTER ----------
    'category.filter.all': 'All categories'
  }
};

// ==========================================
// ESTADO
// ==========================================
let idiomaActual = 'en';

export function setIdioma(idioma) {
  idiomaActual = (idioma === 'es') ? 'es' : 'en';
  localStorage.setItem('pym_idioma', idiomaActual);
  document.documentElement.lang = idiomaActual;
}

export function getIdioma() {
  return idiomaActual;
}

export function t(clave, params = {}) {
  const textos = TRADUCCIONES[idiomaActual] || TRADUCCIONES.en;
  let texto = textos[clave] || TRADUCCIONES.en[clave] || clave;

  Object.entries(params).forEach(([k, v]) => {
    texto = texto.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });

  return texto;
}

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

export function detectarIdioma() {
  const guardado = localStorage.getItem('pym_idioma');
  if (guardado) return guardado;

  const navegador = (navigator.language || 'en').toLowerCase();
  return navegador.startsWith('es') ? 'es' : 'en';
}

export function initI18n() {
  const idioma = detectarIdioma();
  setIdioma(idioma);
  aplicarTraducciones();
  return idioma;
}

export function tCategoria(cat) {
  return t(`cat.${cat}`) || cat;
}

export function tMes(mesNumero) {
  const meses = {
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  const idioma = idiomaActual || 'en';
  return meses[idioma][mesNumero - 1] || '';
}
