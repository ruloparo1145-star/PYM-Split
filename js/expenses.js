// js/expenses.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR DATOS PARA LOS SELECTS
// ==========================================
export async function cargarGruposParaGasto() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: grupos } = await supabase
    .from('groups')
    .select('id, name')
    .order('name');

  const selectGrupo = document.getElementById('expense-group');
  selectGrupo.innerHTML = '<option value="">Seleccionar grupo...</option>' + 
    (grupos || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

// ==========================================
// 2. CARGAR MIEMBROS DEL GRUPO Y EL "PAGADOR"
// ==========================================
export async function cargarMiembrosDelGrupo(groupId) {
  const splitList = document.getElementById('expense-split-members');
  const selectPaidBy = document.getElementById('expense-paid-by');
  
  if (!groupId) {
    splitList.innerHTML = '<p class="placeholder-text" style="padding: 10px 0;">Selecciona un grupo para ver los miembros...</p>';
    selectPaidBy.innerHTML = '<option value="">Seleccionar quiÃ©n pagÃ³...</option>';
    return;
  }

  // Traer miembros del grupo con sus perfiles
  const { data: miembros, error } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('group_id', groupId);

  if (error || !miembros) {
    splitList.innerHTML = '<p class="error-msg">Error al cargar miembros.</p>';
    return;
  }

  // Llenar el select de "Â¿QuiÃ©n pagÃ³?"
  selectPaidBy.innerHTML = '<option value="">Seleccionar quiÃ©n pagÃ³...</option>' +
    miembros.map(m => `<option value="${m.user_id}">${m.profiles.full_name || m.profiles.email}</option>`).join('');

  // Llenar la lista de checkboxes de "Dividir entre"
  splitList.innerHTML = miembros.map(m => `
    <label class="split-member">
      <input type="checkbox" value="${m.user_id}" checked>
      <span>${m.profiles.full_name || m.profiles.email}</span>
    </label>
  `).join('');
}

// ==========================================
// 3. GUARDAR GASTO
// ==========================================
export async function guardarGasto(descripcion, monto, groupId, paidBy) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Obtener los IDs de los seleccionados para dividir
  const checkboxes = document.querySelectorAll('#expense-split-members input[type="checkbox"]:checked');
  const usuariosSplit = Array.from(checkboxes).map(cb => cb.value);

  if (usuariosSplit.length === 0) {
    throw new Error('Debes seleccionar al menos una persona para dividir.');
  }

  // Calcular el monto por persona (divisiÃ³n equitativa)
  const montoPorPersona = parseFloat((monto / usuariosSplit.length).toFixed(2));

  // 1. Insertar el gasto
  const { data: gasto, error: gastoError } = await supabase
    .from('expenses')
    .insert([{
      group_id: groupId,
      description: descripcion,
      amount: monto,
      paid_by: paidBy,
      currency: 'EUR', // Por ahora fijo
      date: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();

  if (gastoError) throw gastoError;

  // 2. Insertar las divisiones
  const splits = usuariosSplit.map(userId => ({
    expense_id: gasto.id,
    user_id: userId,
    amount_owed: montoPorPersona,
    split_type: 'equal'
  }));

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splits);

  if (splitsError) throw splitsError;

  return gasto;
}

// ==========================================
// 4. INICIALIZAR MODAL DE GASTO
// ==========================================
export function initExpenseModal() {
  const modal = document.getElementById('modal-expense');
  const btnFab = document.getElementById('fab-add');
  const btnCancel = document.getElementById('btn-cancel-expense');
  const form = document.getElementById('form-expense');
  const errorMsg = document.getElementById('expense-error');
  const selectGrupo = document.getElementById('expense-group');

  // El botÃ³n FAB abre el modal de gasto ahora
  btnFab.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
    await cargarGruposParaGasto();
    document.getElementById('expense-split-members').innerHTML = 
      '<p class="placeholder-text" style="padding: 10px 0;">Selecciona un grupo para ver los miembros...</p>';
    document.getElementById('expense-paid-by').innerHTML = '<option value="">Seleccionar quiÃ©n pagÃ³...</option>';
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Al cambiar el grupo, cargar los miembros
  selectGrupo.addEventListener('change', (e) => {
    cargarMiembrosDelGrupo(e.target.value);
  });

  // Enviar formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';

    const descripcion = document.getElementById('expense-description').value.trim();
    const monto = parseFloat(document.getElementById('expense-amount').value);
    const groupId = document.getElementById('expense-group').value;
    const paidBy = document.getElementById('expense-paid-by').value;

    try {
      await guardarGasto(descripcion, monto, groupId, paidBy);
      modal.classList.add('hidden');
      alert('Â¡Gasto guardado con Ã©xito!');
    } catch (error) {
      errorMsg.textContent = 'Error: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Guardar Gasto';
    }
  });
}
