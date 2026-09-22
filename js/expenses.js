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
    document.getElementById('split-summary').innerHTML = '<p>Selecciona un grupo y ajusta los valores.</p>';
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

  // Renderizar según el tipo de división
  renderizarSplitInputs(miembros);
}

// ==========================================
// 3. RENDERIZAR INPUTS SEGÚN TIPO DE DIVISIÓN
// ==========================================
function renderizarSplitInputs(miembros, preserveValues = {}) {
  const splitList = document.getElementById('expense-split-members');
  const splitType = document.getElementById('split-type').value;

  splitList.innerHTML = miembros.map(m => {
    const userId = m.user_id;
    const nombre = m.profiles.full_name || m.profiles.email;
    const valorActual = preserveValues[userId] || '';

    let extraInput = '';
    if (splitType === 'percentage') {
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="%" step="0.01" min="0" max="100" value="${valorActual}" style="width: 80px;">`;
    } else if (splitType === 'exact') {
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="€" step="0.01" min="0" value="${valorActual}" style="width: 90px;">`;
    } else if (splitType === 'shares') {
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="partes" step="1" min="0" value="${valorActual}" style="width: 80px;">`;
    }

    return `
      <div class="split-member">
        <input type="checkbox" class="split-checkbox" value="${userId}" checked>
        <span style="flex: 1;">${nombre}</span>
        ${extraInput}
      </div>
    `;
  }).join('');

  // Listeners para recalcular el resumen
  document.querySelectorAll('.split-value').forEach(input => {
    input.addEventListener('input', actualizarResumenSplit);
  });
  document.querySelectorAll('.split-checkbox').forEach(cb => {
    cb.addEventListener('change', actualizarResumenSplit);
  });

  actualizarResumenSplit();
}

// ==========================================
// 4. ACTUALIZAR RESUMEN EN TIEMPO REAL
// ==========================================
function actualizarResumenSplit() {
  const summary = document.getElementById('split-summary');
  const monto = parseFloat(document.getElementById('expense-amount').value) || 0;
  const splitType = document.getElementById('split-type').value;

  const checkboxes = document.querySelectorAll('#expense-split-members .split-checkbox:checked');
  if (checkboxes.length === 0) {
    summary.innerHTML = '<p style="color: #e53e3e;">Selecciona al menos una persona.</p>';
    return;
  }

  if (splitType === 'equal') {
    const montoPorPersona = (monto / checkboxes.length).toFixed(2);
    summary.innerHTML = `<p><strong>${montoPorPersona} €</strong> por persona (${checkboxes.length} personas)</p>`;
    return;
  }

  if (splitType === 'percentage') {
    let total = 0;
    const lineas = [];
    checkboxes.forEach(cb => {
      const input = document.querySelector(`.split-value[data-user="${cb.value}"]`);
      const pct = parseFloat(input?.value) || 0;
      total += pct;
      const montoPct = (monto * pct / 100).toFixed(2);
      lineas.push(`<p>${pct}% → <strong>${montoPct} €</strong></p>`);
    });
    const aviso = Math.abs(total - 100) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">⚠️ Los porcentajes suman ${total.toFixed(2)}%, deberían sumar 100%.</p>` 
      : '<p style="color: #38a169; margin-top: 5px;">✅ Suma 100%.</p>';
    summary.innerHTML = lineas.join('') + aviso;
    return;
  }

  if (splitType === 'exact') {
    let total = 0;
    const lineas = [];
    checkboxes.forEach(cb => {
      const input = document.querySelector(`.split-value[data-user="${cb.value}"]`);
      const val = parseFloat(input?.value) || 0;
      total += val;
      lineas.push(`<p>${val.toFixed(2)} €</p>`);
    });
    const aviso = Math.abs(total - monto) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">⚠️ Suma ${total.toFixed(2)} €, debería sumar ${monto.toFixed(2)} €.</p>` 
      : '<p style="color: #38a169; margin-top: 5px;">✅ Suma correcta.</p>';
    summary.innerHTML = lineas.join('') + aviso;
    return;
  }

  if (splitType === 'shares') {
    let totalShares = 0;
    const inputs = [];
    checkboxes.forEach(cb => {
      const input = document.querySelector(`.split-value[data-user="${cb.value}"]`);
      const shares = parseFloat(input?.value) || 0;
      totalShares += shares;
      inputs.push({ userId: cb.value, shares });
    });

    if (totalShares === 0) {
      summary.innerHTML = '<p style="color: #e53e3e;">Asigna al menos una parte a alguien.</p>';
      return;
    }

    const lineas = inputs.map(i => {
      const montoParte = (monto * i.shares / totalShares).toFixed(2);
      return `<p>${i.shares} partes → <strong>${montoParte} €</strong></p>`;
    });
    summary.innerHTML = lineas.join('') + `<p style="color: #38a169; margin-top: 5px;">✅ Total: ${totalShares} partes.</p>`;
  }
}

// ==========================================
// 5. GUARDAR GASTO CON DIVISIÓN AVANZADA
// ==========================================
export async function guardarGasto(descripcion, monto, groupId, paidBy) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const splitType = document.getElementById('split-type').value;
  const checkboxes = document.querySelectorAll('#expense-split-members .split-checkbox:checked');
  const usuariosSplit = Array.from(checkboxes).map(cb => cb.value);

  if (usuariosSplit.length === 0) {
    throw new Error('Debes seleccionar al menos una persona para dividir.');
  }

  // Calcular cuánto debe cada uno según el tipo
  let splits = [];

  if (splitType === 'equal') {
    const montoPorPersona = parseFloat((monto / usuariosSplit.length).toFixed(2));
    splits = usuariosSplit.map(userId => ({
      user_id: userId,
      amount_owed: montoPorPersona,
      split_type: 'equal'
    }));
  } 
  else if (splitType === 'percentage') {
    let totalPct = 0;
    splits = usuariosSplit.map(userId => {
      const input = document.querySelector(`.split-value[data-user="${userId}"]`);
      const pct = parseFloat(input?.value) || 0;
      totalPct += pct;
      return {
        user_id: userId,
        amount_owed: parseFloat((monto * pct / 100).toFixed(2)),
        split_type: 'percentage'
      };
    });
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error(`Los porcentajes suman ${totalPct.toFixed(2)}%, deben sumar 100%.`);
    }
  } 
  else if (splitType === 'exact') {
    let totalExacto = 0;
    splits = usuariosSplit.map(userId => {
      const input = document.querySelector(`.split-value[data-user="${userId}"]`);
      const val = parseFloat(input?.value) || 0;
      totalExacto += val;
      return {
        user_id: userId,
        amount_owed: val,
        split_type: 'exact'
      };
    });
    if (Math.abs(totalExacto - monto) > 0.01) {
      throw new Error(`Los montos suman ${totalExacto.toFixed(2)} €, deben sumar ${monto.toFixed(2)} €.`);
    }
  } 
  else if (splitType === 'shares') {
    let totalShares = 0;
    const tempSplits = usuariosSplit.map(userId => {
      const input = document.querySelector(`.split-value[data-user="${userId}"]`);
      const shares = parseFloat(input?.value) || 0;
      totalShares += shares;
      return { user_id: userId, shares, split_type: 'shares' };
    });
    if (totalShares === 0) throw new Error('Debes asignar al menos una parte.');
    splits = tempSplits.map(s => ({
      user_id: s.user_id,
      amount_owed: parseFloat((monto * s.shares / totalShares).toFixed(2)),
      split_type: 'shares'
    }));
  }

  // 1. Insertar el gasto
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

  // 2. Insertar las divisiones
  const splitsFinales = splits.map(s => ({
    expense_id: gasto.id,
    user_id: s.user_id,
    amount_owed: s.amount_owed,
    split_type: s.split_type
  }));

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitsFinales);

  if (splitsError) throw splitsError;

  return gasto;
}

// ==========================================
// 6. CARGAR GASTOS DE UN GRUPO
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
// 7. INICIALIZAR MODAL DE GASTO
// ==========================================
export function initExpenseModal() {
  const modal = document.getElementById('modal-expense');
  const btnFab = document.getElementById('fab-add');
  const btnCancel = document.getElementById('btn-cancel-expense');
  const form = document.getElementById('form-expense');
  const errorMsg = document.getElementById('expense-error');
  const selectGrupo = document.getElementById('expense-group');
  const splitType = document.getElementById('split-type');
  const amountInput = document.getElementById('expense-amount');

  btnFab.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
    document.getElementById('split-summary').innerHTML = '<p>Selecciona un grupo y ajusta los valores.</p>';
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

  // Re-renderizar cuando cambia el tipo de split
  splitType.addEventListener('change', () => {
    const groupId = selectGrupo.value;
    if (!groupId) return;
    
    const preserveValues = {};
    document.querySelectorAll('.split-value').forEach(input => {
      preserveValues[input.dataset.user] = input.value;
    });
    
    cargarMiembrosDelGrupo(groupId).then(() => {
      Object.entries(preserveValues).forEach(([userId, val]) => {
        const input = document.querySelector(`.split-value[data-user="${userId}"]`);
        if (input) input.value = val;
      });
      actualizarResumenSplit();
    });
  });

  // Actualizar resumen cuando cambia el monto
  amountInput.addEventListener('input', actualizarResumenSplit);

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
