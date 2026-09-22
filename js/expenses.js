// js/expenses.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR GRUPOS PARA EL SELECT
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
// 2. CARGAR MIEMBROS DEL GRUPO
// ==========================================
export async function cargarMiembrosDelGrupo(groupId) {
  const splitList = document.getElementById('expense-split-members');
  const selectPaidBy = document.getElementById('expense-paid-by');
  
  if (!groupId) {
    splitList.innerHTML = '<p class="placeholder-text" style="padding: 10px 0;">Selecciona un grupo para ver los miembros...</p>';
    selectPaidBy.innerHTML = '<option value="">Seleccionar quién pagó...</option>';
    return;
  }

  const { data: miembros, error } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('group_id', groupId);

  if (error || !miembros) {
    splitList.innerHTML = '<p class="error-msg">Error al cargar miembros.</p>';
    return;
  }

  selectPaidBy.innerHTML = '<option value="">Seleccionar quién pagó...</option>' +
    miembros.map(m => `<option value="${m.user_id}">${m.profiles.full_name || m.profiles.email}</option>`).join('');

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

  const checkboxes = document.querySelectorAll('#expense-split-members input[type="checkbox"]:checked');
  const usuariosSplit = Array.from(checkboxes).map(cb => cb.value);

  if (usuariosSplit.length === 0) {
    throw new Error('Debes seleccionar al menos una persona para dividir.');
  }

  const montoPorPersona = parseFloat((monto / usuariosSplit.length).toFixed(2));

  const { data: gasto, error: gastoError } = await supabase
    .from('expenses')
    .insert([{
      group_id: groupId,
      description: descripcion,
      amount: monto,
      paid_by: paidBy,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();

  if (gastoError) throw gastoError;

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
// 4. CARGAR GASTOS DE UN GRUPO
// ==========================================
export async function cargarGastosDelGrupo(groupId) {
  const listContainer = document.getElementById('group-expenses-list');
  
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, currency, date,
      payer:profiles!expenses_paid_by_fkey(id, full_name, email)
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    listContainer.innerHTML = '<p class="error-msg">Error al cargar gastos.</p>';
    return;
  }

  if (!gastos || gastos.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No hay gastos aún. ¡Añade el primero!</p>';
    return;
  }

  listContainer.innerHTML = gastos.map(g => `
    <div class="expense-card">
      <div class="expense-info">
        <h5>${g.description}</h5>
        <span>Pagó: ${g.payer?.full_name || g.payer?.email || 'Desconocido'} · ${g.date}</span>
      </div>
      <div class="expense-amount">
        ${parseFloat(g.amount).toFixed(2)} ${g.currency}
      </div>
    </div>
  `).join('');
}

// ==========================================
// 5. INICIALIZAR MODAL DE GASTO
// ==========================================
export function initExpenseModal() {
  const modal = document.getElementById('modal-expense');
  const btnFab = document.getElementById('fab-add');
  const btnCancel = document.getElementById('btn-cancel-expense');
  const form = document.getElementById('form-expense');
  const errorMsg = document.getElementById('expense-error');
  const selectGrupo = document.getElementById('expense-group');

  btnFab.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
    await cargarGruposParaGasto();
    document.getElementById('expense-split-members').innerHTML = 
      '<p class="placeholder-text" style="padding: 10px 0;">Selecciona un grupo para ver los miembros...</p>';
    document.getElementById('expense-paid-by').innerHTML = '<option value="">Seleccionar quién pagó...</option>';
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  selectGrupo.addEventListener('change', (e) => {
    cargarMiembrosDelGrupo(e.target.value);
  });

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
      alert('¡Gasto guardado con éxito!');
    } catch (error) {
      errorMsg.textContent = 'Error: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Guardar Gasto';
    }
  });
}
