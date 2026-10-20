// js/groups.js
import { supabase } from './supabase.js';
import { convertirMonto, obtenerTasa, MONEDAS_FRANKFURTER } from './currency.js';
import { t, tCategoria, aplicarTraducciones } from './i18n.js';

let mostrarArchivados = false;
let monedaPreferidaCache = null;

async function getMonedaPreferida() {
  if (monedaPreferidaCache) return monedaPreferidaCache;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single();

  monedaPreferidaCache = (perfil?.preferred_currency || 'EUR').toUpperCase();
  return monedaPreferidaCache;
}

// ==========================================
// HELPERS DE FECHAS
// ==========================================
function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const soloFecha = String(fechaStr).split('T')[0];
  const [y, m, d] = soloFecha.split('-');
  if (!y || !m || !d) return soloFecha;
  return `${d}/${m}/${y}`;
}

function formatearRangoFechas(inicio, fin) {
  if (!inicio && !fin) return '';
  if (inicio && !fin) return t('group.list.dates_from', { fecha: formatearFecha(inicio) });
  if (!inicio && fin) return t('group.list.dates_until', { fecha: formatearFecha(fin) });
  return t('group.list.dates_range', { inicio: formatearFecha(inicio), fin: formatearFecha(fin) });
}

// ==========================================
// CALCULAR TOTAL DE UN GRUPO + MI PARTE
// ==========================================
async function calcularTotalGrupo(groupId, monedaGrupo, closedTotal, dateClosed) {
  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, currency, exchange_rate')
    .eq('group_id', groupId)
    .eq('archived', false);

  if (!gastos || gastos.length === 0) {
    return { total: 0, miParte: 0, count: 0, congelado: false };
  }

  let total = 0;
  const monedaPorGasto = {};

  gastos.forEach(g => {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;

    monedaPorGasto[g.id] = { monedaGasto, tasa };

    if (monedaGasto === monedaGrupo) {
      total += monto;
    } else {
      total += monto * tasa;
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  let miParte = 0;

  if (user) {
    const expIds = gastos.map(g => g.id);
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('amount_owed, expense_id')
      .in('expense_id', expIds)
      .eq('user_id', user.id);

    (splits || []).forEach(s => {
      const info = monedaPorGasto[s.expense_id];
      if (!info) return;

      const monto = parseFloat(s.amount_owed) || 0;
      if (info.monedaGasto === monedaGrupo) {
        miParte += monto;
      } else {
        miParte += monto * info.tasa;
      }
    });
  }

  const totalFinal = (dateClosed && closedTotal != null)
    ? parseFloat(closedTotal)
    : total;

  return {
    total: totalFinal,
    miParte,
    count: gastos.length,
    congelado: !!(dateClosed && closedTotal != null)
  };
}

// ==========================================
// 1. CARGAR GRUPOS
// ==========================================
export async function cargarGrupos() {
  const groupsList = document.getElementById('groups-list');
  const headerTitle = document.querySelector('#groups-section h3');
  const btnToggle = document.getElementById('btn-toggle-archived');
  const btnNew = document.getElementById('btn-new-group');

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data: grupos, error } = await supabase
      .from('groups')
      .select('*')
      .eq('archived', mostrarArchivados)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (headerTitle) {
      headerTitle.textContent = mostrarArchivados
        ? t('dashboard.groups_archived')
        : t('dashboard.groups');
    }
    if (btnToggle) {
      btnToggle.textContent = mostrarArchivados
        ? t('dashboard.btn_active')
        : t('dashboard.btn_archived');
    }
    if (btnNew) {
      btnNew.style.display = mostrarArchivados ? 'none' : 'inline-block';
      btnNew.textContent = t('dashboard.btn_new');
    }

    const seccionMovimientos = document.getElementById('dashboard-recent')?.closest('.section-card');
    if (seccionMovimientos) {
      seccionMovimientos.style.display = mostrarArchivados ? 'none' : '';
    }

    if (!grupos || grupos.length === 0) {
      groupsList.innerHTML = mostrarArchivados
        ? `<p class="placeholder-text">${t('dashboard.groups_archived_empty')}</p>`
        : `<p class="placeholder-text">${t('dashboard.groups_empty')}</p>`;
      return;
    }

    groupsList.innerHTML = `<p class="placeholder-text">${t('dashboard.groups_calc')}</p>`;

    const monedaUsuario = await getMonedaPreferida();

    const gruposConTotales = await Promise.all(grupos.map(async (grupo) => {
      const monedaGrupo = (grupo.currency || 'EUR').toUpperCase();
      const info = await calcularTotalGrupo(
        grupo.id,
        monedaGrupo,
        grupo.closed_total,
        grupo.date_closed
      );

      let miParteConvertida = null;
      if (monedaUsuario && monedaUsuario !== monedaGrupo && info.miParte > 0) {
        const r = await convertirMonto(info.miParte, monedaGrupo, monedaUsuario);
        if (r.convertido) {
          miParteConvertida = r.monto;
        }
      }

      return { ...grupo, ...info, monedaGrupo, miParteConvertida, monedaUsuario };
    }));

    groupsList.innerHTML = gruposConTotales.map(grupo => {
      const rango = formatearRangoFechas(grupo.date_start, grupo.date_end);
      const cerrado = !!grupo.date_closed;

      let totalesHTML = '';
      if (grupo.count > 0 || cerrado) {
        const totalTexto = `${grupo.total.toFixed(2)} ${grupo.monedaGrupo}`;
        const miParteTexto = `${grupo.miParte.toFixed(2)} ${grupo.monedaGrupo}`;
        const countTexto = grupo.count > 0
          ? ` (${t('group.list.expenses_count', { count: grupo.count })})`
          : '';

        let conversionHTML = '';
        if (grupo.miParteConvertida != null) {
          conversionHTML = ` <span class="group-mi-parte-conv">(~${grupo.miParteConvertida.toFixed(2)} ${grupo.monedaUsuario})</span>`;
        }

        totalesHTML = `
          <span class="group-total">${t('group.list.total')}: ${totalTexto}${countTexto}</span>
          <span class="group-mi-parte">${t('group.list.my_share')}: ${miParteTexto}${conversionHTML}</span>
        `;
      }

      return `
        <div class="group-card ${grupo.archived ? 'archived' : ''}" data-id="${grupo.id}">
          <div class="group-info">
            <h4>${grupo.name}</h4>
            <span>${(grupo.type || 'otro').toUpperCase()} / ${grupo.monedaGrupo}</span>
            ${rango ? `<span class="group-dates">${rango}</span>` : ''}
            ${totalesHTML}
            ${grupo.archived ? `<span class="badge-archived">${t('group.list.badge_archived')}</span>` : ''}
            ${cerrado ? `<span class="badge-closed">${t('group.list.badge_closed')}</span>` : ''}
          </div>
          <div class="group-actions">
            ${grupo.archived 
              ? `<button class="btn-small btn-delete" data-id="${grupo.id}" data-name="${grupo.name}" title="${t('group.action.delete_title')}">&#128465;</button>
                 <button class="btn-small btn-restore" data-id="${grupo.id}" title="${t('group.action.restore_title')}">&#8634;</button>` 
              : `<button class="btn-small btn-archive" data-id="${grupo.id}" title="${t('group.action.archive_title')}">&#128230;</button>`
            }
            <span class="group-arrow">></span>
          </div>
        </div>
      `;
    }).join('');

    groupsList.querySelectorAll('.group-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-archive') || e.target.closest('.btn-restore') || e.target.closest('.btn-delete')) return;
        abrirDetalleGrupo(card.dataset.id);
      });
    });

    groupsList.querySelectorAll('.btn-archive').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await archivarGrupo(btn.dataset.id, true);
        await cargarGrupos();
        const { cargarDashboard } = await import('./dashboard.js');
        await cargarDashboard();
      });
    });

    groupsList.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await archivarGrupo(btn.dataset.id, false);
        await cargarGrupos();
        const { cargarDashboard } = await import('./dashboard.js');
        await cargarDashboard();
      });
    });

    groupsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const groupId = btn.dataset.id;
        const groupName = btn.dataset.name;
        if (!confirm(t('group.action.delete_confirm', { nombre: groupName }))) return;
        await eliminarGrupo(groupId);
        await cargarGrupos();
        const { cargarDashboard } = await import('./dashboard.js');
        await cargarDashboard();
      });
    });

  } catch (error) {
    console.error('Error detallado:', error);
    groupsList.innerHTML = `<p class="error-msg">${t('group.action.load_error', { mensaje: error.message || t('group.action.db_error') })}</p>`;
  }
}

// ==========================================
// 2. ARCHIVAR / DESARCHIVAR GRUPO
// ==========================================
export async function archivarGrupo(groupId, archivar) {
  if (archivar) {
    const { data: grupoInfo } = await supabase
      .from('groups')
      .select('date_closed')
      .eq('id', groupId)
      .single();

    if (!grupoInfo?.date_closed) {
      alert(t('group.action.need_close_computo'));
      return;
    }
  }

  const { error } = await supabase
    .from('groups')
    .update({ archived: archivar })
    .eq('id', groupId);

  if (error) {
    const clave = archivar ? 'group.action.archive_error' : 'group.action.restore_error';
    alert(t(clave, { mensaje: error.message }));
    throw error;
  }
}

// ==========================================
// 3. ELIMINAR GRUPO
// ==========================================
export async function eliminarGrupo(groupId) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    alert(t('group.action.delete_error', { mensaje: error.message }));
    throw error;
  }
}

// ==========================================
// 4. TOGGLE ARCHIVADOS
// ==========================================
export function toggleArchivados() {
  mostrarArchivados = !mostrarArchivados;
  cargarGrupos();
}

// ==========================================
// 5. CREAR GRUPO
// ==========================================
export async function crearGrupo(nombre, tipo, moneda) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error(t('group.create.no_auth'));

  if (moneda === '__other__') {
    const customInput = document.getElementById('group-currency-custom');
    const customCode = (customInput?.value || '').trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(customCode)) {
      throw new Error(t('group.create.currency_custom_error'));
    }
    moneda = customCode;
  }

  const dateStart = document.getElementById('group-date-start')?.value || null;
  const dateEnd = document.getElementById('group-date-end')?.value || null;
  const manualRateInput = document.getElementById('group-manual-rate')?.value;
  const manualRate = manualRateInput ? parseFloat(manualRateInput) : null;

  let manualRateUSD = null;
  if (manualRate && manualRate > 0) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('preferred_currency')
      .eq('id', user.id)
      .single();

    const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

    if (monedaUsuario === 'USD') {
      manualRateUSD = 1 / manualRate;
    } else {
      const tasaUsuarioAUSD = await obtenerTasa(monedaUsuario, 'USD');
      if (tasaUsuarioAUSD !== null) {
        manualRateUSD = tasaUsuarioAUSD / manualRate;
      } else {
        manualRateUSD = 1 / manualRate;
      }
    }
  }

  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([{
      name: nombre,
      type: tipo,
      currency: moneda,
      created_by: user.id,
      owner_id: user.id,
      date_start: dateStart,
      date_end: dateEnd,
      manual_exchange_rate: manualRateUSD
    }])
    .select()
    .single();

  if (groupError) throw groupError;

  try {
    await supabase
      .from('group_members')
      .insert([{
        group_id: groupData.id,
        user_id: user.id
      }]);
  } catch (e) {
    console.warn('No se pudo agregar al creador como miembro:', e);
  }

  return groupData;
}

// ==========================================
// 6. MODAL CREAR GRUPO
// ==========================================
export function initGroupModal() {
  const modal = document.getElementById('modal-group');
  const btnNew = document.getElementById('btn-new-group');
  const btnCancel = document.getElementById('btn-cancel-group');
  const form = document.getElementById('form-group');
  const errorMsg = document.getElementById('group-error');

  btnNew?.addEventListener('click', async () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();

    const resultadoAPI = document.getElementById('group-test-api-result');
    if (resultadoAPI) {
      resultadoAPI.style.display = 'none';
      resultadoAPI.textContent = '';
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();

      const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();
      const labelEl = document.getElementById('group-manual-rate-label');
      const currencyEl = document.getElementById('group-manual-rate-currency');
      if (labelEl) labelEl.textContent = t('group.create.manual_rate_label', { moneda: monedaUsuario });
      if (currencyEl) currencyEl.textContent = t('group.create.manual_rate_currency');
    }
  });

  btnCancel?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  const selectCurrency = document.getElementById('group-currency');
  const customWrap = document.getElementById('group-currency-custom-wrap');
  const customInput = document.getElementById('group-currency-custom');
  const customError = document.getElementById('group-currency-custom-error');
  const currencyEl = document.getElementById('group-manual-rate-currency');

  selectCurrency?.addEventListener('change', (e) => {
    const valor = e.target.value;

    if (valor === '__other__') {
      customWrap?.classList.remove('hidden');
      if (customInput) {
        customInput.value = '';
        customInput.focus();
      }
      if (currencyEl) currencyEl.textContent = 'XXX';
      if (customError) customError.style.display = 'none';
    } else {
      customWrap?.classList.add('hidden');
      if (customInput) customInput.value = '';
      if (currencyEl) currencyEl.textContent = valor || 'ARS';
      if (customError) customError.style.display = 'none';
    }
  });

  customInput?.addEventListener('input', (e) => {
    let valor = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '');
    e.target.value = valor;
    if (currencyEl) currencyEl.textContent = valor || 'XXX';

    if (customError) {
      if (valor.length > 0 && valor.length !== 3) {
        customError.textContent = t('group.create.currency_custom_error');
        customError.style.display = 'block';
      } else {
        customError.style.display = 'none';
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = t('group.create.creating');

    const nombre = document.getElementById('group-name').value.trim();
    const tipo = document.getElementById('group-type').value;
    const moneda = document.getElementById('group-currency').value;
    if (moneda !== '__other__') {
      const customInputReset = document.getElementById('group-currency-custom');
      if (customInputReset) customInputReset.value = '';
    }

    try {
      await crearGrupo(nombre, tipo, moneda);
      modal.classList.add('hidden');
      await cargarGrupos();
      const { cargarDashboard } = await import('./dashboard.js');
      await cargarDashboard();
    } catch (error) {
      errorMsg.textContent = t('group.create.error', { mensaje: error.message });
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = t('group.create.submit');
    }
  });

  // ==========================================
  // BOTON TEST API
  // ==========================================
  const btnTestAPI = document.getElementById('btn-test-api-group');
  const resultadoAPI = document.getElementById('group-test-api-result');

  btnTestAPI?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectCurrency) return;

    let codMon = 'EUR';
    const valorSelect = selectCurrency.value;

    if (valorSelect === '__other__') {
      codMon = (customInput?.value || '').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(codMon)) {
        mostrarResultadoAPI(t('group.test_api.invalid_code'), 'warn');
        return;
      }
    } else {
      codMon = (valorSelect || 'EUR').toUpperCase();
    }

    mostrarResultadoAPI(t('group.test_api.checking'), 'info');

    try {
      const tasa = await obtenerTasa(codMon, 'USD');

      if (tasa && tasa > 0) {
        const decimales = tasa < 0.01 ? 8 : 6;
        const mensaje = t('group.test_api.success', {
          moneda: codMon,
          tasa: tasa.toFixed(decimales)
        });
        mostrarResultadoAPI(mensaje, 'ok');
      } else {
        const mensaje = t('group.test_api.failed', { moneda: codMon });
        mostrarResultadoAPI(mensaje, 'warn');
      }
    } catch (err) {
      console.error('Error Test API:', err);
      mostrarResultadoAPI(t('group.test_api.error'), 'error');
    }
  });

  function mostrarResultadoAPI(texto, tipo) {
    if (!resultadoAPI) return;

    const estilos = {
      info:  { bg: '#ebf8ff', color: '#2c5282' },
      ok:    { bg: '#f0fff4', color: '#276749' },
      warn:  { bg: '#fffaf0', color: '#975a16' },
      error: { bg: '#fff5f5', color: '#c53030' }
    };

    const est = estilos[tipo] || estilos.info;

    resultadoAPI.textContent = texto;
    resultadoAPI.style.display = 'block';
    resultadoAPI.style.background = est.bg;
    resultadoAPI.style.color = est.color;
  }
}

// ==========================================
// 7. INICIALIZAR BOTON "ARCHIVADOS"
// ==========================================
export function initArchivedToggle() {
  const btn = document.getElementById('btn-toggle-archived');
  btn?.addEventListener('click', () => {
    toggleArchivados();
  });
}

// ==========================================
// 8. ABRIR DETALLE DEL GRUPO
// ==========================================
async function abrirDetalleGrupo(groupId) {
  const { cargarGastosDelGrupo, actualizarBadgeArchivados } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');
  const { cargarMiembrosDelGrupo } = await import('./members.js');

  const modal = document.getElementById('modal-group-detail');

  const { data: grupo } = await supabase
    .from('groups')
    .select('name, archived, currency, date_start, date_end, date_closed, closed_total, closed_summary_text, closed_summary_json, manual_exchange_rate')
    .eq('id', groupId)
    .single();

  document.getElementById('detail-group-name').textContent = grupo ? grupo.name : t('group.detail.title');
  modal.dataset.groupId = groupId;
  modal.dataset.groupName = grupo ? grupo.name : 'Group';
  modal.dataset.groupCurrency = (grupo?.currency || 'EUR').toUpperCase();
  modal.dataset.manualRate = grupo?.manual_exchange_rate || '';
  modal.dataset.groupArchived = grupo?.archived ? 'true' : 'false';

  const selectFiltro = document.getElementById('filter-category');
  if (selectFiltro) selectFiltro.value = '';

  const monedaGrupo = (grupo?.currency || 'EUR').toUpperCase();
  const infoTotal = await calcularTotalGrupo(
    groupId,
    monedaGrupo,
    grupo?.closed_total,
    grupo?.date_closed
  );

  const monedaUsuario = await getMonedaPreferida();
  let miParteConvertida = null;

  if (monedaUsuario && monedaUsuario !== monedaGrupo && infoTotal.miParte > 0) {
    const r = await convertirMonto(infoTotal.miParte, monedaGrupo, monedaUsuario);
    if (r.convertido) {
      miParteConvertida = r.monto;
    }
  }

  actualizarInfoGrupo(grupo, infoTotal, monedaGrupo, miParteConvertida, monedaUsuario);
  actualizarBotonesComputo(grupo, groupId);
  actualizarBotonCotizacion(grupo);

  document.getElementById('manual-rate-editor')?.classList.add('hidden');

  const extras = document.getElementById('group-extras');
  const btnExtras = document.getElementById('btn-toggle-extras');
  if (extras) extras.classList.add('hidden');
  if (btnExtras) {
    btnExtras.classList.remove('abierto');
    btnExtras.textContent = t('group.btn.view_extras');
  }
  modal.dataset.extrasCargados = 'false';

  const archivedExtras = document.getElementById('group-archived-expenses');
  const btnArchived = document.getElementById('btn-toggle-archived-expenses');
  if (archivedExtras) archivedExtras.classList.add('hidden');
  if (btnArchived) {
    btnArchived.classList.remove('abierto');
    btnArchived.textContent = t('group.btn.view_archived_expenses');
  }

  const estaArchivado = !!(grupo?.archived);
  const btnCalc = document.getElementById('btn-calculate-today');
  if (btnCalc) {
    btnCalc.style.display = estaArchivado ? 'inline-block' : 'none';
    btnCalc.textContent = t('group.btn.calc_today');
  }

  const btnAddExpense = document.getElementById('btn-add-expense-from-detail');
  if (btnAddExpense) {
    btnAddExpense.style.display = estaArchivado ? 'none' : 'inline-block';
  }

  const btnAddMember = document.getElementById('btn-add-member');
  if (btnAddMember) {
    btnAddMember.style.display = estaArchivado ? 'none' : 'inline-block';
  }

  const btnExport = document.getElementById('btn-export-group');
  if (btnExport) {
    btnExport.style.display = 'inline-block';
  }

  const btnExportRTF = document.getElementById('btn-export-rtf');
  if (btnExportRTF) {
    btnExportRTF.style.display = 'inline-block';
  }

  await mostrarResumenCierre(grupo, groupId, monedaGrupo);

  modal.classList.remove('hidden');
  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
  await cargarMiembrosDelGrupo(groupId);
  await actualizarBadgeArchivados(groupId);
}

// ==========================================
// 8b. MOSTRAR RESUMEN DE CIERRE
// ==========================================
async function mostrarResumenCierre(grupo, groupId, monedaGrupo) {
  const container = document.getElementById('group-closed-summary');
  if (!container) return;

  if (!grupo || !grupo.date_closed) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  const fmt = (n) => (parseFloat(n) || 0).toFixed(2);
  const fmtFecha = (f) => {
    if (!f) return '-';
    const s = String(f).split('T')[0];
    const [y, m, d] = s.split('-');
    return (y && m && d) ? `${d}/${m}/${y}` : s;
  };

  const snap = grupo.closed_summary_json;
  if (snap && typeof snap === 'object') {
    const personas = snap.personas || [];
    const deudas = snap.deudas || [];

    // Ordenar: primero los que deben (saldo negativo)
    const personasOrdenadas = [...personas].sort((a, b) => a.saldo - b.saldo);

    const totalGrupo = parseFloat(snap.total) || 0;
    const cantPersonas = personas.length;
    const teoricoPorPersona = cantPersonas > 0 ? totalGrupo / cantPersonas : 0;

    let html = `
      <div style="background: #fff5f5; border: 2px solid #feb2b2; border-radius: 10px; padding: 14px; margin-bottom: 15px;">
        <h4 style="color: #c53030; font-size: 1rem; margin-bottom: 10px;">
          &#128204; Resumen de Cierre (${formatearFecha(grupo.date_closed)})
        </h4>

        <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; align-items: flex-end;">
          <div>
            <p style="font-size: 0.75rem; color: #718096; margin: 0;">Gasto Total del Grupo</p>
            <p style="font-size: 1.4rem; font-weight: 800; color: #2d3748; margin: 2px 0 0 0;">
              ${fmt(totalGrupo)} ${snap.moneda}
            </p>
          </div>
          <div style="background: #edf2f7; padding: 6px 10px; border-radius: 8px;">
            <p style="font-size: 0.7rem; color: #4a5568; margin: 0; font-weight: 600;">Consumo Te&oacute;rico (Partes Iguales)</p>
            <p style="font-size: 0.95rem; font-weight: 700; color: #2b6cb0; margin: 2px 0 0 0;">
              ${fmt(teoricoPorPersona)} ${snap.moneda} / persona
            </p>
          </div>
        </div>

        <p style="font-size: 0.75rem; color: #718096; margin-bottom: 6px;">
          (El <strong>Consumo Real</strong> puede diferir del te&oacute;rico si alguna factura se dividi&oacute; en porcentajes distintos a 50/50).
        </p>
    `;

    if (personasOrdenadas.length > 0) {
      html += `
        <div style="margin-top: 10px;">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background: #fed7d7;">
                  <th style="padding: 6px 8px; text-align: left; border: 1px solid #feb2b2;">Persona</th>
                  <th style="padding: 6px 8px; text-align: right; border: 1px solid #feb2b2;">Pag&oacute;</th>
                  <th style="padding: 6px 8px; text-align: right; border: 1px solid #feb2b2;">Consumo Real</th>
                  <th style="padding: 6px 8px; text-align: center; border: 1px solid #feb2b2; width: 40%;">Estado Final</th>
                </tr>
              </thead>
              <tbody>
      `;

      personasOrdenadas.forEach((p, idx) => {
        const tieneDetalle = Array.isArray(p.pagos_detalle) && p.pagos_detalle.length > 0;
        const detalleId = `pago-detalle-${idx}`;

        const pagado = Math.abs(p.saldo) < 0.01;
        
        let estadoHTML = '';
        
        if (pagado) {
          const diferenciaOriginal = p.pago - p.consumio;
          
          let accion = 'Saldado';
          if (diferenciaOriginal < -0.01) {
            accion = `Pag&oacute;: ${Math.abs(diferenciaOriginal).toFixed(2)}`; 
          } else if (diferenciaOriginal > 0.01) {
            accion = `Cobr&oacute;: ${diferenciaOriginal.toFixed(2)}`; 
          }

          estadoHTML = `
            <span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#c6f6d5;color:#276749;font-size:0.75rem;font-weight:600; text-align:center; width: 100%;">
               &#9989; ${accion}<br><span style="font-weight:400;font-size:0.65rem;">${fmtFecha(p.fecha_pago)}</span>
            </span>
          `;
        } else if (p.saldo < 0) {
          const deuda = deudas.find(d => d.de === p.nombre);
          let aQuienNombre = deuda ? deuda.a : null;
          let aQuienId = deuda ? deuda.a_id : null;

          if (!aQuienNombre) {
            const contraparte = personas.find(other => Math.abs(other.saldo - Math.abs(p.saldo)) < 0.01 && other.saldo > 0);
            if (contraparte) {
              aQuienNombre = contraparte.nombre;
              aQuienId = contraparte.id;
            } else {
              aQuienNombre = 'Alguien';
            }
          }
          
          estadoHTML = `
            <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
              <span style="display:inline-block;padding:4px 8px;border-radius:6px;background:#fff5f5;color:#c53030;border:1px solid #feb2b2;font-size:0.75rem;font-weight:600; text-align:center;">
                 Debe pagar a ${aQuienNombre}: ${Math.abs(p.saldo).toFixed(2)}
              </span>
              <button class="btn-settle-summary" 
                      data-group="${groupId}" 
                      data-from="${p.id}" 
                      data-to-id="${aQuienId || ''}"
                      data-to-name="${aQuienNombre}"
                      data-amount="${Math.abs(p.saldo)}"
                      style="background:#e53e3e; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:0.7rem; cursor:pointer;">
                Saldar deuda
              </button>
            </div>
          `;
        } else {
          estadoHTML = `
            <span style="display:inline-block;padding:4px 8px;border-radius:6px;background:#f0fff4;color:#2f855a;border:1px solid #9ae6b4;font-size:0.75rem;font-weight:600; text-align:center;">
               Debe cobrar: ${Math.abs(p.saldo).toFixed(2)}
            </span>
          `;
        }

        html += `
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #fed7d7;">
              ${tieneDetalle
                ? `<button type="button" class="btn-toggle-pagos" data-target="${detalleId}" data-name="${p.nombre}"
                     style="background:none;border:none;padding:0;color:#3182ce;cursor:pointer;font-size:0.8rem;text-decoration:underline;">
                     &#9654; ${p.nombre}
                   </button>`
                : p.nombre
              }
            </td>
            <td style="padding: 6px 8px; text-align: right; border: 1px solid #fed7d7;">${fmt(p.pago)}</td>
            <td style="padding: 6px 8px; text-align: right; border: 1px solid #fed7d7;">${fmt(p.consumio)}</td>
            <td style="padding: 6px 8px; text-align: center; border: 1px solid #fed7d7;">
              ${estadoHTML}
            </td>
          </tr>
        `;

        if (tieneDetalle) {
          html += `
            <tr id="${detalleId}" class="fila-detalle-pagos" style="display:none;">
              <td colspan="4" style="padding: 8px 12px; border: 1px solid #fed7d7; background: #fffafa;">
                <div style="font-size: 0.75rem; color: #4a5568;">
                  <strong style="display:block;margin-bottom:6px;">Facturas pagadas por ${p.nombre}:</strong>
                  <table style="width:100%;border-collapse:collapse;font-size:0.75rem;">
                    <thead>
                      <tr style="background:#fefcbf;">
                        <th style="padding:4px 6px;text-align:left;border:1px solid #fef3c7;">Fecha</th>
                        <th style="padding:4px 6px;text-align:left;border:1px solid #fef3c7;">Descripcion</th>
                        <th style="padding:4px 6px;text-align:right;border:1px solid #fef3c7;">Monto (${snap.moneda})</th>
                        <th style="padding:4px 6px;text-align:right;border:1px solid #fef3c7;">Original</th>
                      </tr>
                    </thead>
                    <tbody>
          `;
          p.pagos_detalle.forEach(d => {
            const montoOrig = (d.moneda_original && d.moneda_original !== snap.moneda)
              ? `${fmt(d.monto_original)} ${d.moneda_original}`
              : '-';
            html += `
              <tr>
                <td style="padding:4px 6px;border:1px solid #fef3c7;white-space:nowrap;">${fmtFecha(d.fecha)}</td>
                <td style="padding:4px 6px;border:1px solid #fef3c7;">${d.descripcion || '-'}</td>
                <td style="padding:4px 6px;text-align:right;border:1px solid #fef3c7;font-weight:600;">${fmt(d.monto)}</td>
                <td style="padding:4px 6px;text-align:right;border:1px solid #fef3c7;color:#718096;">${montoOrig}</td>
              </tr>
            `;
          });
          html += `
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          `;
        }
      });

      html += `</tbody></table></div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-toggle-pagos').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const visible = target.style.display !== 'none';
        target.style.display = visible ? 'none' : '';
        btn.innerHTML = `${visible ? '&#9654;' : '&#9660;'} ${btn.dataset.name}`;
      });
    });

    container.querySelectorAll('.btn-settle-summary').forEach(btn => {
      btn.addEventListener('click', async () => {
        const gId = btn.dataset.group;
        const fromId = btn.dataset.from;
        const toId = btn.dataset.toId;
        const toName = btn.dataset.toName;
        const amount = parseFloat(btn.dataset.amount);

        if (!confirm(`Â¿Confirmas que se pagaron ${amount.toFixed(2)} ${snap.moneda}?`)) return;

        try {
          let targetToId = toId;

          if (!targetToId && toName && toName !== 'Alguien') {
            const { data: perfiles } = await supabase
              .from('profiles')
              .select('id')
              .eq('full_name', toName);
            
            if (perfiles && perfiles.length > 0) {
              targetToId = perfiles[0].id;
            } else {
              const { data: miembros } = await supabase
                .from('group_members')
                .select('user_id, profiles(full_name)')
                .eq('group_id', gId);
              
              const match = (miembros || []).find(m => {
                const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                return p?.full_name === toName;
              });
              if (match) targetToId = match.user_id;
            }
          }

          if (!targetToId) throw new Error(`No se pudo identificar a quiÃ©n pagarle (${toName})`);

          const { error } = await supabase.from('settlements').insert([{
            group_id: gId,
            from_user: fromId,
            to_user: targetToId,
            amount: amount,
            currency: snap.moneda,
            date: new Date().toISOString().split('T')[0]
          }]);

          if (error) throw error;

          const { mostrarBalance } = await import('./debtSolver.js');
          await mostrarBalance(gId);
          
          await cerrarComputo(gId);
          await abrirDetalleGrupo(gId);
          await cargarGrupos();
          
          const { cargarDashboard } = await import('./dashboard.js');
          await cargarDashboard();

        } catch (err) {
          alert("Error al saldar: " + err.message);
        }
      });
    });

    return;
  }
}

// ==========================================
// 9. ACTUALIZAR INFO DEL GRUPO
// ==========================================
function actualizarInfoGrupo(grupo, infoTotal, monedaGrupo, miParteConvertida = null, monedaUsuario = null) {
  const badgesContainer = document.getElementById('group-info-badges');
  if (!badgesContainer) return;

  if (!grupo) {
    badgesContainer.innerHTML = '';
    return;
  }

  const rango = formatearRangoFechas(grupo.date_start, grupo.date_end);
  const cerrado = !!grupo.date_closed;

  let html = '';

  if (rango) {
    html += `<p class="group-date-info">${rango}</p>`;
  }

  const sinGastos = infoTotal.count === 0;

  let conversionHTML = '';
  if (miParteConvertida != null) {
    conversionHTML = `<p class="group-total-conv">~${miParteConvertida.toFixed(2)} ${monedaUsuario}</p>`;
  }

  const labelTotal = cerrado ? t('group.detail.total_final') : t('group.detail.total_trip');

  html += `
    <div class="group-total-box">
      <div class="group-total-row">
        <div class="group-total-col">
          <p class="group-total-label">${labelTotal}</p>
          <p class="group-total-value">
            ${sinGastos ? '0.00' : infoTotal.total.toFixed(2)} ${monedaGrupo}
          </p>
          ${!sinGastos ? `<p class="group-total-count">(${t('group.list.expenses_count', { count: infoTotal.count })})</p>` : ''}
        </div>
        <div class="group-total-divider"></div>
        <div class="group-total-col">
          <p class="group-total-label">${t('group.detail.my_part')}</p>
          <p class="group-total-value group-total-value-mia">
            ${infoTotal.miParte.toFixed(2)} ${monedaGrupo}
          </p>
          ${conversionHTML}
        </div>
      </div>
    </div>
  `;

  if (cerrado) {
    html += `<p class="group-closed-date">${t('group.detail.closed_on', { fecha: formatearFecha(grupo.date_closed) })}</p>`;
  }

  if (grupo.manual_exchange_rate) {
    const rateUSD = parseFloat(grupo.manual_exchange_rate);
    html += `
      <div class="group-rate-info group-rate-manual">
        <span class="group-rate-badge">${t('group.detail.manual_rate_badge')}</span>
        <span class="group-rate-value">${t('group.detail.manual_rate_value', { moneda: monedaGrupo, rate: rateUSD.toFixed(6) })}</span>
      </div>
    `;
  } else if (!MONEDAS_FRANKFURTER.includes(monedaGrupo) && monedaGrupo !== 'ARS') {
    html += `
      <div class="group-rate-info group-rate-none">
        <span class="group-rate-badge">${t('group.detail.no_rate_badge')}</span>
        <span class="group-rate-value">${t('group.detail.no_rate_hint')}</span>
      </div>
    `;
  }

  badgesContainer.innerHTML = html;
}

// ==========================================
// 10. ACTUALIZAR BOTONES DE COMPUTO
// ==========================================
function actualizarBotonesComputo(grupo, groupId) {
  const btnClose = document.getElementById('btn-close-computo');
  const btnReopen = document.getElementById('btn-reopen-computo');
  if (!btnClose || !btnReopen) return;

  const cerrado = grupo && !!grupo.date_closed;
  const grupoArchivado = grupo && !!grupo.archived;

  if (grupoArchivado) {
    btnClose.style.display = 'none';
    btnReopen.style.display = 'none';
    return;
  }

  if (cerrado) {
    btnClose.style.display = 'none';
    btnReopen.style.display = 'inline-block';
    btnReopen.textContent = t('group.btn.reopen_computo');
  } else {
    btnClose.style.display = 'inline-block';
    btnReopen.style.display = 'none';
    btnClose.textContent = t('group.btn.close_computo');
  }
}

// ==========================================
// 11. ACTUALIZAR BOTON COTIZACION
// ==========================================
function actualizarBotonCotizacion(grupo) {
  const btnEdit = document.getElementById('btn-edit-manual-rate');
  if (!btnEdit) return;

  if (grupo && grupo.manual_exchange_rate) {
    btnEdit.style.display = 'inline-block';
    btnEdit.textContent = t('group.btn.edit_rate');
  } else {
    btnEdit.style.display = 'none';
  }
}

// ==========================================
// 12. CERRAR COMPUTO
// ==========================================
async function cerrarComputo(groupId) {
  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, currency, exchange_rate, paid_by, description, category, date')
    .eq('group_id', groupId)
    .eq('archived', false);

  const gastosArr = gastos || [];

  const montoEnGrupo = (g) => {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    if (monedaGasto === monedaGrupo) return monto;
    const tasaRaw = parseFloat(g.exchange_rate);
    return (isFinite(tasaRaw) && tasaRaw > 0) ? monto * tasaRaw : monto;
  };

  let total = 0;
  gastosArr.forEach(g => { total += montoEnGrupo(g); });

  let closedRateUSD = monedaGrupo === 'USD' ? 1 : (await obtenerTasa(monedaGrupo, 'USD') || null);
  const hoy = new Date().toISOString().split('T')[0];

  // --- Balance + deudas ---
  const { calcularBalance, simplificarDeudas } = await import('./debtSolver.js');
  const balance = await calcularBalance(groupId);
  const transacciones = simplificarDeudas(balance);

  // Splits
  const expIds = gastosArr.map(g => g.id);
  let splits = [];
  if (expIds.length > 0) {
    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount_owed')
      .in('expense_id', expIds);
    splits = splitsData || [];
  }

  // Nombres
  const userIds = new Set(Object.keys(balance));
  gastosArr.forEach(g => { if (g.paid_by) userIds.add(g.paid_by); });
  splits.forEach(s => { if (s.user_id) userIds.add(s.user_id); });

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', Array.from(userIds));
  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email || 'Usuario');

  // Consumo por persona
  const consumoPorUsuario = {};
  splits.forEach(s => {
    const gasto = gastosArr.find(g => g.id === s.expense_id);
    if (!gasto) return;
    const montoS = parseFloat(s.amount_owed) || 0;
    const monedaGasto = (gasto.currency || monedaGrupo).toUpperCase();
    
    let montoEnGrupoSplit = montoS;
    if (monedaGasto !== monedaGrupo) {
      const tasaRaw = parseFloat(gasto.exchange_rate);
      const tasa = (isFinite(tasaRaw) && tasaRaw > 0) ? tasaRaw : 1;
      montoEnGrupoSplit = montoS * tasa;
    }
    consumoPorUsuario[s.user_id] = (consumoPorUsuario[s.user_id] || 0) + montoEnGrupoSplit;
  });

  // Pagado por persona + detalle
  const pagadoPorUsuario = {};
  const pagosDetallePorUsuario = {};

  gastosArr.forEach(g => {
    if (!g.paid_by) return;
    const enGrupo = montoEnGrupo(g);
    pagadoPorUsuario[g.paid_by] = (pagadoPorUsuario[g.paid_by] || 0) + enGrupo;

    if (!pagosDetallePorUsuario[g.paid_by]) pagosDetallePorUsuario[g.paid_by] = [];
    pagosDetallePorUsuario[g.paid_by].push({
      fecha: g.date || null,
      descripcion: g.description || '',
      categoria: g.category || 'otros',
      monto: parseFloat(enGrupo.toFixed(2)),
      monto_original: parseFloat((parseFloat(g.amount) || 0).toFixed(2)),
      moneda_original: (g.currency || monedaGrupo).toUpperCase()
    });
  });

  Object.values(pagosDetallePorUsuario).forEach(arr => {
    arr.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  });

  // Armar personas
  const personasSnap = Array.from(userIds).map(uid => {
    const pagoR = parseFloat((pagadoPorUsuario[uid] || 0).toFixed(2));
    const consumioR = parseFloat((consumoPorUsuario[uid] || 0).toFixed(2));
    
    // EL FIX ESTÃ ACÃ: Usar el balance real (que ya resta los pagos) en lugar de pago - consumo
    const saldoR = parseFloat((balance[uid] || 0).toFixed(2));
    
    const pagado = Math.abs(saldoR) < 0.01;

    return {
      id: uid,
      nombre: nombres[uid] || 'Usuario',
      pago: pagoR,
      consumio: consumioR,
      saldo: saldoR,
      pagado: pagado,
      fecha_pago: pagado ? hoy : null, 
      pagos_detalle: pagosDetallePorUsuario[uid] || []
    };
  });

  // Ajuste de centavos
  if (personasSnap.length > 0) {
    const sumaSaldos = personasSnap.reduce((s, p) => s + p.saldo, 0);
    const ajuste = parseFloat((-sumaSaldos).toFixed(2));
    if (Math.abs(ajuste) >= 0.01) {
      const candidato = personasSnap.reduce((max, p) =>
        Math.abs(p.saldo) > Math.abs(max.saldo) ? p : max
      , personasSnap[0]);
      candidato.saldo = parseFloat((candidato.saldo + ajuste).toFixed(2));
      candidato.pagado = Math.abs(candidato.saldo) < 0.01; 
    }
  }

  // Buscar la fecha real del pago para los que ya saldaron
  const { data: settlements } = await supabase
    .from('settlements')
    .select('from_user, to_user, date, created_at')
    .eq('group_id', groupId);

  personasSnap.forEach(p => {
    if (p.pagado) {
      const miPago = (settlements || []).find(s => s.from_user === p.id || s.to_user === p.id);
      if (miPago) {
        p.fecha_pago = miPago.date || miPago.created_at;
      }
    }
  });

  const snapshot = {
    moneda: monedaGrupo,
    total: parseFloat(total.toFixed(2)),
    fecha_cierre: hoy,
    cantidad_gastos: gastosArr.length,
    personas: personasSnap,
    deudas: transacciones.map(tr => ({
      de: nombres[tr.from] || 'Usuario',
      a: nombres[tr.to] || 'Usuario',
      monto: parseFloat(tr.amount.toFixed(2))
    }))
  };

  let textoDeudas = 'Todo saldado al momento del cierre.';
  if (transacciones.length > 0) {
    textoDeudas = transacciones.map(tr =>
      `${nombres[tr.from] || 'Usuario'} le debe a ${nombres[tr.to] || 'Usuario'}: ${tr.amount.toFixed(2)} ${monedaGrupo}`
    ).join('; ');
  }

  const { error } = await supabase
    .from('groups')
    .update({
      date_closed: hoy,
      closed_total: parseFloat(total.toFixed(2)),
      closed_rate_usd: closedRateUSD,
      closed_summary_text: textoDeudas,
      closed_summary_json: snapshot
    })
    .eq('id', groupId);

  if (error) {
    alert(t('group.computo.close_error', { mensaje: error.message }));
    throw error;
  }
}

// ==========================================
// 13. REABRIR COMPUTO
// ==========================================
async function reabrirComputo(groupId) {
  const { error } = await supabase
    .from('groups')
    .update({
      date_closed: null,
      closed_total: null,
      closed_summary_text: null,
      closed_summary_json: null
    })
    .eq('id', groupId);

  if (error) {
    alert(t('group.computo.reopen_error', { mensaje: error.message }));
    throw error;
  }
}

// ==========================================
// 14. CALCULADORA "HOY"
// ==========================================
async function abrirCalculadora(groupId, groupName) {
  const modal = document.getElementById('modal-calculator');
  const body = document.getElementById('calculator-body');
  body.innerHTML = `<p class="placeholder-text">${t('group.calc.loading')}</p>`;
  modal.classList.remove('hidden');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      body.innerHTML = `<p class="error-msg">${t('group.calc.error')}</p>`;
      return;
    }

    const { data: grupoInfo } = await supabase
      .from('groups')
      .select('currency, closed_rate_usd, closed_total')
      .eq('id', groupId)
      .single();

    const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

    const { data: perfil } = await supabase
      .from('profiles')
      .select('preferred_currency')
      .eq('id', user.id)
      .single();

    const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

    const { data: gastos } = await supabase
      .from('expenses')
      .select('id, amount, currency, exchange_rate')
      .eq('group_id', groupId)
      .eq('archived', false);

    if (!gastos || gastos.length === 0) {
      body.innerHTML = `<p class="placeholder-text">${t('group.calc.empty')}</p>`;
      return;
    }

    const expIds = gastos.map(g => g.id);
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('expense_id, amount_owed')
      .in('expense_id', expIds)
      .eq('user_id', user.id);

    if (!splits || splits.length === 0) {
      body.innerHTML = `<p class="placeholder-text">${t('group.calc.no_participation')}</p>`;
      return;
    }

    const splitPorExpense = {};
    splits.forEach(s => {
      splitPorExpense[s.expense_id] = parseFloat(s.amount_owed) || 0;
    });

    let miParteHistorico = 0;
    let miParteHoy = 0;

    for (const g of gastos) {
      const monto = splitPorExpense[g.id];
      if (!monto) continue;

      const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
      const tasaGuardada = parseFloat(g.exchange_rate) || 1;

      if (monedaGasto === monedaGrupo) {
        miParteHistorico += monto;
        miParteHoy += monto;
      } else {
        miParteHistorico += monto * tasaGuardada;

        const tasaHoy = await obtenerTasa(monedaGasto, monedaGrupo);
        if (tasaHoy !== null) {
          miParteHoy += monto * tasaHoy;
        } else {
          miParteHoy += monto * tasaGuardada;
        }
      }
    }

    let miParteHistoricoEnUsuario = null;
    if (monedaUsuario !== monedaGrupo) {
      if (grupoInfo?.closed_rate_usd) {
        const usdHistorico = miParteHistorico * grupoInfo.closed_rate_usd;
        const tasaUSDUsuario = await obtenerTasa('USD', monedaUsuario);
        if (tasaUSDUsuario !== null) {
          miParteHistoricoEnUsuario = usdHistorico * tasaUSDUsuario;
        }
      } else {
        const tasaActual = await obtenerTasa(monedaGrupo, monedaUsuario);
        if (tasaActual !== null) {
          miParteHistoricoEnUsuario = miParteHistorico * tasaActual;
        }
      }
    }

    let miParteHoyEnUsuario = null;
    if (monedaUsuario !== monedaGrupo) {
      const tasaActual = await obtenerTasa(monedaGrupo, monedaUsuario);
      if (tasaActual !== null) {
        miParteHoyEnUsuario = miParteHoy * tasaActual;
      }
    }

    const diferencia = miParteHoy - miParteHistorico;
    const porcentaje = miParteHistorico > 0 ? (diferencia / miParteHistorico * 100) : 0;

    const difColor = diferencia > 0.01 ? '#e53e3e'
                   : diferencia < -0.01 ? '#38a169'
                   : '#718096';
    const difSigno = diferencia > 0 ? '+' : '';

    let noteKey = 'group.calc.diff_note_same';
    if (diferencia > 0.01) noteKey = 'group.calc.diff_note_up';
    else if (diferencia < -0.01) noteKey = 'group.calc.diff_note_down';

    const avisoHistorico = (!grupoInfo?.closed_rate_usd && monedaUsuario !== monedaGrupo)
      ? `<p style="font-size: 0.7rem; color: #b7791f; background: #fffaf0; padding: 8px; border-radius: 8px; margin-bottom: 12px; text-align: center;">${t('group.calc.no_historic')}</p>`
      : '';

    const conversionHistorico = (miParteHistoricoEnUsuario != null)
      ? `<p style="font-size: 1rem; color: #3182ce; margin-top: 4px;">~${miParteHistoricoEnUsuario.toFixed(2)} ${monedaUsuario}</p>`
      : '';

    const conversionHoy = (miParteHoyEnUsuario != null)
      ? `<p style="font-size: 1rem; color: #3182ce; margin-top: 4px;">~${miParteHoyEnUsuario.toFixed(2)} ${monedaUsuario}</p>`
      : '';

    let difEnUsuarioHTML = '';
    if (miParteHistoricoEnUsuario != null && miParteHoyEnUsuario != null) {
      const difUsuario = miParteHoyEnUsuario - miParteHistoricoEnUsuario;
      const difUsuarioSigno = difUsuario > 0 ? '+' : '';
      const difUsuarioPct = miParteHistoricoEnUsuario > 0
        ? (difUsuario / miParteHistoricoEnUsuario * 100)
        : 0;
      difEnUsuarioHTML = `
        <p style="font-size: 0.9rem; font-weight: 600; color: ${difColor}; margin-top: 4px;">
          ${difUsuarioSigno}${difUsuario.toFixed(2)} ${monedaUsuario} (${difUsuarioSigno}${difUsuarioPct.toFixed(1)}%)
        </p>
      `;
    }

    body.innerHTML = `
      <p style="text-align: center; color: #718096; margin-bottom: 20px;">
        ${t('group.calc.group', { nombre: groupName })}
      </p>

      ${avisoHistorico}

      <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 12px;">
        <p style="font-size: 0.8rem; color: #718096; margin-bottom: 4px;">${t('group.calc.my_part_historic')}</p>
        <p style="font-size: 1.5rem; font-weight: 700; color: #2d3748;">
          ${miParteHistorico.toFixed(2)} ${monedaGrupo}
        </p>
        ${conversionHistorico}
      </div>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 15px; margin-bottom: 12px; border: 1px solid #c6f6d5;">
        <p style="font-size: 0.8rem; color: #4a5568; margin-bottom: 4px;">${t('group.calc.my_part_today')}</p>
        <p style="font-size: 1.5rem; font-weight: 700; color: #2ecc87;">
          ${miParteHoy.toFixed(2)} ${monedaGrupo}
        </p>
        ${conversionHoy}
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 15px; border: 2px solid ${difColor}20;">
        <p style="font-size: 0.8rem; color: #718096; margin-bottom: 4px;">${t('group.calc.diff_label')}</p>
        <p style="font-size: 1.2rem; font-weight: 700; color: ${difColor};">
          ${difSigno}${diferencia.toFixed(2)} ${monedaGrupo}
          <small style="font-size: 0.8rem; font-weight: 400;">
            (${difSigno}${porcentaje.toFixed(1)}%)
          </small>
        </p>
        ${difEnUsuarioHTML}
        <p style="font-size: 0.75rem; color: #a0aec0; margin-top: 6px;">
          ${t(noteKey)}
        </p>
      </div>

      <p style="font-size: 0.75rem; color: #a0aec0; text-align: center; margin-top: 15px;">
        ${t('group.calc.footer')}
      </p>
    `;

  } catch (error) {
    console.error('Error calculadora:', error);
    body.innerHTML = `<p class="error-msg">${t('group.calc.error')}</p>`;
  }
}

// ==========================================
// 15. LISTENERS GLOBALES
// ==========================================
if (!window.__groupDetailListenersAttached) {
  window.__groupDetailListenersAttached = true;

  document.getElementById('btn-close-detail')?.addEventListener('click', () => {
    document.getElementById('modal-group-detail').classList.add('hidden');
  });

  document.getElementById('modal-group-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-group-detail') e.target.classList.add('hidden');
  });

  document.getElementById('btn-add-expense-from-detail')?.addEventListener('click', async () => {
    const modal = document.getElementById('modal-group-detail');

    if (modal.dataset.groupArchived === 'true') {
      alert(t('group.archived.no_add_expense') || 'No se pueden anadir gastos a un grupo archivado.');
      return;
    }

    const groupId = modal.dataset.groupId;
    const groupName = modal.dataset.groupName || 'Group';

    modal.classList.add('hidden');

    const { abrirModalGastoConGrupo } = await import('./expenses.js');
    await abrirModalGastoConGrupo(groupId, groupName);
  });

  document.getElementById('btn-close-expense-detail')?.addEventListener('click', () => {
    document.getElementById('modal-expense-detail').classList.add('hidden');
  });

  document.getElementById('modal-expense-detail')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-expense-detail') e.target.classList.add('hidden');
  });

  document.getElementById('btn-toggle-extras')?.addEventListener('click', async () => {
    const extras = document.getElementById('group-extras');
    const btn = document.getElementById('btn-toggle-extras');
    const modal = document.getElementById('modal-group-detail');
    if (!extras || !btn || !modal) return;

    const groupId = modal.dataset.groupId;
    const abierto = !extras.classList.contains('hidden');

    if (abierto) {
      extras.classList.add('hidden');
      btn.classList.remove('abierto');
      btn.textContent = t('group.btn.view_extras');
      return;
    }

    extras.classList.remove('hidden');
    btn.classList.add('abierto');
    btn.textContent = t('group.btn.hide_extras');

    if (modal.dataset.extrasCargados !== 'true' && groupId) {
      const { cargarHistorial } = await import('./history.js');
      const { cargarGraficos } = await import('./charts.js');
      const monedaGrupo = modal.dataset.groupCurrency || 'EUR';

      await cargarGraficos(groupId, monedaGrupo);
      await cargarHistorial(groupId);
      modal.dataset.extrasCargados = 'true';
    }
  });

  document.getElementById('btn-toggle-archived-expenses')?.addEventListener('click', async () => {
    const extras = document.getElementById('group-archived-expenses');
    const btn = document.getElementById('btn-toggle-archived-expenses');
    const modal = document.getElementById('modal-group-detail');
    if (!extras || !btn || !modal) return;

    const groupId = modal.dataset.groupId;
    const abierto = !extras.classList.contains('hidden');

    if (abierto) {
      extras.classList.add('hidden');
      btn.classList.remove('abierto');
      btn.textContent = t('group.btn.view_archived_expenses');
      return;
    }

    extras.classList.remove('hidden');
    btn.classList.add('abierto');
    btn.textContent = t('group.btn.hide_archived_expenses');

    if (groupId) {
      const { cargarGastosArchivados } = await import('./expenses.js');
      await cargarGastosArchivados(groupId);
    }
  });

  document.getElementById('btn-delete-expense')?.addEventListener('click', async () => {
    const { accionGasto } = await import('./expenses.js');
    await accionGasto();
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

  document.getElementById('btn-calculate-today')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    const groupName = document.getElementById('modal-group-detail').dataset.groupName || 'Group';
    if (!groupId) return;
    await abrirCalculadora(groupId, groupName);
  });

  document.getElementById('btn-close-calculator')?.addEventListener('click', () => {
    document.getElementById('modal-calculator').classList.add('hidden');
  });

  document.getElementById('modal-calculator')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-calculator') {
      document.getElementById('modal-calculator').classList.add('hidden');
    }
  });

  // ==========================================
  // CERRAR COMPUTO
  // ==========================================
  document.getElementById('btn-close-computo')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;

    if (!confirm(t('group.computo.close_confirm'))) return;

    await cerrarComputo(groupId);
    await abrirDetalleGrupo(groupId);
    await cargarGrupos();
    const { cargarDashboard } = await import('./dashboard.js');
    await cargarDashboard();
  });

  document.getElementById('btn-reopen-computo')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;
    if (!confirm(t('group.computo.reopen_confirm'))) return;
    await reabrirComputo(groupId);
    await abrirDetalleGrupo(groupId);
    await cargarGrupos();
    const { cargarDashboard } = await import('./dashboard.js');
    await cargarDashboard();
  });

  document.getElementById('btn-edit-manual-rate')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;

    const { data: { user } } = await supabase.auth.getUser();
    let monedaUsuario = 'EUR';
    if (user) {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();
      monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();
    }

    const { data: grupoInfo } = await supabase
      .from('groups')
      .select('currency, manual_exchange_rate')
      .eq('id', groupId)
      .single();

    const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();
    const rateUSD = grupoInfo?.manual_exchange_rate;

    let rateMostrar = '';
    if (rateUSD && rateUSD > 0) {
      if (monedaUsuario === 'USD') {
        rateMostrar = (1 / rateUSD).toFixed(2);
      } else {
        const tasa = await obtenerTasa(monedaUsuario, 'USD');
        if (tasa !== null) {
          rateMostrar = (tasa / rateUSD).toFixed(2);
        } else {
          rateMostrar = (1 / rateUSD).toFixed(2);
        }
      }
    }

    const editor = document.getElementById('manual-rate-editor');
    const input = document.getElementById('edit-manual-rate-input');
    const labelEl = document.getElementById('edit-manual-rate-label');
    const currencyEl = document.getElementById('edit-manual-rate-currency');
    const errorMsg = document.getElementById('manual-rate-error');

    if (labelEl) labelEl.textContent = `1 ${monedaUsuario} =`;
    if (currencyEl) currencyEl.textContent = monedaGrupo;
    if (input) input.value = rateMostrar;
    if (errorMsg) errorMsg.textContent = '';

    editor?.classList.remove('hidden');
  });

  document.getElementById('btn-cancel-manual-rate')?.addEventListener('click', () => {
    document.getElementById('manual-rate-editor')?.classList.add('hidden');
  });

  document.getElementById('btn-save-manual-rate')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    const input = document.getElementById('edit-manual-rate-input');
    const errorMsg = document.getElementById('manual-rate-error');

    if (!groupId || !input) return;

    const valor = parseFloat(input.value);
    if (isNaN(valor) || valor < 0) {
      errorMsg.textContent = t('group.rate.invalid');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('group.rate.no_auth'));

      const { data: perfil } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();

      const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

      let valorUSD = 1 / valor;
      if (monedaUsuario !== 'USD') {
        const tasa = await obtenerTasa(monedaUsuario, 'USD');
        if (tasa !== null) {
          valorUSD = tasa / valor;
        }
      }

      const { error } = await supabase
        .from('groups')
        .update({ manual_exchange_rate: valorUSD })
        .eq('id', groupId);

      if (error) throw error;

      document.getElementById('manual-rate-editor').classList.add('hidden');
      await abrirDetalleGrupo(groupId);
      await cargarGrupos();
      const { cargarDashboard } = await import('./dashboard.js');
      await cargarDashboard();

    } catch (error) {
      errorMsg.textContent = t('group.rate.save_error', { mensaje: error.message });
    }
  });

  // ==========================================
  // EXPORTAR CSV
  // ==========================================
  document.getElementById('btn-export-group')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;

    const btn = document.getElementById('btn-export-group');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '&#8987; Exporting...';

    try {
      await exportarGrupoCSV(groupId);
    } catch (e) {
      console.error('Error exportando CSV:', e);
      alert('Error al exportar CSV: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = textoOriginal;
    }
  });

  // ==========================================
  // EXPORTAR RTF
  // ==========================================
  document.getElementById('btn-export-rtf')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;

    const btn = document.getElementById('btn-export-rtf');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '&#8987; Exporting...';

    try {
      await exportarGrupoRTF(groupId);
    } catch (e) {
      console.error('Error exportando RTF:', e);
      alert('Error al exportar RTF: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = textoOriginal;
    }
  });
}

// ==========================================
// 16. EXPORTAR GRUPO A CSV
// ==========================================
async function exportarGrupoCSV(groupId) {
  const { data: grupo, error: errGrupo } = await supabase
    .from('groups')
    .select('name, currency, date_start, date_end, date_closed, closed_total, closed_summary_text, closed_summary_json, manual_exchange_rate')
    .eq('id', groupId)
    .single();

  if (errGrupo || !grupo) throw new Error('No se pudo cargar el grupo');

  const monedaGrupo = (grupo.currency || 'EUR').toUpperCase();

  const { data: gastos, error: errGastos } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, exchange_rate, date, category, paid_by, archived')
    .eq('group_id', groupId)
    .order('date', { ascending: true });

  if (errGastos) throw new Error('No se pudieron cargar los gastos');
  const gastosArr = gastos || [];

  const expIds = gastosArr.map(g => g.id);
  let splits = [];
  if (expIds.length > 0) {
    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount_owed')
      .in('expense_id', expIds);
    splits = splitsData || [];
  }

  const { data: settlementsData } = await supabase
    .from('settlements')
    .select('from_user, to_user')
    .eq('group_id', groupId);

  const userIds = new Set();
  gastosArr.forEach(g => { if (g.paid_by) userIds.add(g.paid_by); });
  splits.forEach(s => { if (s.user_id) userIds.add(s.user_id); });
  (settlementsData || []).forEach(s => {
    if (s.from_user) userIds.add(s.from_user);
    if (s.to_user) userIds.add(s.to_user);
  });

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', Array.from(userIds));

  const nombres = {};
  (perfiles || []).forEach(p => {
    nombres[p.id] = p.full_name || p.email || 'Usuario';
  });

  let totalGrupo = 0;
  const totalesPorUsuario = {};
  const participantes = new Set();

  gastosArr.forEach(g => {
    if (g.archived) return;
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;
    totalGrupo += montoEnGrupo;
  });

  splits.forEach(s => {
    const gasto = gastosArr.find(g => g.id === s.expense_id);
    if (!gasto || gasto.archived) return;
    const monto = parseFloat(s.amount_owed) || 0;
    const monedaGasto = (gasto.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(gasto.exchange_rate) || 1;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;
    totalesPorUsuario[s.user_id] = (totalesPorUsuario[s.user_id] || 0) + montoEnGrupo;
    participantes.add(s.user_id);
  });

  const { data: { user } } = await supabase.auth.getUser();
  const miParte = user ? (totalesPorUsuario[user.id] || 0) : 0;
  const miNombre = user ? (nombres[user.id] || 'Yo') : 'Yo';

  const lineas = [];

  lineas.push(['REPORTE DE GRUPO']);
  lineas.push(['Nombre', grupo.name]);
  lineas.push(['Moneda del grupo', monedaGrupo]);
  lineas.push(['Desde', grupo.date_start || '-']);
  lineas.push(['Hasta', grupo.date_end || '-']);
  lineas.push(['Cerrado', grupo.date_closed ? 'SI (' + grupo.date_closed + ')' : 'NO']);
  lineas.push(['Total del grupo', totalGrupo.toFixed(2) + ' ' + monedaGrupo]);
  if (grupo.date_closed && grupo.closed_total) {
    lineas.push(['Total congelado', parseFloat(grupo.closed_total).toFixed(2) + ' ' + monedaGrupo]);
  }
  lineas.push(['Mi parte (' + miNombre + ')', miParte.toFixed(2) + ' ' + monedaGrupo]);
  lineas.push([]);

  // ==========================================
  // DETALLE DE CIERRE (si existe snapshot)
  // ==========================================
  if (grupo.closed_summary_json && typeof grupo.closed_summary_json === 'object') {
    const snap = grupo.closed_summary_json;
    const personasSnap = snap.personas || [];
    const deudasSnap = snap.deudas || [];

    lineas.push(['DETALLE DE CIERRE']);
    lineas.push(['Persona', 'Pago', 'Consumo Real', 'Estado Final', 'Fecha de Pago', 'Moneda']);
    
    personasSnap.forEach(p => {
      const pagado = Math.abs(p.saldo) < 0.01;
      const diferenciaOriginal = p.pago - p.consumio;
      
      let estadoStr = 'Pendiente';
      if (pagado) {
        if (diferenciaOriginal < -0.01) estadoStr = `Pagó: ${Math.abs(diferenciaOriginal).toFixed(2)}`;
        else if (diferenciaOriginal > 0.01) estadoStr = `Cobró: ${diferenciaOriginal.toFixed(2)}`;
        else estadoStr = 'Saldado';
      } else if (p.saldo < 0) {
        estadoStr = `Debe pagar: ${Math.abs(p.saldo).toFixed(2)}`;
      } else {
        estadoStr = `Debe cobrar: ${Math.abs(p.saldo).toFixed(2)}`;
      }

      let fechaPagoStr = '-';
      if (pagado && p.fecha_pago) {
        const [y, m, d] = p.fecha_pago.split('T')[0].split('-');
        fechaPagoStr = `${d}/${m}/${y}`;
      }

      lineas.push([
        p.nombre,
        (parseFloat(p.pago) || 0).toFixed(2),
        (parseFloat(p.consumio) || 0).toFixed(2),
        estadoStr,
        fechaPagoStr,
        snap.moneda || monedaGrupo
      ]);
    });
    lineas.push([]);

    // Detalle de pagos por persona (facturas)
  //  const hayDetalle = personasSnap.some(p => Array.isArray(p.pagos_detalle) && p.pagos_detalle.length > 0);
  //  if (hayDetalle) {
   //   lineas.push(['FACTURAS PAGADAS POR PERSONA']);
   //   lineas.push([
    //    'Persona',
     //   'Fecha Factura',
      //  'Descripcion',
       // 'Monto en ' + (snap.moneda || monedaGrupo),
      //  'Monto original',
      //  'Moneda original'
     // ]);
     // personasSnap.forEach(p => {
     //   (p.pagos_detalle || []).forEach(d => {
     //     lineas.push([
     //       p.nombre,
     //       d.fecha || '',
      //      d.descripcion || '',
      //      (parseFloat(d.monto) || 0).toFixed(2),
      //      (parseFloat(d.monto_original) || 0).toFixed(2),
      //      d.moneda_original || snap.moneda || monedaGrupo
      //    ]);
    //    });
   //   });
   //   lineas.push([]);
 //   }

    lineas.push(['DEUDAS AL MOMENTO DEL CIERRE']);
    if (deudasSnap.length === 0) {
      lineas.push(['Todo saldado al momento del cierre.']);
    } else {
      lineas.push(['Deudor', 'Acreedor', 'Monto', 'Moneda']);
      deudasSnap.forEach(d => {
        lineas.push([
          d.de,
          d.a,
          (parseFloat(d.monto) || 0).toFixed(2),
          snap.moneda || monedaGrupo
        ]);
      });
    }
    lineas.push([]);
  } else if (grupo.closed_summary_text) {
    lineas.push(['RESUMEN DE CIERRE (texto)']);
    lineas.push([grupo.closed_summary_text]);
    lineas.push([]);
  }

  lineas.push(['TOTALES POR PERSONA']);
  lineas.push(['Persona', 'Total', 'Moneda']);
  Array.from(participantes).forEach(uid => {
    lineas.push([
      nombres[uid] || 'Usuario',
      (totalesPorUsuario[uid] || 0).toFixed(2),
      monedaGrupo
    ]);
  });
  lineas.push([]);

  lineas.push(['GASTOS']);
  lineas.push([
    'Fecha',
    'Descripcion',
    'Categoria',
    'Quien pago',
    'Monto original',
    'Moneda original',
    'Monto en ' + monedaGrupo,
    'Archivado',
    'Split (persona: monto ' + monedaGrupo + ')'
  ]);

  gastosArr.forEach(g => {
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;
    const monto = parseFloat(g.amount) || 0;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;

    const gastoSplits = splits.filter(s => s.expense_id === g.id);
    const splitStr = gastoSplits.map(s => {
      const nombre = nombres[s.user_id] || 'Usuario';
      const montoS = parseFloat(s.amount_owed) || 0;
      const montoSEnGrupo = monedaGasto === monedaGrupo ? montoS : montoS * tasa;
      return `${nombre}: ${montoSEnGrupo.toFixed(2)}`;
    }).join(' | ');

    lineas.push([
      g.date || '',
      g.description || '',
      g.category || 'otros',
      nombres[g.paid_by] || 'Usuario',
      monto.toFixed(2),
      monedaGasto,
      montoEnGrupo.toFixed(2),
      g.archived ? 'SI' : 'NO',
      splitStr
    ]);
  });

  const csv = lineas.map(fila =>
    fila.map(celda => {
      const s = String(celda ?? '');
      if (s.includes(';') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(';')
  ).join('\n');

  const nombreArchivo = 'grupo-' +
    (grupo.name || 'sin-nombre').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() +
    '-' + new Date().toISOString().split('T')[0] + '.csv';

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 17. EXPORTAR GRUPO A RTF
// ==========================================
async function exportarGrupoRTF(groupId) {
  const { data: grupo, error: errGrupo } = await supabase
    .from('groups')
    .select('name, currency, date_start, date_end, date_closed, closed_total, closed_summary_text, closed_summary_json, manual_exchange_rate')
    .eq('id', groupId)
    .single();

  if (errGrupo || !grupo) throw new Error('No se pudo cargar el grupo');

  const monedaGrupo = (grupo.currency || 'EUR').toUpperCase();

  const { data: gastos, error: errGastos } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, exchange_rate, date, category, paid_by, archived')
    .eq('group_id', groupId)
    .order('date', { ascending: true });

  if (errGastos) throw new Error('No se pudieron cargar los gastos');
  const gastosArr = gastos || [];

  const expIds = gastosArr.map(g => g.id);
  let splits = [];
  if (expIds.length > 0) {
    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount_owed')
      .in('expense_id', expIds);
    splits = splitsData || [];
  }

  const { data: settlementsData } = await supabase
    .from('settlements')
    .select('from_user, to_user')
    .eq('group_id', groupId);

  const userIds = new Set();
  gastosArr.forEach(g => { if (g.paid_by) userIds.add(g.paid_by); });
  splits.forEach(s => { if (s.user_id) userIds.add(s.user_id); });
  (settlementsData || []).forEach(s => {
    if (s.from_user) userIds.add(s.from_user);
    if (s.to_user) userIds.add(s.to_user);
  });

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', Array.from(userIds));

  const nombres = {};
  (perfiles || []).forEach(p => {
    nombres[p.id] = p.full_name || p.email || 'Usuario';
  });

  const { calcularBalance, simplificarDeudas } = await import('./debtSolver.js');
  const balance = await calcularBalance(groupId);
  const transacciones = simplificarDeudas(balance);

  let totalGrupo = 0;
  const totalesPorUsuario = {};
  const participantes = new Set();

  gastosArr.forEach(g => {
    if (g.archived) return;
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;
    totalGrupo += montoEnGrupo;
  });

  splits.forEach(s => {
    const gasto = gastosArr.find(g => g.id === s.expense_id);
    if (!gasto || gasto.archived) return;
    const monto = parseFloat(s.amount_owed) || 0;
    const monedaGasto = (gasto.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(gasto.exchange_rate) || 1;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;
    totalesPorUsuario[s.user_id] = (totalesPorUsuario[s.user_id] || 0) + montoEnGrupo;
    participantes.add(s.user_id);
  });

  const { data: { user } } = await supabase.auth.getUser();
  const miParte = user ? (totalesPorUsuario[user.id] || 0) : 0;
  const miNombre = user ? (nombres[user.id] || 'Yo') : 'Yo';

  const rtf = generarRTFReporte({
    grupo,
    monedaGrupo,
    gastos: gastosArr,
    splits,
    nombres,
    totalGrupo,
    totalesPorUsuario,
    participantes,
    miParte,
    miNombre,
    balance,
    transacciones
  });

  const nombreArchivo = 'grupo-' +
    (grupo.name || 'sin-nombre').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() +
    '-' + new Date().toISOString().split('T')[0] + '.rtf';

  const blob = new Blob([rtf], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 18. GENERAR RTF
// ==========================================
function generarRTFReporte(datos) {
  const {
    grupo, monedaGrupo, gastos, splits, nombres,
    totalGrupo, totalesPorUsuario, participantes,
    miParte, miNombre, balance, transacciones
  } = datos;

  const nl = '\r\n';
  let r = '';

  function esc(s) {
    s = String(s ?? '');
    let res = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c === 92)      res += '\\\\';
      else if (c === 123) res += '\\{';
      else if (c === 125) res += '\\}';
      else if (c === 10)  res += '\\line ';
      else if (c === 13)  res += '';
      else if (c > 127)   res += '\\u' + c + '?';
      else                res += s[i];
    }
    return res;
  }

  r += '{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang3082' + nl;
  r += '{\\fonttbl{\\f0 Calibri;}{\\f1 Consolas;}}' + nl;
  r += '{\\colortbl ;' + nl;
  r += '\\red46\\green125\\blue50;' + nl; // cf1 - Green
  r += '\\red100\\green100\\blue100;' + nl; // cf2 - Grey
  r += '\\red255\\green255\\blue255;' + nl; // cf3 - White
  r += '\\red46\\green125\\blue50;' + nl; // cf4 - Green
  r += '\\red230\\green245\\blue230;' + nl; // cf5 - Light green
  r += '\\red180\\green180\\blue180;' + nl; // cf6 - Border
  r += '\\red229\\green62\\blue62;' + nl; // cf7 - RED
  r += '}' + nl;
  r += '\\paperw12240\\paperh15840\\margl720\\margr720\\margt720\\margb720' + nl;
  r += '\\f0\\fs22' + nl;

  const fecha = new Date().toLocaleString();
  r += '\\pard\\qc\\b\\fs40\\cf1 PYM - Reporte\\b0\\fs22\\cf0\\par' + nl;
  r += '\\pard\\qc\\cf2 Grupo: ' + esc(grupo.name || '') + '\\cf0\\par' + nl;
  r += '\\pard\\qc\\cf2 Moneda: ' + esc(monedaGrupo) +
       '   |   Generado: ' + esc(fecha) + '\\cf0\\par' + nl;
  if (grupo.date_start || grupo.date_end) {
    r += '\\pard\\qc\\cf2 Fechas: ' + esc(grupo.date_start || '-') +
         ' a ' + esc(grupo.date_end || '-') + '\\cf0\\par' + nl;
  }
  r += '\\pard\\par' + nl;

  // === RESUMEN DE CIERRE ===
  if (grupo.date_closed) {
    r += '\\pard\\b\\fs28\\cf1 RESUMEN DE CIERRE (' + esc(grupo.date_closed) + ')\\b0\\fs22\\cf0\\par' + nl;

    if (grupo.closed_total) {
      r += '\\pard Total final congelado: \\b ' + esc(parseFloat(grupo.closed_total).toFixed(2) + ' ' + monedaGrupo) + '\\b0\\par' + nl;
    }

    if (grupo.closed_summary_json && typeof grupo.closed_summary_json === 'object') {
      const snap = grupo.closed_summary_json;
      const personasSnap = snap.personas || [];
      const deudasSnap = snap.deudas || [];

      if (personasSnap.length > 0) {
        r += '\\pard\\b Detalle por persona\\b0\\par' + nl;

        const p1 = 2500, p2 = 1400, p3 = 1600, p4 = 2500;
        const acum = [p1, p1+p2, p1+p2+p3, p1+p2+p3+p4];
        const borde = '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6';

        r += '\\trowd\\trgaph70\\trleft0\\trhdr';
        acum.forEach(x => { r += borde + '\\clcbpat4\\cellx' + x; });
        r += nl;
        ['Persona', 'Pago', 'Consumo Real', 'Estado Final'].forEach(h => {
          r += '\\pard\\intbl\\b\\cf3 ' + esc(h) + '\\b0\\cf0\\cell ';
        });
        r += '\\row' + nl;

        let contP = 0;
        personasSnap.forEach(p => {
          const fondo = (contP % 2 === 1) ? '\\clcbpat5' : '';
          const pagado = Math.abs(p.saldo) < 0.01;
          const diferenciaOriginal = p.pago - p.consumio;
          
          let estadoStr = 'Pendiente';
          let colorEstado = '\\cf7'; // rojo por defecto
          
          if (pagado) {
            if (diferenciaOriginal < -0.01) estadoStr = `Pagó: ${Math.abs(diferenciaOriginal).toFixed(2)}`;
            else if (diferenciaOriginal > 0.01) estadoStr = `Cobró: ${diferenciaOriginal.toFixed(2)}`;
            else estadoStr = 'Saldado';
            colorEstado = '\\cf1'; // verde
          } else if (p.saldo < 0) {
            estadoStr = `Debe pagar: ${Math.abs(p.saldo).toFixed(2)}`;
          } else {
            estadoStr = `Debe cobrar: ${Math.abs(p.saldo).toFixed(2)}`;
            colorEstado = '\\cf1';
          }

          if (pagado && p.fecha_pago) {
            const [y, m, d] = p.fecha_pago.split('T')[0].split('-');
            estadoStr += ` (${d}/${m}/${y})`;
          }

          r += '\\trowd\\trgaph70\\trleft0';
          acum.forEach(x => { r += borde + fondo + '\\cellx' + x; });
          r += nl;
          r += '\\pard\\intbl ' + esc(p.nombre) + '\\cell ';
          r += '\\pard\\intbl\\qr ' + esc((parseFloat(p.pago) || 0).toFixed(2)) + '\\cell ';
          r += '\\pard\\intbl\\qr ' + esc((parseFloat(p.consumio) || 0).toFixed(2)) + '\\cell ';
          r += '\\pard\\intbl\\qc ' + colorEstado + '\\b ' + esc(estadoStr) + '\\b0\\cf0\\cell ';
          r += '\\row' + nl;
          contP++;
        });
        r += '\\pard\\par' + nl;

        // Detalle de pagos por persona (facturas)
        const hayDetalle = personasSnap.some(p => Array.isArray(p.pagos_detalle) && p.pagos_detalle.length > 0);
        if (hayDetalle) {
          r += '\\pard\\b Facturas pagadas por persona\\b0\\par' + nl;

          const pcols = [2800, 1300, 3500, 1600, 1600];
          let px = 0;
          const pacum = [];
          pcols.forEach(w => { px += w; pacum.push(px); });
          const pborde = '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6';

          r += '\\trowd\\trgaph70\\trleft0\\trhdr';
          pacum.forEach(x => { r += pborde + '\\clcbpat4\\cellx' + x; });
          r += nl;
          ['Persona', 'Fecha', 'Descripcion', 'Monto (' + (snap.moneda || monedaGrupo) + ')', 'Original'].forEach(h => {
            r += '\\pard\\intbl\\b\\cf3 ' + esc(h) + '\\b0\\cf0\\cell ';
          });
          r += '\\row' + nl;

          let pcont = 0;
          personasSnap.forEach(p => {
            (p.pagos_detalle || []).forEach(d => {
              const fondo = (pcont % 2 === 1) ? '\\clcbpat5' : '';
              const montoOrig = (d.moneda_original && d.moneda_original !== snap.moneda)
                ? `${(parseFloat(d.monto_original) || 0).toFixed(2)} ${d.moneda_original}`
                : '';

              r += '\\trowd\\trgaph70\\trleft0';
              pacum.forEach(x => { r += pborde + fondo + '\\cellx' + x; });
              r += nl;
              r += '\\pard\\intbl ' + esc(p.nombre) + '\\cell ';
              r += '\\pard\\intbl ' + esc(d.fecha || '') + '\\cell ';
              r += '\\pard\\intbl ' + esc(d.descripcion || '') + '\\cell ';
              r += '\\pard\\intbl\\qr ' + (parseFloat(d.monto) || 0).toFixed(2) + '\\cell ';
              r += '\\pard\\intbl\\qr ' + esc(montoOrig) + '\\cell ';
              r += '\\row' + nl;
              pcont++;
            });
          });
          r += '\\pard\\par' + nl;
        }
      }

      // Deudas
      if (deudasSnap.length === 0) {
        r += '\\pard \\cf1\\b Todo saldado al momento del cierre.\\b0\\cf0\\par' + nl;
      } else {
        r += '\\pard\\b Deudas al momento del cierre\\b0\\par' + nl;
        deudasSnap.forEach(d => {
          r += '\\pard - ' + esc(d.de) + ' le debe transferir a ' + esc(d.a) + ': \\b ' +
               (parseFloat(d.monto) || 0).toFixed(2) + ' ' + esc(snap.moneda || monedaGrupo) + '\\b0\\par' + nl;
        });
      }
    } else {
      // Fallback: texto o transacciones actuales
      if (grupo.closed_summary_text && grupo.closed_summary_text !== 'Todo saldado al momento del cierre.') {
        r += '\\pard Deudas al momento del cierre:\\par' + nl;
        grupo.closed_summary_text.split(';').forEach(linea => {
          if (linea.trim()) r += '\\pard - ' + esc(linea.trim()) + '\\par' + nl;
        });
      } else if (transacciones && transacciones.length === 0) {
        r += '\\pard \\cf1\\b Todo saldado al momento del cierre.\\b0\\cf0\\par' + nl;
      } else if (transacciones && transacciones.length > 0) {
        r += '\\pard Deudas a saldar al momento del cierre:\\par' + nl;
        transacciones.forEach(tr => {
          r += '\\pard - ' + esc(nombres[tr.from] || 'Usuario') + ' le debe a ' + esc(nombres[tr.to] || 'Usuario') + ': \\b ' + tr.amount.toFixed(2) + ' ' + monedaGrupo + '\\b0\\par' + nl;
        });
      } else {
        r += '\\pard \\cf1\\b Todo saldado al momento del cierre.\\b0\\cf0\\par' + nl;
      }
    }
    r += '\\pard\\par' + nl;
  }

  // === Totales Generales ===
  r += '\\pard\\b\\fs28\\cf1 Totales Generales\\b0\\fs22\\cf0\\par' + nl;
  r += '\\pard Total del grupo: \\b ' + esc(totalGrupo.toFixed(2) + ' ' + monedaGrupo) + '\\b0\\par' + nl;
  r += '\\pard Mi parte (' + esc(miNombre) + '): \\b ' + esc(miParte.toFixed(2) + ' ' + monedaGrupo) + '\\b0\\par' + nl;
  r += '\\pard\\par' + nl;

  // === Totales por persona ===
  r += '\\pard\\b\\fs28\\cf1 Participacion por persona\\b0\\fs22\\cf0\\par' + nl;

  const anchoCol1 = 5000;
  const anchoCol2 = 4000;

  r += '\\trowd\\trgaph70\\trleft0';
  r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6\\clcbpat4\\cellx' + anchoCol1;
  r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6\\clcbpat4\\cellx' + (anchoCol1 + anchoCol2) + nl;
  r += '\\pard\\intbl\\b\\cf3 Persona\\b0\\cf0\\cell ';
  r += '\\pard\\intbl\\b\\cf3 Consumo\\b0\\cf0\\cell ';
  r += '\\row' + nl;

  let cont = 0;
  Array.from(participantes).forEach(uid => {
    const fondo = (cont % 2 === 1) ? '\\clcbpat5' : '';
    r += '\\trowd\\trgaph70\\trleft0';
    r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6' + fondo + '\\cellx' + anchoCol1;
    r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brds\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6' + fondo + '\\cellx' + (anchoCol1 + anchoCol2) + nl;
    r += '\\pard\\intbl ' + esc(nombres[uid] || 'Usuario') + '\\cell ';
    r += '\\pard\\intbl\\qr ' + esc((totalesPorUsuario[uid] || 0).toFixed(2) + ' ' + monedaGrupo) + '\\cell ';
    r += '\\row' + nl;
    cont++;
  });
  r += '\\pard\\par' + nl;

  // === BALANCE (solo si el grupo NO estÃ¡ cerrado) ===
  if (!grupo.date_closed && balance && Object.keys(balance).length > 0 && transacciones.length > 0) {
    r += '\\pard\\b\\fs28\\cf1 Balance actual\\b0\\fs22\\cf0\\par' + nl;

    const filasOrdenadas = Object.entries(balance)
      .filter(([_, monto]) => Math.abs(monto) >= 0.01)
      .sort((a, b) => b[1] - a[1]);

    const balAncho1 = 5000;
    const balAncho2 = 4000;

    r += '\\trowd\\trgaph70\\trleft0';
    r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6\\clcbpat4\\cellx' + balAncho1;
    r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6\\clcbpat4\\cellx' + (balAncho1 + balAncho2) + nl;
    r += '\\pard\\intbl\\b\\cf3 Persona\\b0\\cf0\\cell ';
    r += '\\pard\\intbl\\b\\cf3 Saldo (' + monedaGrupo + ')\\b0\\cf0\\cell ';
    r += '\\row' + nl;

    let contBal = 0;
    filasOrdenadas.forEach(([uid, monto]) => {
      const nombre = nombres[uid] || 'Usuario';
      const esPositivo = monto > 0;
      const signo = esPositivo ? '+' : '-';
      const color = esPositivo ? '\\cf1' : '\\cf7';
      const fondo = (contBal % 2 === 1) ? '\\clcbpat5' : '';

      r += '\\trowd\\trgaph70\\trleft0';
      r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6' + fondo + '\\cellx' + balAncho1;
      r += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6' + fondo + '\\cellx' + (balAncho1 + balAncho2) + nl;
      r += '\\pard\\intbl ' + esc(nombre) + '\\cell ';
      r += '\\pard\\intbl\\qr ' + color + '\\b ' + signo + Math.abs(monto).toFixed(2) + '\\b0\\cf0\\cell ';
      r += '\\row' + nl;
      contBal++;
    });

    r += '\\pard\\par' + nl;

    r += '\\pard\\b\\fs28\\cf1 Deudas pendientes\\b0\\fs22\\cf0\\par' + nl;
    transacciones.forEach(tr => {
      const fromName = nombres[tr.from] || 'Usuario';
      const toName = nombres[tr.to] || 'Usuario';
      r += '\\pard ' + esc(fromName) + ' debe a ' + esc(toName) + ': \\b ' +
           tr.amount.toFixed(2) + ' ' + monedaGrupo + '\\b0\\par' + nl;
    });
    r += '\\pard\\par' + nl;
  }

  // === Gastos ===
  r += '\\pard\\b\\fs28\\cf1 Gastos\\b0\\fs22\\cf0\\par' + nl;

  const cols = [1200, 2800, 1400, 1800, 800, 2800];
  let cellX = 0;
  const anchosAcum = [];
  cols.forEach(w => { cellX += w; anchosAcum.push(cellX); });

  const borde = '\\clbrdrt\\brdrs\\brdrw10\\brdrcf6\\clbrdrl\\brdrs\\brdrw10\\brdrcf6\\clbrdrb\\brdrs\\brdrw10\\brdrcf6\\clbrdrr\\brdrs\\brdrw10\\brdrcf6';

  r += '\\trowd\\trgaph70\\trleft0\\trhdr';
  anchosAcum.forEach((x) => {
    r += borde + '\\clcbpat4\\cellx' + x;
  });
  r += nl;
  const headersGastos = ['Fecha', 'Descripcion', 'Categoria', 'Quien pago', 'Monto (' + monedaGrupo + ')', 'Split'];
  headersGastos.forEach(h => {
    r += '\\pard\\intbl\\b\\cf3 ' + esc(h) + '\\b0\\cf0\\cell ';
  });
  r += '\\row' + nl;

  cont = 0;
  gastos.forEach(g => {
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;
    const monto = parseFloat(g.amount) || 0;
    const montoEnGrupo = monedaGasto === monedaGrupo ? monto : monto * tasa;

    const gastoSplits = splits.filter(s => s.expense_id === g.id);
    const splitStr = gastoSplits.map(s => {
      const nombre = nombres[s.user_id] || 'Usuario';
      const montoS = parseFloat(s.amount_owed) || 0;
      const montoSEnGrupo = monedaGasto === monedaGrupo ? montoS : montoS * tasa;
      return nombre + ': ' + montoSEnGrupo.toFixed(2);
    }).join('\\line ');

    const fondo = (cont % 2 === 1) ? '\\clcbpat5' : '';

    r += '\\trowd\\trgaph70\\trleft0';
    anchosAcum.forEach(x => {
      r += borde + fondo + '\\cellx' + x;
    });
    r += nl;

    r += '\\pard\\intbl ' + esc(g.date || '') + '\\cell ';
    r += '\\pard\\intbl ' + esc(g.description || '') + '\\cell ';
    r += '\\pard\\intbl ' + esc(g.category || 'otros') + '\\cell ';
    r += '\\pard\\intbl ' + esc(nombres[g.paid_by] || 'Usuario') + '\\cell ';
    r += '\\pard\\intbl\\qr ' + esc(montoEnGrupo.toFixed(2)) +
         (g.archived ? ' (arch)' : '') + '\\cell ';
    r += '\\pard\\intbl ' + esc(splitStr) + '\\cell ';
    r += '\\row' + nl;
    cont++;
  });

  r += '\\pard' + nl;
  r += '}' + nl;

  return r;
}

// ==========================================
// 19. INVALIDAR CACHE DE MONEDA PREFERIDA
// ==========================================
export function invalidarCacheMoneda() {
  monedaPreferidaCache = null;
}
