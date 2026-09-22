// js/groups.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR GRUPOS
// ==========================================
export async function cargarGrupos() {
  const groupsList = document.getElementById('groups-list');

  // Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Traemos los grupos donde el usuario es miembro.
  // Gracias a RLS, Supabase automÃ¡ticamente solo nos devuelve los grupos correctos.
  const { data: grupos, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando grupos:', error);
    groupsList.innerHTML = '<p class="error-msg">Error al cargar grupos.</p>';
    return;
  }

  if (grupos.length === 0) {
    groupsList.innerHTML = '<p class="placeholder-text">AÃºn no tienes grupos. Â¡Crea uno nuevo!</p>';
    return;
  }

  // Renderizar grupos
  groupsList.innerHTML = grupos.map(grupo => `
    <div class="group-card" data-id="${grupo.id}">
      <div class="group-info">
        <h4>${grupo.name}</h4>
        <span>${grupo.type.toUpperCase()} Â· ${grupo.currency}</span>
      </div>
      <div>â–¶</div>
    </div>
  `).join('');
}

// ==========================================
// 2. CREAR GRUPO
// ==========================================
export async function crearGrupo(nombre, tipo, moneda) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Insertar el grupo
  // IMPORTANTE: mandamos owner_id ADEMÃS de created_by.
  // Las polÃ­ticas RLS de INSERT/SELECT/UPDATE/DELETE de "groups"
  // estÃ¡n basadas en owner_id (auth.uid() = owner_id), asÃ­ que si
  // no se envÃ­a, la fila queda con owner_id = null y el INSERT
  // es rechazado por RLS aunque el resto de los datos sea correcto.
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([{
      name: nombre,
      type: tipo,
      currency: moneda,
      created_by: user.id,
      owner_id: user.id
    }])
    .select();

  if (groupError) throw groupError;

  // NOTA: ya NO insertamos manualmente en group_members.
  // El trigger "trg_add_creator_as_member" (AFTER INSERT en groups)
  // aÃ±ade automÃ¡ticamente al creador como miembro. Si lo hacÃ­amos
  // tambiÃ©n aquÃ­, chocaba con la primary key (group_id, user_id)
  // -> error "duplicate key value violates unique constraint
  // group_members_pkey".

  return groupData[0];
}

// ==========================================
// 3. MANEJO DEL MODAL
// ==========================================
export function initGroupModal() {
  const modal = document.getElementById('modal-group');
  const btnNew = document.getElementById('btn-new-group');
  const btnFab = document.getElementById('fab-add');
  const btnCancel = document.getElementById('btn-cancel-group');
  const form = document.getElementById('form-group');
  const errorMsg = document.getElementById('group-error');

  // Abrir modal
  const abrirModal = () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
  };

  btnNew.addEventListener('click', abrirModal);

  // Cerrar modal
  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Enviar formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Creando...';

    const nombre = document.getElementById('group-name').value.trim();
    const tipo = document.getElementById('group-type').value;
    const moneda = document.getElementById('group-currency').value;

    try {
      await crearGrupo(nombre, tipo, moneda);
      modal.classList.add('hidden');
      cargarGrupos(); // Recargar la lista
    } catch (error) {
      errorMsg.textContent = 'Error al crear el grupo: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Crear Grupo';
    }
  });
}
