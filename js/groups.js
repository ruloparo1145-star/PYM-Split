// js/groups.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR GRUPOS
// ==========================================
export async function cargarGrupos() {
  const groupsList = document.getElementById('groups-list');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: grupos, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!grupos || grupos.length === 0) {
      groupsList.innerHTML = '<p class="placeholder-text">AÃºn no tienes grupos. Â¡Crea uno nuevo!</p>';
      return;
    }

    groupsList.innerHTML = grupos.map(grupo => `
      <div class="group-card" data-id="${grupo.id}">
        <div class="group-info">
          <h4>${grupo.name}</h4>
          <span>${grupo.type.toUpperCase()} Â· ${grupo.currency}</span>
        </div>
        <div>â–¶</div>
      </div>
    `).join('');

    // Hacer clicables los grupos para ver el detalle
    document.querySelectorAll('.group-card').forEach(card => {
      card.addEventListener('click', () => {
        const groupId = card.dataset.id;
        abrirDetalleGrupo(groupId);
      });
    });

  } catch (error) {
    console.error('Error detallado:', error);
    groupsList.innerHTML = `<p class="error-msg">Error: ${error.message || 'No se pudo conectar con Supabase'}</p>`;
  }
}

// ==========================================
// 2. CREAR GRUPO
// ==========================================
export async function crearGrupo(nombre, tipo, moneda) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Insertar el grupo
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([{
      name: nombre,
      type: tipo,
      currency: moneda,
      created_by: user.id
    }])
    .select();

  if (groupError) throw groupError;

  const nuevoGrupoId = groupData[0].id;

  // 2. AÃ±adir al creador como miembro del grupo
  const { error: memberError } = await supabase
    .from('group_members')
    .insert([{
      group_id: nuevoGrupoId,
      user_id: user.id
    }]);

  if (memberError) throw memberError;

  return groupData[0];
}

// ==========================================
// 3. MANEJO DEL MODAL DE CREAR GRUPO
// ==========================================
export function initGroupModal() {
  const modal = document.getElementById('modal-group');
  const btnNew = document.getElementById('btn-new-group');
  const btnCancel = document.getElementById('btn-cancel-group');
  const form = document.getElementById('form-group');
  const errorMsg = document.getElementById('group-error');

  // Solo el botÃ³n "+ Nuevo" abre el modal de crear grupo
  // El botÃ³n flotante "+" ya NO abre este modal (ahora es para gastos)
  btnNew.addEventListener('click', () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Cerrar al hacer clic fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
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
      await cargarGrupos();
    } catch (error) {
      errorMsg.textContent = 'Error al crear el grupo: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Crear Grupo';
    }
  });
}

// ==========================================
// 4. ABRIR DETALLE DEL GRUPO
// ==========================================
async function abrirDetalleGrupo(groupId) {
  const { cargarGastosDelGrupo } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');
  const modal = document.getElementById('modal-group-detail');
  
  // Obtener nombre del grupo
  const { data: grupo } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single();

  document.getElementById('detail-group-name').textContent = grupo?.name || 'Detalle';

  // Guardar el groupId para usarlo en el botÃ³n de aÃ±adir gasto
  modal.dataset.groupId = groupId;

  modal.classList.remove('hidden');
  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
}

// ==========================================
// 5. CERRAR DETALLE DEL GRUPO
// ==========================================
// Se ejecuta una sola vez al cargar el script
if (!window.__groupDetailListenersAttached) {
  window.__groupDetailListenersAttached = true;

  // BotÃ³n cerrar
  document.getElementById('btn-close-detail')?.addEventListener('click', () => {
    document.getElementById('modal-group-detail').classList.add('hidden');
  });

  // Cerrar al hacer clic fuera del modal
  document.getElementById('modal-group-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-group-detail') {
      e.target.classList.add('hidden');
    }
  });

  // BotÃ³n de aÃ±adir gasto desde el detalle
  document.getElementById('btn-add-expense-from-detail')?.addEventListener('click', () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    document.getElementById('modal-group-detail').classList.add('hidden');
    
    // Abrir modal de gasto con ese grupo preseleccionado
    document.getElementById('fab-add').click();
    
    // Preseleccionar el grupo (con un pequeÃ±o delay para que cargue el select)
    setTimeout(() => {
      const select = document.getElementById('expense-group');
      if (select) {
        select.value = groupId;
        select.dispatchEvent(new Event('change'));
      }
    }, 300);
  });
}
