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
    'dashboard.no_activity_range': 'No hay movimientos.',
    'dashboard.history_title': 'Historico por mes',
    'dashboard.history_subtitle': 'Ultimos 12 meses, convertidos a tu moneda preferida.',
    'dashboard.history_loading': 'Cargando historial...',
    'dashboard.history_empty': 'No hay datos historicos.',
    'dashboard.history_total_12m': 'Total 12 meses',
    'dashboard.history_month': 'Mes',
    'dashboard.history_expenses_count': '{count} gastos',
    'dashboard.close': 'Cerrar',

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
    'expense.create.shares_line': '{shares} partes, {monto} {moneda}',
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
    'category.filter.all': 'Todas las categorias',

    // ---------- AMIGOS ----------
    'friends.title': 'Gestion de Amigos',
    'friends.add_label': 'Agregar amigo por email',
    'friends.add_placeholder': 'amigo@email.com',
    'friends.add_button': 'Enviar',
    'friends.add_sending': '...',
    'friends.requests_title': 'Solicitudes Pendientes',
    'friends.requests_empty': 'No hay solicitudes pendientes.',
    'friends.requests_loading': 'Cargando...',
    'friends.list_title': 'Mis Amigos',
    'friends.list_empty': 'Aun no tienes amigos agregados.',
    'friends.list_loading': 'Cargando...',
    'friends.load_error': 'Error al cargar.',
    'friends.sent_to': 'Solicitud enviada a {nombre}!',
    'friends.user_not_found': 'No se encontro ningun usuario con ese email.',
    'friends.cant_add_self': 'No puedes agregarte a ti mismo.',
    'friends.already_friends': 'Ya son amigos.',
    'friends.already_pending': 'Ya hay una solicitud pendiente.',
    'friends.incoming_request': 'Te envio solicitud',
    'friends.outgoing_request': 'Solicitud enviada',
    'friends.pending_badge': 'Pendiente',
    'friends.accept': 'Aceptar',
    'friends.reject': 'Rechazar',
    'friends.accept_error': 'Error al aceptar: {mensaje}',
    'friends.reject_error': 'Error al rechazar: {mensaje}',
    'friends.close': 'Cerrar',

    // ---------- LIBRO DE VISITAS ----------
    'guestbook.loading': 'Cargando comentarios...',
    'guestbook.empty': 'Todavia no hay comentarios. Se el primero!',
    'guestbook.load_error': 'Error al cargar los comentarios.',
    'guestbook.placeholder': 'Escribi tu comentario...',
    'guestbook.max_chars': 'Maximo 500 caracteres',
    'guestbook.publish': 'Publicar',
    'guestbook.publishing': 'Publicando...',
    'guestbook.delete_confirm': 'Eliminar este comentario?',
    'guestbook.delete_error': 'Error al eliminar: {mensaje}',
    'guestbook.need_message': 'Escribi un mensaje.',
    'guestbook.too_long': 'El mensaje es demasiado largo (maximo 500 caracteres).',
    'guestbook.publish_error': 'Error: {mensaje}',
    'guestbook.user': 'Usuario',

    // ---------- MANUAL ----------
    'manual.title': 'Manual de uso',
    'manual.what_is.title': 'Que es PYM Split?',
    'manual.what_is.p1': 'PYM Split es una app para <strong>dividir gastos</strong> entre amigos, familia o companeros de piso. Cargas quien pago que, y la app calcula automaticamente <strong>quien le debe a quien</strong>. Ademas, <strong>simplifica las deudas</strong> para que se hagan la menor cantidad de transferencias posible.',

    'manual.s1.title': '1. Crear una cuenta',
    'manual.s1.p1': 'En la pantalla de inicio, toca <strong>"Crear cuenta"</strong>, completa tu nombre, email y una contrasena (minimo 6 caracteres). Listo, ya estas dentro.',
    'manual.s1.p2': 'Despues de registrarte, revisa tu email: puede que tengas que confirmar la cuenta antes de poder entrar.',

    'manual.s2.title': '2. Completar tu Perfil',
    'manual.s2.p1': 'Toca el boton <strong>"Perfil"</strong> arriba a la derecha. Ahi podes:',
    'manual.s2.li1': 'Editar tu <strong>nombre</strong>.',
    'manual.s2.li2': 'Agregar tu <strong>telefono</strong> (opcional).',
    'manual.s2.li3': 'Elegir tu <strong>moneda preferida</strong> (ej: MXN, EUR, ARS).',
    'manual.s2.li4': 'Elegir el <strong>idioma</strong> de la app (Espanol o Ingles).',
    'manual.s2.p2': 'La moneda preferida define en que moneda se muestran los totales del dashboard. Si viajas a otro pais, podes cambiarla cuando quieras.',

    'manual.s3.title': '3. Agregar amigos',
    'manual.s3.p1': 'Toca el boton <strong>"Amigos"</strong> arriba a la derecha.',
    'manual.s3.li1': 'Escribi el <strong>email</strong> de tu amigo y toca <strong>"Enviar"</strong>.',
    'manual.s3.li2': 'Tu amigo recibira una solicitud. Cuando la acepte, aparecera en tu lista.',
    'manual.s3.li3': 'Tambien podes aceptar o rechazar solicitudes que te lleguen.',
    'manual.s3.p2': '<strong>Ojo:</strong> tu amigo tiene que estar registrado con el mismo email que le pusiste.',

    'manual.s4.title': '4. Crear un grupo',
    'manual.s4.p1': 'En la pantalla principal, toca <strong>"+ Nuevo"</strong> arriba de "Mis Grupos".',
    'manual.s4.li1': '<strong>Nombre:</strong> ej. "Viaje a Cancun", "Depto", "Cena del viernes".',
    'manual.s4.li2': '<strong>Tipo:</strong> viaje, depto, salidas u otro.',
    'manual.s4.li3': '<strong>Moneda:</strong> la moneda principal del grupo.',
    'manual.s4.li4': '<strong>Fecha de inicio y fin (opcional):</strong> ideal para viajes.',
    'manual.s4.li5': '<strong>Cotizacion manual (opcional):</strong> si usas una moneda que no esta en la web.',
    'manual.s4.p2': 'Toca <strong>"Crear Grupo"</strong> y listo. Vos quedas como miembro automaticamente.',

    'manual.s5.title': '5. Agregar amigos al grupo',
    'manual.s5.p1': 'Abri el grupo (tocandolo en la lista) y toca <strong>"+ Anadir miembro"</strong>.',
    'manual.s5.p2': 'Selecciona uno de tus amigos de la lista. Ya esta dentro del grupo.',

    'manual.s6.title': '6. Cargar un gasto',
    'manual.s6.p1': 'Toca el boton <strong>"+"</strong> (abajo a la derecha).',
    'manual.s6.li1': '<strong>Que fue:</strong> ej. "Cena", "Taxi", "Supermercado".',
    'manual.s6.li2': '<strong>Monto:</strong> cuanto costo.',
    'manual.s6.li3': '<strong>Grupo:</strong> a que grupo pertenece.',
    'manual.s6.li4': '<strong>Quien pago:</strong> quien puso la plata.',
    'manual.s6.li5': '<strong>Moneda:</strong> en que moneda se pago.',
    'manual.s6.li6': '<strong>Categoria:</strong> comida, transporte, alojamiento, etc.',
    'manual.s6.li7': '<strong>Tipo de division:</strong> como se reparte.',
    'manual.s6.p2': 'Despues de guardar, el dashboard principal se actualiza automaticamente.',

    'manual.s7.title': '7. Tipos de division',
    'manual.s7.li1': '<strong>Partes iguales:</strong> se divide el total en partes iguales entre los seleccionados.',
    'manual.s7.li2': '<strong>Por porcentaje:</strong> a cada uno le asignas un %. Debe sumar 100%.',
    'manual.s7.li3': '<strong>Montos exactos:</strong> a cada uno le pones el monto exacto. Debe sumar el total.',
    'manual.s7.li4': '<strong>Por partes (shares):</strong> ej. uno tiene 2 partes y otro 1, entonces paga el doble.',
    'manual.s7.p1': 'Podes <strong>tildar o destildar</strong> personas en la lista para incluir o excluir del reparto.',

    'manual.s8.title': '8. Monedas multiples',
    'manual.s8.p1': 'Cada grupo tiene su <strong>moneda principal</strong> (ej: EUR, MXN, ARS). Pero podes cargar gastos en <strong>cualquier otra moneda</strong>. La app convierte automaticamente a la moneda del grupo.',
    'manual.s8.p2': '<strong>Ejemplo:</strong> un grupo en MXN, y un gasto pagado en EUR. La app guarda la tasa de cambio del momento y muestra el monto convertido a MXN.',
    'manual.s8.p3': 'En tu <strong>Perfil</strong> elegis tu moneda preferida, que es la que se usa en el dashboard global.',

    'manual.s9.title': '9. Cotizacion automatica y manual',
    'manual.s9.p1': 'La app intenta obtener la cotizacion de <strong>2 fuentes automaticas</strong>:',
    'manual.s9.li1': '<strong>Frankfurter</strong> (Banco Central Europeo): EUR, USD, MXN, BRL, CLP, etc.',
    'manual.s9.li2': '<strong>DolarAPI</strong> (Argentina): ARS, y otras monedas latinoamericanas.',
    'manual.s9.p2': 'Si la moneda no esta en ninguna de las 2, podes cargar una <strong>cotizacion manual</strong> al crear el grupo.',
    'manual.s9.p3': '<strong>Importante:</strong> la cotizacion manual se guarda siempre contra USD para que sea universal para todos los miembros del grupo.',

    'manual.s10.title': '10. Editar la cotizacion manual',
    'manual.s10.p1': 'Si un grupo tiene cotizacion manual, en el detalle aparece el boton <strong>"Editar cotizacion"</strong>.',
    'manual.s10.p2': 'Al tocarlo, podes cambiar el valor. El campo te muestra la cotizacion en <strong>tu moneda preferida</strong>, pero internamente se convierte a USD para guardarla.',

    'manual.s11.title': '11. Ver el balance del grupo',
    'manual.s11.p1': 'Al abrir un grupo, arriba de todo aparece el <strong>Balance</strong>. Ahi se muestra <strong>quien le debe a quien</strong> y cuanto, ya convertido a la moneda del grupo.',
    'manual.s11.p2': 'La app <strong>simplifica las deudas</strong>: si A le debe a B y B le debe a C, se muestra directamente que A le pague a C. Asi se hacen menos transferencias.',

    'manual.s12.title': '12. Total del viaje y Mi parte',
    'manual.s12.p1': 'En el detalle del grupo, arriba del balance, se muestran 2 numeros:',
    'manual.s12.li1': '<strong>Total del viaje:</strong> cuanto se gasto en total.',
    'manual.s12.li2': '<strong>Mi parte:</strong> cuanto te corresponde a vos segun las divisiones de cada gasto.',
    'manual.s12.p2': 'Si tu moneda preferida es distinta a la del grupo, se muestra tambien la conversion entre parentesis.',

    'manual.s13.title': '13. Calcular en moneda de hoy',
    'manual.s13.p1': 'En el detalle de un <strong>grupo archivado</strong>, toca <strong>"Calcular en moneda de hoy"</strong>. La app te muestra:',
    'manual.s13.li1': 'El total gastado con las <strong>tasas del momento</strong> en que se cargaron los gastos.',
    'manual.s13.li2': 'El total que costaria <strong>con las tasas de hoy</strong>.',
    'manual.s13.li3': 'La <strong>diferencia</strong> (cuanto subio o bajo).',
    'manual.s13.p2': 'Es solo informativo. <strong>No modifica ningun dato.</strong>',

    'manual.s14.title': '14. Cerrar el computo de un viaje',
    'manual.s14.p1': 'Cuando el viaje termina, toca <strong>"Cerrar computo"</strong>. La app guarda:',
    'manual.s14.li1': 'La <strong>fecha de cierre</strong> (automatica, no editable).',
    'manual.s14.li2': 'El <strong>total final</strong> del viaje en la moneda del grupo.',
    'manual.s14.p2': 'Si te equivocaste, podes tocar <strong>"Reabrir"</strong> para volver atras.',
    'manual.s14.p3': 'Esto te sirve para dejar "congelado" el resultado del viaje.',

    'manual.s15.title': '15. Saldar deudas',
    'manual.s15.p1': 'Cuando alguien ya pago por fuera (efectivo, transferencia, etc.), toca el boton <strong>"Saldar"</strong> al lado de la deuda.',
    'manual.s15.p2': 'Confirmas y el balance se actualiza automaticamente.',
    'manual.s15.p3': '<strong>Aclaracion:</strong> la app NO mueve plata. Solo registra que la deuda ya fue saldada.',

    'manual.s16.title': '16. Dashboard principal',
    'manual.s16.p1': 'La pantalla principal muestra:',
    'manual.s16.li1': '<strong>Tabs de rango:</strong> Grupos activos / Grupos archivados / Todos.',
    'manual.s16.li2': '<strong>3 tarjetas:</strong> Total gastado, Te deben, Debes (en tu moneda preferida).',
    'manual.s16.li3': '<strong>Ultimos movimientos:</strong> los 5 gastos mas recientes.',
    'manual.s16.li4': '<strong>Boton "Ver historico":</strong> abre el grafico + tabla de los ultimos 12 meses.',
    'manual.s16.p2': 'Todos los montos se convierten automaticamente a <strong>tu moneda preferida</strong>.',

    'manual.s17.title': '17. Historico por mes',
    'manual.s17.p1': 'Toca el boton <strong>"Ver historico"</strong> (arriba del dashboard, al lado de "Hola, tu nombre").',
    'manual.s17.p2': 'Se abre un modal con:',
    'manual.s17.li1': '<strong>Grafico de barras:</strong> cuanto se gasto cada mes.',
    'manual.s17.li2': '<strong>Tabla:</strong> mes, cantidad de gastos y total.',
    'manual.s17.li3': '<strong>Fila final:</strong> total de los ultimos 12 meses.',

    'manual.s18.title': '18. Historial y graficos del grupo',
    'manual.s18.p1': 'Dentro de cada grupo, mas abajo, vas a ver un boton <strong>"Ver graficos, totales e historial"</strong>. Al tocarlo se despliegan:',
    'manual.s18.li1': '<strong>Graficos:</strong> cuanto pago cada persona y cuanto se gasto por categoria.',
    'manual.s18.li2': '<strong>Totales por categoria:</strong> desglose de cuanto se gasto en comida, transporte, etc.',
    'manual.s18.li3': '<strong>Historial:</strong> todos los movimientos (gastos + pagos) ordenados por fecha.',
    'manual.s18.p2': 'Tocalo de nuevo para ocultarlos y ocupar menos espacio.',

    'manual.s19.title': '19. Filtros',
    'manual.s19.p1': 'En la lista de gastos de un grupo, podes filtrar por <strong>categoria</strong> para ver solo lo que te interesa (comida, transporte, etc.).',

    'manual.s20.title': '20. Editar o archivar un gasto',
    'manual.s20.p1': 'Toca cualquier gasto de la lista. Se abre el detalle, con 2 botones:',
    'manual.s20.li1': '<strong>Editar:</strong> cambia descripcion, monto, categoria, moneda o quien pago.',
    'manual.s20.li2': '<strong>Archivar:</strong> el gasto deja de formar parte de los calculos del grupo. Se puede restaurar despues.',
    'manual.s20.p2': 'Los gastos archivados aparecen en un boton especial <strong>"Ver gastos archivados"</strong>, desde donde podes restaurarlos.',

    'manual.s21.title': '21. Archivar y restaurar grupos',
    'manual.s21.p1': 'Cada grupo tiene un boton <strong>&#128230; (archivar)</strong>. Al tocarlo, el grupo desaparece de la lista principal pero <strong>NO se borra</strong>.',
    'manual.s21.p2': '<strong>Importante:</strong> para archivar un grupo primero tenes que <strong>cerrar el computo</strong>.',
    'manual.s21.p3': 'Para ver los grupos archivados, toca el boton <strong>"Archivados"</strong> arriba de la lista.',
    'manual.s21.p4': 'Ahi podes <strong>restaurarlos</strong> (boton &#8634;) o <strong>eliminarlos definitivamente</strong> (boton &#128465;).',

    'manual.s22.title': '22. Eliminar un grupo',
    'manual.s22.p1': 'Solo se puede eliminar un grupo <strong>despues de archivarlo</strong>. Esto evita borrar por error.',
    'manual.s22.p2': '<strong>Atencion:</strong> eliminar un grupo borra TODOS sus gastos, miembros, pagos e historial. <strong>No se puede deshacer.</strong>',
    'manual.s22.p3': 'Si queres conservar el historico, usa <strong>archivar</strong> en vez de eliminar.',

    'manual.s23.title': '23. Instalar como app en el celular',
    'manual.s23.ios_label': '<strong>iPhone (Safari):</strong>',
    'manual.s23.ios_li1': 'Abri la app.',
    'manual.s23.ios_li2': 'Toca el boton Compartir (flecha hacia arriba).',
    'manual.s23.ios_li3': 'Elegi "Anadir a pantalla de inicio".',
    'manual.s23.android_label': '<strong>Android (Chrome):</strong>',
    'manual.s23.android_li1': 'Abri la app.',
    'manual.s23.android_li2': 'Menu (3 puntos) - "Instalar app".',
    'manual.s23.p1': 'Se va a ver como una app normal, con su icono.'
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
    'dashboard.no_activity_range': 'No activity.',
    'dashboard.history_title': 'Monthly history',
    'dashboard.history_subtitle': 'Last 12 months, converted to your preferred currency.',
    'dashboard.history_loading': 'Loading history...',
    'dashboard.history_empty': 'No historical data.',
    'dashboard.history_total_12m': 'Total 12 months',
    'dashboard.history_month': 'Month',
    'dashboard.history_expenses_count': '{count} expenses',
    'dashboard.close': 'Close',

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
    'group.action.need_close_computo': 'You must first close the group calculation before archiving it. Go to the group details and tap "Close calculation".',
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
    'group.detail.add_member_title': 'Add member to group',
    'group.detail.add_member_hint': 'Select a friend to add to this group',
    'group.detail.add_member_loading': 'Loading friends...',
    'group.detail.add_member_no_friends': 'You have no friends yet. Add one from the "Friends" button.',
    'group.detail.add_member_all_in': 'All your friends are already in this group.',
    'group.detail.add_member_add': 'Add',
    'group.detail.add_member_already': 'That friend is already in the group.',
    'group.detail.add_member_error': 'Error adding: {mensaje}',

    // ---------- GROUPS: DETAIL BUTTONS ----------
    'group.btn.calc_today': 'Calculate in today rate',
    'group.btn.edit_rate': 'Edit rate',
    'group.btn.close_computo': 'Close calculation',
    'group.btn.reopen_computo': 'Reopen',
    'group.btn.view_extras': 'View charts, totals and history',
    'group.btn.hide_extras': 'Hide charts and history',
    'group.btn.view_archived_expenses': 'View archived expenses',
    'group.btn.hide_archived_expenses': 'Hide archived expenses',

    // ---------- GROUPS: CLOSE/REOPEN ----------
    'group.computo.close_confirm': 'Close this group calculation? The date and final total will be saved.',
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
    'group.calc.title': 'Today calculator',
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
    'expense.create.shares_line': '{shares} shares, {monto} {moneda}',
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
    'expense.detail.archived_notice': 'This expense is archived and is not part of the group calculations.',
    'expense.detail.edit': 'Edit',
    'expense.detail.archive': 'Archive',
    'expense.detail.close': 'Close',

    // ---------- EXPENSES: ARCHIVE ----------
    'expense.archive.confirm': 'Archive this expense? It will stop being part of the group calculations. You can restore it later.',
    'expense.archive.need_close': 'You must first close the group calculation to archive expenses.',
    'expense.archive.error': 'Error archiving: {mensaje}',
    'expense.archive.restore_confirm': 'Restore this expense? It will be part of the group calculations again.',
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
    'category.filter.all': 'All categories',

    // ---------- FRIENDS ----------
    'friends.title': 'Friends Management',
    'friends.add_label': 'Add friend by email',
    'friends.add_placeholder': 'friend@email.com',
    'friends.add_button': 'Send',
    'friends.add_sending': '...',
    'friends.requests_title': 'Pending Requests',
    'friends.requests_empty': 'No pending requests.',
    'friends.requests_loading': 'Loading...',
    'friends.list_title': 'My Friends',
    'friends.list_empty': 'You have no friends added yet.',
    'friends.list_loading': 'Loading...',
    'friends.load_error': 'Error loading.',
    'friends.sent_to': 'Request sent to {nombre}!',
    'friends.user_not_found': 'No user found with that email.',
    'friends.cant_add_self': 'You cannot add yourself.',
    'friends.already_friends': 'You are already friends.',
    'friends.already_pending': 'There is already a pending request.',
    'friends.incoming_request': 'Sent you a request',
    'friends.outgoing_request': 'Request sent',
    'friends.pending_badge': 'Pending',
    'friends.accept': 'Accept',
    'friends.reject': 'Reject',
    'friends.accept_error': 'Error accepting: {mensaje}',
    'friends.reject_error': 'Error rejecting: {mensaje}',
    'friends.close': 'Close',

    // ---------- GUESTBOOK ----------
    'guestbook.loading': 'Loading comments...',
    'guestbook.empty': 'No comments yet. Be the first!',
    'guestbook.load_error': 'Error loading comments.',
    'guestbook.placeholder': 'Write your comment...',
    'guestbook.max_chars': 'Maximum 500 characters',
    'guestbook.publish': 'Publish',
    'guestbook.publishing': 'Publishing...',
    'guestbook.delete_confirm': 'Delete this comment?',
    'guestbook.delete_error': 'Error deleting: {mensaje}',
    'guestbook.need_message': 'Write a message.',
    'guestbook.too_long': 'Message is too long (maximum 500 characters).',
    'guestbook.publish_error': 'Error: {mensaje}',
    'guestbook.user': 'User',

    // ---------- MANUAL ----------
    'manual.title': 'User manual',
    'manual.what_is.title': 'What is PYM Split?',
    'manual.what_is.p1': 'PYM Split is an app to <strong>split expenses</strong> among friends, family or roommates. You log who paid what, and the app automatically calculates <strong>who owes whom</strong>. It also <strong>simplifies debts</strong> so that as few transfers as possible are needed.',

    'manual.s1.title': '1. Create an account',
    'manual.s1.p1': 'On the home screen, tap <strong>"Create account"</strong>, fill in your name, email and a password (minimum 6 characters). Done, you are in.',
    'manual.s1.p2': 'After registering, check your email: you may need to confirm the account before you can sign in.',

    'manual.s2.title': '2. Complete your Profile',
    'manual.s2.p1': 'Tap the <strong>"Profile"</strong> button at the top right. There you can:',
    'manual.s2.li1': 'Edit your <strong>name</strong>.',
    'manual.s2.li2': 'Add your <strong>phone</strong> (optional).',
    'manual.s2.li3': 'Choose your <strong>preferred currency</strong> (e.g. MXN, EUR, ARS).',
    'manual.s2.li4': 'Choose the app <strong>language</strong> (Spanish or English).',
    'manual.s2.p2': 'The preferred currency defines the currency in which the dashboard totals are shown. If you travel to another country, you can change it anytime.',

    'manual.s3.title': '3. Add friends',
    'manual.s3.p1': 'Tap the <strong>"Friends"</strong> button at the top right.',
    'manual.s3.li1': 'Type your friend email and tap <strong>"Send"</strong>.',
    'manual.s3.li2': 'Your friend will receive a request. Once they accept it, they will appear in your list.',
    'manual.s3.li3': 'You can also accept or reject requests you receive.',
    'manual.s3.p2': '<strong>Note:</strong> your friend must be registered with the same email you typed.',

    'manual.s4.title': '4. Create a group',
    'manual.s4.p1': 'On the home screen, tap <strong>"+ New"</strong> above "My Groups".',
    'manual.s4.li1': '<strong>Name:</strong> e.g. "Trip to Cancun", "Apartment", "Friday dinner".',
    'manual.s4.li2': '<strong>Type:</strong> trip, apartment, outings or other.',
    'manual.s4.li3': '<strong>Currency:</strong> the group main currency.',
    'manual.s4.li4': '<strong>Start and end date (optional):</strong> ideal for trips.',
    'manual.s4.li5': '<strong>Manual rate (optional):</strong> if you use a currency not available online.',
    'manual.s4.p2': 'Tap <strong>"Create Group"</strong> and that is it. You become a member automatically.',

    'manual.s5.title': '5. Add friends to the group',
    'manual.s5.p1': 'Open the group (tap it in the list) and tap <strong>"+ Add member"</strong>.',
    'manual.s5.p2': 'Select one of your friends from the list. They are now in the group.',

    'manual.s6.title': '6. Add an expense',
    'manual.s6.p1': 'Tap the <strong>"+"</strong> button (bottom right).',
    'manual.s6.li1': '<strong>What was it:</strong> e.g. "Dinner", "Taxi", "Groceries".',
    'manual.s6.li2': '<strong>Amount:</strong> how much it cost.',
    'manual.s6.li3': '<strong>Group:</strong> which group it belongs to.',
    'manual.s6.li4': '<strong>Who paid:</strong> who put in the money.',
    'manual.s6.li5': '<strong>Currency:</strong> in which currency it was paid.',
    'manual.s6.li6': '<strong>Category:</strong> food, transport, accommodation, etc.',
    'manual.s6.li7': '<strong>Split type:</strong> how it is divided.',
    'manual.s6.p2': 'After saving, the main dashboard updates automatically.',

    'manual.s7.title': '7. Split types',
    'manual.s7.li1': '<strong>Equal parts:</strong> the total is divided equally among selected people.',
    'manual.s7.li2': '<strong>By percentage:</strong> you assign a % to each. It must add up to 100%.',
    'manual.s7.li3': '<strong>Exact amounts:</strong> you enter the exact amount for each. It must add up to the total.',
    'manual.s7.li4': '<strong>By shares:</strong> e.g. one has 2 shares and another 1, so they pay double.',
    'manual.s7.p1': 'You can <strong>check or uncheck</strong> people in the list to include or exclude them from the split.',

    'manual.s8.title': '8. Multiple currencies',
    'manual.s8.p1': 'Each group has its <strong>main currency</strong> (e.g. EUR, MXN, ARS). But you can add expenses in <strong>any other currency</strong>. The app converts automatically to the group currency.',
    'manual.s8.p2': '<strong>Example:</strong> a group in MXN, and an expense paid in EUR. The app saves the exchange rate at the moment and shows the converted amount in MXN.',
    'manual.s8.p3': 'In your <strong>Profile</strong> you choose your preferred currency, which is used in the global dashboard.',

    'manual.s9.title': '9. Automatic and manual rates',
    'manual.s9.p1': 'The app tries to get the rate from <strong>2 automatic sources</strong>:',
    'manual.s9.li1': '<strong>Frankfurter</strong> (European Central Bank): EUR, USD, MXN, BRL, CLP, etc.',
    'manual.s9.li2': '<strong>DolarAPI</strong> (Argentina): ARS, and other Latin American currencies.',
    'manual.s9.p2': 'If the currency is not in either of them, you can set a <strong>manual rate</strong> when creating the group.',
    'manual.s9.p3': '<strong>Important:</strong> the manual rate is always saved against USD so that it is universal for all group members.',

    'manual.s10.title': '10. Edit the manual rate',
    'manual.s10.p1': 'If a group has a manual rate, the <strong>"Edit rate"</strong> button appears in its details.',
    'manual.s10.p2': 'When you tap it, you can change the value. The field shows the rate in <strong>your preferred currency</strong>, but internally it is converted to USD to be saved.',

    'manual.s11.title': '11. View the group balance',
    'manual.s11.p1': 'When you open a group, the <strong>Balance</strong> appears at the top. There you can see <strong>who owes whom</strong> and how much, already converted to the group currency.',
    'manual.s11.p2': 'The app <strong>simplifies debts</strong>: if A owes B and B owes C, it directly shows that A pays C. This way fewer transfers are needed.',

    'manual.s12.title': '12. Trip total and My share',
    'manual.s12.p1': 'In the group details, above the balance, 2 numbers are shown:',
    'manual.s12.li1': '<strong>Trip total:</strong> how much was spent in total.',
    'manual.s12.li2': '<strong>My share:</strong> how much corresponds to you based on each expense split.',
    'manual.s12.p2': 'If your preferred currency differs from the group, the conversion is also shown in parentheses.',

    'manual.s13.title': '13. Calculate in today rate',
    'manual.s13.p1': 'In the details of an <strong>archived group</strong>, tap <strong>"Calculate in today rate"</strong>. The app shows you:',
    'manual.s13.li1': 'The total spent with the <strong>rates at the time</strong> the expenses were added.',
    'manual.s13.li2': 'The total it would cost <strong>with today rates</strong>.',
    'manual.s13.li3': 'The <strong>difference</strong> (how much it went up or down).',
    'manual.s13.p2': 'It is informative only. <strong>It does not modify any data.</strong>',

    'manual.s14.title': '14. Close the calculation of a trip',
    'manual.s14.p1': 'When the trip ends, tap <strong>"Close calculation"</strong>. The app saves:',
    'manual.s14.li1': 'The <strong>closing date</strong> (automatic, not editable).',
    'manual.s14.li2': 'The <strong>final total</strong> of the trip in the group currency.',
    'manual.s14.p2': 'If you made a mistake, you can tap <strong>"Reopen"</strong> to go back.',
    'manual.s14.p3': 'This is useful to leave the trip result "frozen".',

    'manual.s15.title': '15. Settle debts',
    'manual.s15.p1': 'When someone has already paid outside (cash, transfer, etc.), tap the <strong>"Settle"</strong> button next to the debt.',
    'manual.s15.p2': 'You confirm and the balance updates automatically.',
    'manual.s15.p3': '<strong>Note:</strong> the app does NOT move money. It only records that the debt has been settled.',

    'manual.s16.title': '16. Main dashboard',
    'manual.s16.p1': 'The home screen shows:',
    'manual.s16.li1': '<strong>Range tabs:</strong> Active groups / Archived groups / All.',
    'manual.s16.li2': '<strong>3 cards:</strong> Total spent, They owe you, You owe (in your preferred currency).',
    'manual.s16.li3': '<strong>Recent activity:</strong> the 5 most recent expenses.',
    'manual.s16.li4': '<strong>"See history" button:</strong> opens the chart + table of the last 12 months.',
    'manual.s16.p2': 'All amounts are automatically converted to <strong>your preferred currency</strong>.',

    'manual.s17.title': '17. Monthly history',
    'manual.s17.p1': 'Tap the <strong>"See history"</strong> button (above the dashboard, next to "Hi, your name").',
    'manual.s17.p2': 'A modal opens with:',
    'manual.s17.li1': '<strong>Bar chart:</strong> how much was spent each month.',
    'manual.s17.li2': '<strong>Table:</strong> month, number of expenses and total.',
    'manual.s17.li3': '<strong>Final row:</strong> total of the last 12 months.',

    'manual.s18.title': '18. Group history and charts',
    'manual.s18.p1': 'Inside each group, further down, you will see a <strong>"View charts, totals and history"</strong> button. When you tap it, the following unfolds:',
    'manual.s18.li1': '<strong>Charts:</strong> how much each person paid and how much was spent per category.',
    'manual.s18.li2': '<strong>Totals by category:</strong> breakdown of how much was spent on food, transport, etc.',
    'manual.s18.li3': '<strong>History:</strong> all movements (expenses + payments) sorted by date.',
    'manual.s18.p2': 'Tap it again to hide them and take up less space.',

    'manual.s19.title': '19. Filters',
    'manual.s19.p1': 'In the expense list of a group, you can filter by <strong>category</strong> to see only what interests you (food, transport, etc.).',

    'manual.s20.title': '20. Edit or archive an expense',
    'manual.s20.p1': 'Tap any expense in the list. The details open, with 2 buttons:',
    'manual.s20.li1': '<strong>Edit:</strong> change description, amount, category, currency or who paid.',
    'manual.s20.li2': '<strong>Archive:</strong> the expense stops being part of the group calculations. It can be restored later.',
    'manual.s20.p2': 'Archived expenses appear in a special <strong>"View archived expenses"</strong> button, from where you can restore them.',

    'manual.s21.title': '21. Archive and restore groups',
    'manual.s21.p1': 'Each group has a <strong>&#128230; (archive)</strong> button. When you tap it, the group disappears from the main list but is <strong>NOT deleted</strong>.',
    'manual.s21.p2': '<strong>Important:</strong> to archive a group you must first <strong>close its calculation</strong>.',
    'manual.s21.p3': 'To see archived groups, tap the <strong>"Archived"</strong> button above the list.',
    'manual.s21.p4': 'There you can <strong>restore</strong> them (&#8634; button) or <strong>permanently delete</strong> them (&#128465; button).',

    'manual.s22.title': '22. Delete a group',
    'manual.s22.p1': 'A group can only be deleted <strong>after archiving it</strong>. This prevents accidental deletion.',
    'manual.s22.p2': '<strong>Warning:</strong> deleting a group removes ALL its expenses, members, payments and history. <strong>It cannot be undone.</strong>',
    'manual.s22.p3': 'If you want to keep the history, use <strong>archive</strong> instead of delete.',

    'manual.s23.title': '23. Install as an app on your phone',
    'manual.s23.ios_label': '<strong>iPhone (Safari):</strong>',
    'manual.s23.ios_li1': 'Open the app.',
    'manual.s23.ios_li2': 'Tap the Share button (arrow up).',
    'manual.s23.ios_li3': 'Choose "Add to Home Screen".',
    'manual.s23.android_label': '<strong>Android (Chrome):</strong>',
    'manual.s23.android_li1': 'Open the app.',
    'manual.s23.android_li2': 'Menu (3 dots) - "Install app".',
    'manual.s23.p1': 'It will look like a normal app, with its icon.'
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
    texto = texto.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
  });

  return texto;
}

export function aplicarTraducciones(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
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
  return t('cat.' + cat) || cat;
}

export function tMes(mesNumero) {
  const meses = {
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  const idioma = idiomaActual || 'en';
  return meses[idioma][mesNumero - 1] || '';
}
