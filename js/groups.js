// js/groups.js
import { supabase } from './supabase.js';

let mostrarArchivados = false;

// ==========================================
// 1. CARGAR GRUPOS
// ==========================================
export async function cargarGrupos() {
  const groupsList = document.getElementById('groups-list');
  const headerTitle = document.querySelector('#groups-section h3');
  const btnToggle = document.getElementById('btn-toggle-archived');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Usuario no autenticado');

    const { data: grupos, error } = await supabase
      .from('groups')
      .select('*')
      .eq('archived', mostrarArchivados)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (headerTitle) {
      headerTitle.textContent = mostrarArchivados ? 'Grupos Archivados' : 'Mis Grupos';
    }
    if (btnToggle) {
      btnToggle.textContent = mostrarArchivados ? 'Ver activos' : 'Archivados';
    }

    if (!grupos || grupos.length === 0) {
      groupsList.innerHTML = mostrarArchivados
        ? '<p class="placeholder-text">No tienes grupos archivados.</p>'
        : '<p class="placeholder-text">Aun no tienes grupos. Crea uno nuevo!</p>';
      return;
    }

    groupsList.innerHTML = grupos.map(grupo => `
      <div class="group-card ${grupo.archived ? 'archived' : ''}" data-id="${grupo.id}">
        <div class="group-info">
          <h4>${grupo.name}</h4>
          <span>${(grupo.type || 'otro').toUpperCase()} / ${grupo.currency || 'EUR'}</span>
          ${grupo.archived ? '<span class="badge-archived">Archivado</span>' : ''}
        </div>
        <div class="group-actions">
          ${grupo.archived 
            ? `<button class="btn-small btn-restore" data-id="${grupo.id}" title="Restaurar">&#8634;</button>` 
            : `<button class="btn-small btn-archive" data-id="${grupo.id}" title="Archivar">&#128230;</button>`
          }
          <span class="group-arrow">></span>
        </div>
      </div>
    `).join('');

    // Listener: abrir detalle
    groupsList.querySelectorAll('.group-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-archive') || e.target.closest('.btn-restore')) return;
        abrirDetalleGrupo(card.dataset.id);
      });
    });

    // Listener: archivar
    groupsList.querySelectorAll('.btn-archive').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Archivar este grupo? No se mostrara en la lista principal.')) return;
        await archivarGrupo(btn.dataset.id, true);
        await cargarGrupos();
      });
    });

    // Listener: restaurar
    groupsList.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await archivarGrupo(btn.dataset.id, false);
        await cargarGrupos();
      });
    });

  } catch (error) {
    console.error('Error detallado:', error);
    groupsList.innerHTML = `<p class="error-msg">Error: ${error.message || 'No se pudo conectar con Supabase'}</p>`;
  }
}

// ==========================================
// 2. ARCHIVAR / DESARCHIVAR GRUPO
// ==========================================
export async function archivarGrupo(groupId, archivar) {
  const { error } = await supabase
    .from('groups')
    .update({ archived: archivar })
    .eq('id', groupId);

  if (error) {
    alert('Error al ' + (archivar ? 'archivar' : 'restaurar') + ': ' + error.message);
    throw error;
  }
}

// ==========================================
// 3. TOGGLE ARCHIVADOS
// ==========================================
export function toggleArchivados() {
  mostrarArchivados = !mostrarArchivados;
  cargarGrupos();
}

// ==========================================
// 4. CREAR GRUPO
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
      created_by: user.id,
      owner_id: user.id
    }])
    .select()
    .single();

  if (groupError) throw groupError;

  return groupData;
}

// ==========================================
// 5. MODAL CREAR GRUPO
// ==========================================
export function initGroupModal() {
  const modal = document.getElementById('modal-group');
  const btnNew = document.getElementById('btn-new-group');
  const btnCancel = document.getElementById('btn-cancel-group');
  const form = document.getElementById('form-group');
  const errorMsg = document.getElementById('group-error');

  btnNew?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
  });

  btnCancel?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  form?.addEventListener('submit', async (e) => {
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
// 6. INICIALIZAR BOTON "ARCHIVADOS"
// ==========================================
export function initArchivedToggle() {
  const btn = document.getElementById('btn-toggle-archived');
  btn?.addEventListener('click', () => {
    toggleArchivados();
  });
}

// ==========================================
// 7. ABRIR DETALLE DEL GRUPO
// ==========================================
async function abrirDetalleGrupo(groupId) {
  const { cargarGastosDelGrupo } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');
  const { cargarMiembrosDelGrupo } = await import('./members.js');
  const { cargarHistorial } = await import('./history.js');
  const { cargarGraficos } = await import('./charts.js');

  const modal = document.getElementById('modal-group-detail');

  const { data: grupo } = await supabase
    .from('groups')
    .select('name, archived')
    .eq('id', groupId)
    .single();

  document.getElementById('detail-group-name').textContent = grupo ? grupo.name : 'Detalle';
  modal.dataset.groupId = groupId;

  modal.classList.remove('hidden');
  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
  await cargarMiembrosDelGrupo(groupId);
  await cargarHistorial(groupId);
  await cargarGraficos(groupId);
}

// ==========================================
// 8. LISTENERS GLOBALES DEL DETALLE
// ==========================================
if (!window.__groupDetailListenersAttached) {
  window.__groupDetailListenersAttached = true;

  document.getElementById('btn-close-detail')?.addEventListener('click', () => {
    document.getElementById('modal-group-detail').classList.add('hidden');
  });

  document.getElementById('modal-group-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-group-detail') e.target.classList.add('hidden');
  });

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

  document.getElementById('btn-close-expense-detail')?.addEventListener('click', () => {
    document.getElementById('modal-expense-detail').classList.add('hidden');
  });

  document.getElementById('modal-expense-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-expense-detail') e.target.classList.add('hidden');
  });

  document.getElementById('btn-delete-expense')?.addEventListener('click', async () => {
    const { eliminarGasto } = await import('./expenses.js');
    await eliminarGasto();
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (groupId) {
      const { cargarHistorial } = await import('./history.js');
      const { cargarGraficos } = await import('./charts.js');
      await cargarHistorial(groupId);
      await cargarGraficos(groupId);
    }
  });

  document.getElementById('btn-edit-expense')?.addEventListener('click', async () => {
    const { cargarGastoParaEditar } = await import('./expenses.js');
    await cargarGastoParaEditar();
  });

  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    document.getElementById('modal-expense-edit').classList.add('hidden');
  });

  document.getElementById('modal-expense-edit')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-expense-edit') e.target.classList.add('hidden');
  });

  document.getElementById('form-expense-edit')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { guardarEdicionGasto } = await import('./expenses.js');
    await guardarEdicionGasto();
  });
}
