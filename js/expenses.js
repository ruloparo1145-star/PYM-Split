// js/expenses.js
import { supabase } from './supabase.js';

// ==========================================
// CATEGORIAS E ICONOS
// ==========================================

const CATEGORIAS = {
  comida:       { label: 'Comida',       icono: '&#127829;' },
  transporte:   { label: 'Transporte',   icono: '&#128663;' },
  alojamiento:  { label: 'Alojamiento',  icono: '&#127968;' },
  supermercado: { label: 'Supermercado', icono: '&#128722;' },
  ocio:         { label: 'Ocio',         icono: '&#127881;' },
  salud:        { label: 'Salud',        icono: '&#128138;' },
  servicios:    { label: 'Servicios',    icono: '&#128241;' },
  compras:      { label: 'Compras',      icono: '&#128717;' },
  viajes:       { label: 'Viajes',       icono: '&#9992;' },
  otros:        { label: 'Otros',        icono: '&#128176;' }
};

function getCategoria(cat) {
  return CATEGORIAS[cat] || CATEGORIAS.otros;
}

let filtroCategoriaActual = '';

// ==========================================
// 1. CARGAR GRUPOS PARA EL SELECT
// ==========================================
export async function cargarGruposParaGasto() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: grupos } = await supabase
    .from('groups')
    .select('id, name')
    .eq('archived', false)
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
    selectPaidBy.innerHTML = '<option value="">Seleccionar quien pago...</option>';
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

  selectPaidBy.innerHTML = '<option value="">Seleccionar quien pago...</option>' +
    miembros.map(m => `<option value="${m.user_id}">${m.profiles.full_name || m.profiles.email}</option>`).join('');

  renderizarSplitInputs(miembros);
}

// ==========================================
// 3. RENDERIZAR INPUTS SEGUN TIPO DE DIVISION
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
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="EUR" step="0.01" min="0" value="${valorActual}" style="width: 90px;">`;
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
    summary.innerHTML = `<p><strong>${montoPorPersona} EUR</strong> por persona (${checkboxes.length} personas)</p>`;
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
      lineas.push(`<p>${pct}% -> <strong>${montoPct} EUR</strong></p>`);
    });
    const aviso = Math.abs(total - 100) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">Los porcentajes suman ${total.toFixed(2)}%, deberian sumar 100%.</p>` 
      : '<p style="color: #38a169; margin-top: 5px;">OK. Suma 100%.</p>';
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
      lineas.push(`<p>${val.toFixed(2)} EUR</p>`);
    });
    const aviso = Math.abs(total - monto) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">Suma ${total.toFixed(2)} EUR, deberia sumar ${monto.toFixed(2)} EUR.</p>` 
      : '<p style="color: #38a169; margin-top: 5px;">OK. Suma correcta.</p>';
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
      return `<p>${i.shares} partes -> <strong>${montoParte} EUR</strong></p>`;
    });
    summary.innerHTML = lineas.join('') + `<p style="color: #38a169; margin-top: 5px;">OK. Total: ${totalShares} partes.</p>`;
  }
}

// ==========================================
// 5. GUARDAR GASTO
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
      throw new Error(`Los montos suman ${totalExacto.toFixed(2)} EUR, deben sumar ${monto.toFixed(2)} EUR.`);
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

const categoria = document.getElementById('expense-category').value || 'otros';

  const { data: gasto, error: gastoError } = await supabase
    .from('expenses')
    .insert([{
      group_id: groupId,
      description: descripcion,
      amount: monto,
      paid_by: paidBy,
      currency: 'EUR',
      category: categoria,
      date: new Date().toISOString().split('T')[0]
    }])

    .select()
    .single();

  if (gastoError) throw gastoError;

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
// 6. CARGAR GASTOS DE UN GRUPO (SIN JOIN)
// ==========================================

export async function cargarGastosDelGrupo(groupId) {
  const listContainer = document.getElementById('group-expenses-list');
  
  // Traer TODOS los gastos del grupo (para que el filtro funcione sin re-consultar)
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, paid_by, category')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error gastos:', error);
    listContainer.innerHTML = '<p class="error-msg">Error al cargar gastos.</p>';
    return;
  }

  if (!gastos || gastos.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No hay gastos aun. Anade el primero!</p>';
    return;
  }

  // Filtrar por categorÃ­a si hay filtro activo
  const gastosFiltrados = filtroCategoriaActual
    ? gastos.filter(g => (g.category || 'otros') === filtroCategoriaActual)
    : gastos;

  if (gastosFiltrados.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No hay gastos con esa categoria.</p>';
    return;
  }

  const paidByIds = [...new Set(gastosFiltrados.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);

  listContainer.innerHTML = gastosFiltrados.map(g => {
    const cat = getCategoria(g.category);
    return `
      <div class="expense-card clickable-expense" data-expense-id="${g.id}">
        <div class="expense-category-icon" title="${cat.label}">${cat.icono}</div>
        <div class="expense-info">
          <h5>${g.description}</h5>
          <span>Pago: ${nombres[g.paid_by] || 'Desconocido'} - ${g.date}</span>
        </div>
        <div class="expense-amount">
          ${parseFloat(g.amount).toFixed(2)} ${g.currency}
        </div>
      </div>
    `;
  }).join('');

  listContainer.querySelectorAll('.clickable-expense').forEach(card => {
    card.addEventListener('click', () => {
      abrirDetalleGasto(card.dataset.expenseId, groupId);
    });
  });
}

// ==========================================
// FILTRO POR CATEGORIA
// ==========================================
export function initFiltroCategoria() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  select.addEventListener('change', () => {
    filtroCategoriaActual = select.value;
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (groupId) {
      cargarGastosDelGrupo(groupId);
    }
  });
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
    document.getElementById('expense-paid-by').innerHTML = '<option value="">Seleccionar quien pago...</option>';
  });

  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  selectGrupo.addEventListener('change', (e) => {
    cargarMiembrosDelGrupo(e.target.value);
  });

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
      alert('Gasto guardado con exito!');
      const groupIdDetail = document.getElementById('modal-group-detail').dataset.groupId;
      if (groupIdDetail && groupIdDetail === groupId) {
        const { cargarGastosDelGrupo } = await import('./expenses.js');
        const { mostrarBalance } = await import('./debtSolver.js');
        const { cargarGraficos } = await import('./charts.js');
        const { cargarHistorial } = await import('./history.js');
        await cargarGastosDelGrupo(groupId);
        await mostrarBalance(groupId);
        await cargarGraficos(groupId);
        await cargarHistorial(groupId);
      }
    } catch (error) {
      errorMsg.textContent = 'Error: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Guardar Gasto';
    }
  });
}

// ==========================================
// 8. DETALLE DEL GASTO (SIN JOIN)
// ==========================================
export async function abrirDetalleGasto(expenseId, groupId) {
  const modal = document.getElementById('modal-expense-detail');
  const container = document.getElementById('expense-detail-content');
  container.innerHTML = '<p class="placeholder-text">Cargando...</p>';
  
  modal.dataset.expenseId = expenseId;
  modal.dataset.groupId = groupId;

  const { data: gasto, error } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, category, notes, paid_by')
    .eq('id', expenseId)
    .single();

  if (error || !gasto) {
    container.innerHTML = '<p class="error-msg">Error al cargar el gasto.</p>';
    return;
  }

  const { data: pagador } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', gasto.paid_by)
    .single();

  const { data: splits } = await supabase
    .from('expense_splits')
    .select('amount_owed, split_type, user_id')
    .eq('expense_id', expenseId);

  const userIds = (splits || []).map(s => s.user_id);
  let nombres = {};
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);
  }
  const cat = getCategoria(gasto.category);

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 3rem; margin-bottom: 8px;">${cat.icono}</div>
      <h2 style="color: #2ecc87; font-size: 2rem;">${parseFloat(gasto.amount).toFixed(2)} ${gasto.currency}</h2>
      <p style="color: #4a5568; font-size: 1.1rem;">${gasto.description}</p>
      <p style="color: #718096; font-size: 0.85rem;">${cat.label} - ${gasto.date}</p>
    </div>

    <div style="border-top: 1px solid #edf2f7; padding-top: 15px;">
      <p style="font-size: 0.85rem; color: #4a5568;">
        <strong>Pago:</strong> ${pagador?.full_name || pagador?.email || 'Desconocido'}
      </p>
    </div>
    <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 15px;">
      <p style="font-size: 0.85rem; color: #4a5568; margin-bottom: 10px;"><strong>Division:</strong></p>
      ${splits && splits.length > 0 ? splits.map(s => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem;">
          <span>${nombres[s.user_id] || 'Desconocido'}</span>
          <span style="font-weight: 600; color: #2d3748;">${parseFloat(s.amount_owed).toFixed(2)} ${gasto.currency}</span>
        </div>
      `).join('') : '<p class="placeholder-text">Sin divisiones.</p>'}
    </div>
  `;

  modal.classList.remove('hidden');
}

// ==========================================
// 9. ELIMINAR GASTO
// ==========================================
export async function eliminarGasto() {
  const modal = document.getElementById('modal-expense-detail');
  const expenseId = modal.dataset.expenseId;
  const groupId = document.getElementById('modal-group-detail').dataset.groupId;

  if (!confirm('Seguro que quieres eliminar este gasto?')) return;

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    alert('Error al eliminar: ' + error.message);
    return;
  }

  modal.classList.add('hidden');

  const { cargarGastosDelGrupo } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');
  const { cargarHistorial } = await import('./history.js');
  const { cargarGraficos } = await import('./charts.js');

  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
  await cargarHistorial(groupId);
  await cargarGraficos(groupId);
}

// ==========================================
// 10. CARGAR GASTO PARA EDITAR
// ==========================================
export async function cargarGastoParaEditar() {
  const detailModal = document.getElementById('modal-expense-detail');
  const editModal = document.getElementById('modal-expense-edit');
  const expenseId = detailModal.dataset.expenseId;

  const { data: gasto } = await supabase
    .from('expenses')
    .select('id, description, amount, paid_by, group_id')
    .eq('id', expenseId)
    .single();

  if (!gasto) return;

  const { data: miembros } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('group_id', gasto.group_id);

  const selectPaidBy = document.getElementById('edit-expense-paid-by');
  selectPaidBy.innerHTML = (miembros || []).map(m => 
    `<option value="${m.user_id}" ${m.user_id === gasto.paid_by ? 'selected' : ''}>${m.profiles.full_name || m.profiles.email}</option>`
  ).join('');

  document.getElementById('edit-expense-id').value = gasto.id;
  document.getElementById('edit-expense-description').value = gasto.description;
  document.getElementById('edit-expense-amount').value = gasto.amount;
  document.getElementById('edit-expense-error').textContent = '';

  detailModal.classList.add('hidden');
  editModal.classList.remove('hidden');
}

// ==========================================
// 11. GUARDAR EDICION
// ==========================================
export async function guardarEdicionGasto() {
  const form = document.getElementById('form-expense-edit');
  const errorMsg = document.getElementById('edit-expense-error');
  const btnSubmit = form.querySelector('button[type="submit"]');

  const expenseId = document.getElementById('edit-expense-id').value;
  const descripcion = document.getElementById('edit-expense-description').value.trim();
  const monto = parseFloat(document.getElementById('edit-expense-amount').value);
  const paidBy = document.getElementById('edit-expense-paid-by').value;

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando...';
  errorMsg.textContent = '';

  try {
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        description: descripcion,
        amount: monto,
        paid_by: paidBy
      })
      .eq('id', expenseId);

    if (updateError) throw updateError;

    const { data: splitsActuales } = await supabase
      .from('expense_splits')
      .select('id, user_id, amount_owed, split_type')
      .eq('expense_id', expenseId);

    if (splitsActuales && splitsActuales.length > 0) {
      const totalAnterior = splitsActuales.reduce((sum, s) => sum + parseFloat(s.amount_owed), 0);
      const factor = totalAnterior > 0 ? monto / totalAnterior : 1;

      for (const s of splitsActuales) {
        const nuevoMonto = parseFloat((parseFloat(s.amount_owed) * factor).toFixed(2));
        await supabase
          .from('expense_splits')
          .update({ amount_owed: nuevoMonto })
          .eq('id', s.id);
      }
    }

    document.getElementById('modal-expense-edit').classList.add('hidden');

    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    const { cargarGastosDelGrupo } = await import('./expenses.js');
    const { mostrarBalance } = await import('./debtSolver.js');
    const { cargarHistorial } = await import('./history.js');
    const { cargarGraficos } = await import('./charts.js');

    await cargarGastosDelGrupo(groupId);
    await mostrarBalance(groupId);
    await cargarHistorial(groupId);
    await cargarGraficos(groupId);

  } catch (error) {
    errorMsg.textContent = 'Error: ' + error.message;
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Guardar cambios';
  }
}
