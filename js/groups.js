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
      groupsList.innerHTML = '<p class="placeholder-text">Aún no tienes grupos. ¡Crea uno nuevo!</p>';
      return;
    }

    groupsList.innerHTML = grupos.map(grupo => `
      <div class="group-card" data-id="${grupo.id}">
        <div class="group-info">
          <h4>${grupo.name}</h4>
          <span>${grupo.type.toUpperCase()} · ${grupo.currency}</span>
        </div>
        <div>▶</div>
      </div>
    `).join('');

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

  btnNew.addEventListener('click', () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

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
   { mostrarBalance } = await import('./debtSolver.js');
  const { cargarMiembrosDelGrupo } = await import('./members.js');
  const { cargarHistorial } = await import('./history.js'); // <-- NUEVO

  const modal = docuconst { cargarGastosDelGrupo } = await import('./expenses.js');
  constment.getElementById('modal-group-detail'); 
  const { data: grupo } = await supabase
    .from('groups')
    .select('name')
    .eq('id', groupId)
    .single();
  document.getElementById('detail-group-name').textContent = grupo?.name || 'Detalle';
  modal.dataset.groupId = groupId;
  modal.classList.remove('hidden');
  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
  await cargarMiembrosDelGrupo(groupId);
  await cargarHistorial(groupId); // <-- NUEVO
}

// ==========================================
// 5. LISTENERS GLOBALES (detalle grupo, detalle gasto, editar, eliminar)
// ==========================================
if (!window.__groupDetailListenersAttached) {
  window.__groupDetailListenersAttached = true;

  // Cerrar detalle del grupo
  document.getElementById('btn-close-detail')?.addEventListener('click', () => {
    document.getElementById('modal-group-detail').classList.add('hidden');
  });

  document.getElementById('modal-group-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-group-detail') {
      e.target.classList.add('hidden');
    }
  });

  // Añadir gasto desde el detalle
  document.getElementById('btn-add-expense-from-detail')?.addEventListener('click', () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    document.getElementById('modal-group-detail').classList.add('hidden');
    
    document.getElementById('fab-add').click();
    
    setTimeout(() => {
      const select = document.getElementById('expense-group');
      if (select) {
        select.value = groupId;
        select.dispatchEvent(new Event('change'));
      }
    }, 300);
  });

  // ============ LISTENERS DEL DETALLE DEL GASTO ============
  
  // Cerrar detalle del gasto
  document.getElementById('btn-close-expense-detail')?.addEventListener('click', () => {
    document.getElementById('modal-expense-detail').classList.add('hidden');
  });

  document.getElementById('modal-expense-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-expense-detail') {
      e.target.classList.add('hidden');
    }
  });

  // Eliminar gasto
  document.getElementById('btn-delete-expense')?.addEventListener('click', async () => {
    const { eliminarGasto } = await import('./expenses.js');
    await eliminarGasto();
  });

  // Editar gasto (cargar datos en el modal)
  document.getElementById('btn-edit-expense')?.addEventListener('click', async () => {
    const { cargarGastoParaEditar } = await import('./expenses.js');
    await cargarGastoParaEditar();
  });

  // Cancelar edición
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    document.getElementById('modal-expense-edit').classList.add('hidden');
  });

  document.getElementById('modal-expense-edit')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-expense-edit') {
      e.target.classList.add('hidden');
    }
  });

  // Guardar cambios de edición
  document.getElementById('form-expense-edit')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { guardarEdicionGasto } = await import('./expenses.js');
    await guardarEdicionGasto();
  });
}
