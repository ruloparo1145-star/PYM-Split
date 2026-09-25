// js/expenses.js
import { supabase } from './supabase.js';
import { obtenerTasa, convertirMontoConGrupo } from './currency.js';
import { t, tCategoria } from './i18n.js';

// ==========================================
// CATEGORIAS E ICONOS
// ==========================================
const CATEGORIAS = {
  comida:       { icono: '&#127829;' },
  transporte:   { icono: '&#128663;' },
  alojamiento:  { icono: '&#127968;' },
  supermercado: { icono: '&#128722;' },
  ocio:         { icono: '&#127881;' },
  salud:        { icono: '&#128138;' },
  servicios:    { icono: '&#128241;' },
  compras:      { icono: '&#128717;' },
  viajes:       { icono: '&#9992;' },
  otros:        { icono: '&#128176;' }
};

function getCategoria(cat) {
  const key = cat || 'otros';
  return {
    label: tCategoria(key),
    icono: (CATEGORIAS[key] || CATEGORIAS.otros).icono
  };
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
    .select('id, name, currency')
    .eq('archived', false)
    .order('name');

  const selectGrupo = document.getElementById('expense-group');
  selectGrupo.innerHTML = `<option value="">${t('expense.create.group_placeholder')}</option>` +
    (grupos || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

// ==========================================
// 2. CARGAR MIEMBROS DEL GRUPO
// ==========================================
export async function cargarMiembrosDelGrupo(groupId) {
  const splitList = document.getElementById('expense-split-members');
  const selectPaidBy = document.getElementById('expense-paid-by');
  
  if (!groupId) {
    splitList.innerHTML = `<p class="placeholder-text" style="padding: 10px 0;">${t('expense.create.split_no_group')}</p>`;
    selectPaidBy.innerHTML = `<option value="">${t('expense.create.paid_by_placeholder')}</option>`;
    document.getElementById('split-summary').innerHTML = `<p>${t('expense.create.split_no_group_hint')}</p>`;
    return;
  }

  const { data: miembros, error } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('group_id', groupId);

  if (error || !miembros) {
    splitList.innerHTML = `<p class="error-msg">${t('expense.create.no_members')}</p>`;
    return;
  }

  selectPaidBy.innerHTML = `<option value="">${t('expense.create.paid_by_placeholder')}</option>` +
    miembros.map(m => `<option value="${m.user_id}">${m.profiles.full_name || m.profiles.email}</option>`).join('');

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency')
    .eq('id', groupId)
    .single();

  if (grupoInfo && grupoInfo.currency) {
    const selectMoneda = document.getElementById('expense-currency');
    if (selectMoneda) selectMoneda.value = grupoInfo.currency;
  }

  renderizarSplitInputs(miembros);
}

// ==========================================
// 3. RENDERIZAR INPUTS
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
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="Amount" step="0.01" min="0" value="${valorActual}" style="width: 90px;">`;
    } else if (splitType === 'shares') {
      extraInput = `<input type="number" class="split-value" data-user="${userId}" placeholder="shares" step="1" min="0" value="${valorActual}" style="width: 80px;">`;
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
// 4. ACTUALIZAR RESUMEN
// ==========================================
function actualizarResumenSplit() {
  const summary = document.getElementById('split-summary');
  const monto = parseFloat(document.getElementById('expense-amount').value) || 0;
  const splitType = document.getElementById('split-type').value;
  const moneda = document.getElementById('expense-currency')?.value || 'EUR';

  const checkboxes = document.querySelectorAll('#expense-split-members .split-checkbox:checked');
  if (checkboxes.length === 0) {
    summary.innerHTML = `<p style="color: #e53e3e;">${t('expense.create.need_one')}</p>`;
    return;
  }

  if (splitType === 'equal') {
    const montoPorPersona = (monto / checkboxes.length).toFixed(2);
    summary.innerHTML = `<p><strong>${montoPorPersona} ${moneda}</strong> - ${t('expense.create.equal_summary', { monto: montoPorPersona, moneda, count: checkboxes.length })}</p>`;
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
      lineas.push(`<p>${pct}% -> <strong>${montoPct} ${moneda}</strong></p>`);
    });
    const aviso = Math.abs(total - 100) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">${t('expense.create.percent_sum', { total: total.toFixed(2) })}</p>` 
      : `<p style="color: #38a169; margin-top: 5px;">${t('expense.create.percent_ok')}</p>`;
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
      lineas.push(`<p>${val.toFixed(2)} ${moneda}</p>`);
    });
    const aviso = Math.abs(total - monto) > 0.01 
      ? `<p style="color: #e53e3e; margin-top: 5px;">${t('expense.create.exact_sum', { total: total.toFixed(2), moneda, esperado: monto.toFixed(2) })}</p>` 
      : `<p style="color: #38a169; margin-top: 5px;">${t('expense.create.exact_ok')}</p>`;
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
      summary.innerHTML = `<p style="color: #e53e3e;">${t('expense.create.shares_need')}</p>`;
      return;
    }

    const lineas = inputs.map(i => {
      const montoParte = (monto * i.shares / totalShares).toFixed(2);
      return `<p>${t('expense.create.shares_line', { shares: i.shares, monto: montoParte, moneda })}</p>`;
    });
    summary.innerHTML = lineas.join('') + `<p style="color: #38a169; margin-top: 5px;">${t('expense.create.shares_ok', { total: totalShares })}</p>`;
  }
}

// ==========================================
// 5. GUARDAR GASTO
// ==========================================
export async function guardarGasto(descripcion, monto, groupId, paidBy) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const splitType = document.getElementById('split-type').value;
  const checkboxes = document.querySelectorAll('#expense-split-members .split-checkbox:checked');
  const usuariosSplit = Array.from(checkboxes).map(cb => cb.value);

  if (usuariosSplit.length === 0) {
    throw new Error(t('expense.create.need_group'));
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
      throw new Error(t('expense.create.percent_error', { total: totalPct.toFixed(2) }));
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
      throw new Error(t('expense.create.exact_error', { total: totalExacto.toFixed(2), esperado: monto.toFixed(2) }));
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
    if (totalShares === 0) throw new Error(t('expense.create.shares_error'));
    splits = tempSplits.map(s => ({
      user_id: s.user_id,
      amount_owed: parseFloat((monto * s.shares / totalShares).toFixed(2)),
      split_type: 'shares'
    }));
  }

  const categoria = document.getElementById('expense-category')?.value || 'otros';
  const monedaGasto = (document.getElementById('expense-currency')?.value || 'EUR').toUpperCase();

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency, manual_exchange_rate')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();
  const manualRateUSD = grupoInfo?.manual_exchange_rate;

  let exchangeRate = 1;
  if (monedaGasto !== monedaGrupo) {
    const resultado = await convertirMontoConGrupo(1, monedaGasto, monedaGrupo, manualRateUSD);
    if (resultado.convertido) {
      exchangeRate = resultado.monto;
    }
  }

  const { data: gasto, error: gastoError } = await supabase
    .from('expenses')
    .insert([{
      group_id: groupId,
      description: descripcion,
      amount: monto,
      paid_by: paidBy,
      currency: monedaGasto,
      exchange_rate: exchangeRate,
      category: categoria,
      date: new Date().toISOString().split('T')[0],
      archived: false
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
// 6. CARGAR GASTOS DE UN GRUPO (solo activos)
// ==========================================
export async function cargarGastosDelGrupo(groupId) {
  const listContainer = document.getElementById('group-expenses-list');
  
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, paid_by, category, exchange_rate')
    .eq('group_id', groupId)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error gastos:', error);
    listContainer.innerHTML = `<p class="error-msg">${t('expense.list.error')}</p>`;
    return;
  }

  if (!gastos || gastos.length === 0) {
    listContainer.innerHTML = `<p class="placeholder-text">${t('expense.list.empty')}</p>`;
    return;
  }

  const gastosFiltrados = filtroCategoriaActual
    ? gastos.filter(g => (g.category || 'otros') === filtroCategoriaActual)
    : gastos;

  if (gastosFiltrados.length === 0) {
    listContainer.innerHTML = `<p class="placeholder-text">${t('expense.list.empty_filter')}</p>`;
    return;
  }

  const paidByIds = [...new Set(gastosFiltrados.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

  listContainer.innerHTML = gastosFiltrados.map(g => {
    const cat = getCategoria(g.category);
    const monto = parseFloat(g.amount);
    const monedaGasto = (g.currency || 'EUR').toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;

    let montoMostrar;
    let subtexto = '';

    if (monedaGasto === monedaGrupo) {
      montoMostrar = `${monto.toFixed(2)} ${monedaGrupo}`;
    } else {
      const convertido = monto * tasa;
      montoMostrar = `${convertido.toFixed(2)} ${monedaGrupo}`;
      subtexto = `(${monto.toFixed(2)} ${monedaGasto})`;
    }

    return `
      <div class="expense-card clickable-expense" data-expense-id="${g.id}">
        <div class="expense-category-icon" title="${cat.label}">${cat.icono}</div>
        <div class="expense-info">
          <h5>${g.description}</h5>
          <span>${t('expense.list.paid_by', { nombre: nombres[g.paid_by] || t('expense.detail.unknown'), fecha: g.date })}</span>
        </div>
        <div class="expense-amount">
          ${montoMostrar}
          ${subtexto ? `<small class="expense-subtext">${subtexto}</small>` : ''}
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
// 6b. CARGAR GASTOS ARCHIVADOS DE UN GRUPO
// ==========================================
export async function cargarGastosArchivados(groupId) {
  const listContainer = document.getElementById('group-archived-expenses');
  if (!listContainer) return;

  listContainer.innerHTML = `<p class="placeholder-text">${t('dashboard.loading')}</p>`;

  const { data: gastos, error } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, paid_by, category, exchange_rate, archived_at')
    .eq('group_id', groupId)
    .eq('archived', true)
    .order('archived_at', { ascending: false });

  if (error) {
    console.error('Error gastos archivados:', error);
    listContainer.innerHTML = `<p class="error-msg">${t('expense.archive.error_load')}</p>`;
    return;
  }

  if (!gastos || gastos.length === 0) {
    listContainer.innerHTML = `<p class="placeholder-text">${t('expense.archive.empty')}</p>`;
    return;
  }

  const paidByIds = [...new Set(gastos.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency, archived')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();
  const grupoArchivado = !!(grupoInfo?.archived);

  listContainer.innerHTML = gastos.map(g => {
    const cat = getCategoria(g.category);
    const monto = parseFloat(g.amount);
    const monedaGasto = (g.currency || 'EUR').toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;

    let montoMostrar;
    let subtexto = '';

    if (monedaGasto === monedaGrupo) {
      montoMostrar = `${monto.toFixed(2)} ${monedaGrupo}`;
    } else {
      const convertido = monto * tasa;
      montoMostrar = `${convertido.toFixed(2)} ${monedaGrupo}`;
      subtexto = `(${monto.toFixed(2)} ${monedaGasto})`;
    }

    let fechaArchivado = '';
    if (g.archived_at) {
      const d = new Date(g.archived_at);
      fechaArchivado = t('expense.archive.archived_on', { fecha: d.toLocaleDateString() });
    }

    const btnRestaurar = grupoArchivado
      ? ''
      : `<button class="btn-small btn-restore-expense" data-expense-id="${g.id}" title="${t('expense.archive.restore')}">&#8634; ${t('expense.archive.restore')}</button>`;

    return `
      <div class="expense-card expense-card-archived clickable-expense" data-expense-id="${g.id}">
        <div class="expense-category-icon expense-icon-archived" title="${cat.label}">&#128230;</div>
        <div class="expense-info">
          <h5>${g.description}</h5>
          <span>${t('expense.list.paid_by', { nombre: nombres[g.paid_by] || t('expense.detail.unknown'), fecha: g.date })}</span>
          ${fechaArchivado ? `<small class="expense-archived-date">${fechaArchivado}</small>` : ''}
        </div>
        <div class="expense-amount expense-amount-archived">
          ${montoMostrar}
          ${subtexto ? `<small class="expense-subtext">${subtexto}</small>` : ''}
        </div>
        ${btnRestaurar}
      </div>
    `;
  }).join('');

  listContainer.querySelectorAll('.clickable-expense').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-restore-expense')) return;
      abrirDetalleGasto(card.dataset.expenseId, groupId);
    });
  });

  listContainer.querySelectorAll('.btn-restore-expense').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const expenseId = btn.dataset.expenseId;
      if (!confirm(t('expense.archive.restore_confirm'))) return;
      await restaurarGasto(expenseId, groupId);
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
  const currencySelect = document.getElementById('expense-currency');

  btnFab.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
    document.getElementById('split-summary').innerHTML = `<p>${t('expense.create.split_no_group_hint')}</p>`;
    await cargarGruposParaGasto();
    document.getElementById('expense-split-members').innerHTML = 
      `<p class="placeholder-text" style="padding: 10px 0;">${t('expense.create.split_no_group')}</p>`;
    document.getElementById('expense-paid-by').innerHTML = `<option value="">${t('expense.create.paid_by_placeholder')}</option>`;
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
  currencySelect?.addEventListener('change', actualizarResumenSplit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = t('expense.create.saving');

    const descripcion = document.getElementById('expense-description').value.trim();
    const monto = parseFloat(document.getElementById('expense-amount').value);
    const groupId = document.getElementById('expense-group').value;
    const paidBy = document.getElementById('expense-paid-by').value;

    try {
      await guardarGasto(descripcion, monto, groupId, paidBy);
      modal.classList.add('hidden');
      alert(t('expense.create.success'));
      const groupIdDetail = document.getElementById('modal-group-detail').dataset.groupId;
      if (groupIdDetail && groupIdDetail === groupId) {
        const { cargarGastosDelGrupo } = await import('./expenses.js');
        const { mostrarBalance } = await import('./debtSolver.js');
        await cargarGastosDelGrupo(groupId);
        await mostrarBalance(groupId);
        const modalDetail = document.getElementById('modal-group-detail');
        const extras = document.getElementById('group-extras');
        if (extras && !extras.classList.contains('hidden')) {
          const { cargarGraficos } = await import('./charts.js');
          const { cargarHistorial } = await import('./history.js');
          const monedaGrupo = modalDetail.dataset.groupCurrency || 'EUR';
          await cargarGraficos(groupId, monedaGrupo);
          await cargarHistorial(groupId);
        }
      }

      const { cargarDashboard } = await import('./dashboard.js');
      await cargarDashboard();

    } catch (error) {
      errorMsg.textContent = t('expense.create.error', { mensaje: error.message });
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = t('expense.create.submit');
    }
  });
}

// ==========================================
// 8. DETALLE DEL GASTO
// ==========================================
export async function abrirDetalleGasto(expenseId, groupId) {
  const modal = document.getElementById('modal-expense-detail');
  const container = document.getElementById('expense-detail-content');
  container.innerHTML = `<p class="placeholder-text">${t('expense.detail.loading')}</p>`;
  
  modal.dataset.expenseId = expenseId;
  modal.dataset.groupId = groupId;

  const { data: gasto, error } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, category, notes, paid_by, exchange_rate, group_id, archived, archived_at')
    .eq('id', expenseId)
    .single();

  if (error || !gasto) {
    container.innerHTML = `<p class="error-msg">${t('expense.detail.error')}</p>`;
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

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency, archived, date_closed')
    .eq('id', gasto.group_id)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();
  const monedaGasto = (gasto.currency || 'EUR').toUpperCase();
  const monto = parseFloat(gasto.amount);
  const tasa = parseFloat(gasto.exchange_rate) || 1;
  const grupoArchivado = !!(grupoInfo?.archived);
  const computoCerrado = !!(grupoInfo?.date_closed);
  const gastoArchivado = !!gasto.archived;

  let montoPrincipal, montoSub;
  if (monedaGasto === monedaGrupo) {
    montoPrincipal = `${monto.toFixed(2)} ${monedaGrupo}`;
    montoSub = '';
  } else {
    montoPrincipal = `${(monto * tasa).toFixed(2)} ${monedaGrupo}`;
    montoSub = `(${monto.toFixed(2)} ${monedaGasto})`;
  }

  let avisoArchivado = '';
  if (gastoArchivado) {
    avisoArchivado = `
      <div class="expense-archived-notice">
        &#128230; ${t('expense.detail.archived_notice')}
      </div>
    `;
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 3rem; margin-bottom: 8px;">${cat.icono}</div>
      <h2 style="color: ${gastoArchivado ? '#718096' : '#2ecc87'}; font-size: 2rem;">${montoPrincipal}</h2>
      ${montoSub ? `<p style="color: #a0aec0; font-size: 0.85rem;">${montoSub}</p>` : ''}
      <p style="color: #4a5568; font-size: 1.1rem;">${gasto.description}</p>
      <p style="color: #718096; font-size: 0.85rem;">${cat.label} - ${gasto.date}</p>
      ${avisoArchivado}
    </div>

    <div style="border-top: 1px solid #edf2f7; padding-top: 15px;">
      <p style="font-size: 0.85rem; color: #4a5568;">
        <strong>${t('expense.detail.paid_by')}</strong> ${pagador?.full_name || pagador?.email || t('expense.detail.unknown')}
      </p>
    </div>

    <div style="border-top: 1px solid #edf2f7; padding-top: 15px; margin-top: 15px;">
      <p style="font-size: 0.85rem; color: #4a5568; margin-bottom: 10px;"><strong>${t('expense.detail.split')}</strong></p>
      ${splits && splits.length > 0 ? splits.map(s => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem;">
          <span>${nombres[s.user_id] || t('expense.detail.unknown')}</span>
          <span style="font-weight: 600; color: #2d3748;">${parseFloat(s.amount_owed).toFixed(2)} ${monedaGasto}</span>
        </div>
      `).join('') : `<p class="placeholder-text">${t('expense.detail.no_split')}</p>`}
    </div>
  `;

  const btnEdit = document.getElementById('btn-edit-expense');
  const btnDelete = document.getElementById('btn-delete-expense');

  if (gastoArchivado || grupoArchivado || computoCerrado) {
    // Ocultar ambos botones si:
    // - el gasto esta archivado, o
    // - el grupo esta archivado, o
    // - el computo esta cerrado (no tiene sentido archivar/editar despues de cerrar)
    if (btnEdit) btnEdit.style.display = 'none';
    if (btnDelete) btnDelete.style.display = 'none';
  } else {
    // Grupo activo y computo NO cerrado: mostrar Editar y Archivar
    if (btnEdit) {
      btnEdit.style.display = '';
      btnEdit.textContent = t('expense.detail.edit');
    }
    if (btnDelete) {
      btnDelete.style.display = '';
      btnDelete.textContent = t('expense.detail.archive');
      btnDelete.style.background = '#fefcbf';
      btnDelete.style.color = '#b7791f';
      btnDelete.dataset.action = 'archivar';
    }
  }

  modal.classList.remove('hidden');
}

// ==========================================
// 9. ARCHIVAR GASTO (boton principal)
// ==========================================
export async function accionGasto() {
  const modal = document.getElementById('modal-expense-detail');
  const btnDelete = document.getElementById('btn-delete-expense');
  const expenseId = modal.dataset.expenseId;
  const groupId = document.getElementById('modal-group-detail').dataset.groupId;

  const accion = btnDelete?.dataset.action;

  if (accion !== 'archivar') {
    return;
  }

  if (!confirm(t('expense.archive.confirm'))) return;

  const { error } = await supabase
    .from('expenses')
    .update({ 
      archived: true, 
      archived_at: new Date().toISOString() 
    })
    .eq('id', expenseId);

  if (error) {
    alert(t('expense.archive.error', { mensaje: error.message }));
    return;
  }

  modal.classList.add('hidden');

  await recargarDetalleGrupo(groupId);
}

// ==========================================
// 9b. RESTAURAR GASTO
// ==========================================
export async function restaurarGasto(expenseId, groupId) {
  const { error } = await supabase
    .from('expenses')
    .update({ 
      archived: false, 
      archived_at: null 
    })
    .eq('id', expenseId);

  if (error) {
    alert(t('expense.archive.restore_error', { mensaje: error.message }));
    return;
  }

  await recargarDetalleGrupo(groupId);
}

// ==========================================
// 9c. RECARGAR DETALLE DEL GRUPO
// ==========================================
async function recargarDetalleGrupo(groupId) {
  const { cargarGastosDelGrupo, cargarGastosArchivados } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');

  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);

  const archivedContainer = document.getElementById('group-archived-expenses');
  if (archivedContainer && !archivedContainer.classList.contains('hidden')) {
    await cargarGastosArchivados(groupId);
  }

  await actualizarBadgeArchivados(groupId);

  const extras = document.getElementById('group-extras');
  if (extras && !extras.classList.contains('hidden')) {
    const { cargarGraficos } = await import('./charts.js');
    const { cargarHistorial } = await import('./history.js');
    const modal = document.getElementById('modal-group-detail');
    const monedaGrupo = modal.dataset.groupCurrency || 'EUR';
    await cargarGraficos(groupId, monedaGrupo);
    await cargarHistorial(groupId);
  }

  const { cargarDashboard } = await import('./dashboard.js');
  await cargarDashboard();
}

// ==========================================
// 9d. ACTUALIZAR BADGE DE ARCHIVADOS
// ==========================================
export async function actualizarBadgeArchivados(groupId) {
  const badge = document.getElementById('group-archived-badge');
  if (!badge) return;

  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

  const { data: gastos } = await supabase
    .from('expenses')
    .select('amount, currency, exchange_rate')
    .eq('group_id', groupId)
    .eq('archived', true);

  if (!gastos || gastos.length === 0) {
    badge.classList.add('hidden');
    badge.innerHTML = '';
    return;
  }

  let totalArchivado = 0;
  gastos.forEach(g => {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;
    if (monedaGasto === monedaGrupo) {
      totalArchivado += monto;
    } else {
      totalArchivado += monto * tasa;
    }
  });

  const claveCount = gastos.length === 1 ? 'expense.archive.badge_one' : 'expense.archive.badge_many';

  badge.classList.remove('hidden');
  badge.innerHTML = `
    <span class="group-archived-badge-text">
      &#9888; ${t(claveCount, { count: gastos.length })} 
      ${t('expense.archive.badge_amount', { monto: totalArchivado.toFixed(2), moneda: monedaGrupo })}
    </span>
  `;
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
    .select('id, description, amount, paid_by, group_id, category, currency, archived')
    .eq('id', expenseId)
    .single();

  if (!gasto) return;

  if (gasto.archived) {
    alert(t('expense.edit.cant_archived'));
    return;
  }

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

  const selectCat = document.getElementById('edit-expense-category');
  if (selectCat) {
    selectCat.value = gasto.category || 'otros';
  }

  const selectMoneda = document.getElementById('edit-expense-currency');
  if (selectMoneda && gasto.currency) {
    selectMoneda.value = gasto.currency;
  }

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
  const categoria = document.getElementById('edit-expense-category')?.value || 'otros';
  const monedaGasto = (document.getElementById('edit-expense-currency')?.value || 'EUR').toUpperCase();

  btnSubmit.disabled = true;
  btnSubmit.textContent = t('expense.edit.saving');
  errorMsg.textContent = '';

  try {
    const { data: gastoActual } = await supabase
      .from('expenses')
      .select('group_id')
      .eq('id', expenseId)
      .single();

    let exchangeRate = 1;
    if (gastoActual) {
      const { data: grupoInfo } = await supabase
        .from('groups')
        .select('currency, manual_exchange_rate')
        .eq('id', gastoActual.group_id)
        .single();

      const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();
      const manualRateUSD = grupoInfo?.manual_exchange_rate;

      if (monedaGasto !== monedaGrupo) {
        const resultado = await convertirMontoConGrupo(1, monedaGasto, monedaGrupo, manualRateUSD);
        if (resultado.convertido) {
          exchangeRate = resultado.monto;
        }
      }
    }

    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        description: descripcion,
        amount: monto,
        paid_by: paidBy,
        category: categoria,
        currency: monedaGasto,
        exchange_rate: exchangeRate
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
    await recargarDetalleGrupo(groupId);

  } catch (error) {
    errorMsg.textContent = t('expense.edit.error', { mensaje: error.message });
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = t('expense.edit.submit');
  }
}
