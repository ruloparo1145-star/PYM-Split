// js/groups.js
import { supabase } from './supabase.js';
import { convertirMonto, obtenerTasa } from './currency.js';

let mostrarArchivados = false;

// Cache de la moneda preferida del usuario
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
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatearRangoFechas(inicio, fin) {
  if (!inicio && !fin) return '';
  if (inicio && !fin) return `Desde ${formatearFecha(inicio)}`;
  if (!inicio && fin) return `Hasta ${formatearFecha(fin)}`;
  return `${formatearFecha(inicio)} - ${formatearFecha(fin)}`;
}

// ==========================================
// CALCULAR TOTAL DE UN GRUPO + MI PARTE
// ==========================================
async function calcularTotalGrupo(groupId, monedaGrupo, closedTotal, dateClosed) {
  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, currency, exchange_rate')
    .eq('group_id', groupId);

  if (!gastos || gastos.length === 0) {
    return { total: 0, miParte: 0, count: 0, congelado: false };
  }

  // 1. Total del grupo
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

  // 2. Mi parte
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
    if (btnNew) {
      btnNew.style.display = mostrarArchivados ? 'none' : 'inline-block';
    }

    if (!grupos || grupos.length === 0) {
      groupsList.innerHTML = mostrarArchivados
        ? '<p class="placeholder-text">No tienes grupos archivados.</p>'
        : '<p class="placeholder-text">Aun no tienes grupos. Crea uno nuevo!</p>';
      return;
    }

    groupsList.innerHTML = '<p class="placeholder-text">Calculando totales...</p>';

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
        const countTexto = grupo.count > 0 ? ` (${grupo.count} gastos)` : '';

        let conversionHTML = '';
        if (grupo.miParteConvertida != null) {
          conversionHTML = ` <span class="group-mi-parte-conv">(~${grupo.miParteConvertida.toFixed(2)} ${grupo.monedaUsuario})</span>`;
        }

        totalesHTML = `
          <span class="group-total">Total: ${totalTexto}${countTexto}</span>
          <span class="group-mi-parte">Mi parte: ${miParteTexto}${conversionHTML}</span>
        `;
      }

      return `
        <div class="group-card ${grupo.archived ? 'archived' : ''}" data-id="${grupo.id}">
          <div class="group-info">
            <h4>${grupo.name}</h4>
            <span>${(grupo.type || 'otro').toUpperCase()} / ${grupo.monedaGrupo}</span>
            ${rango ? `<span class="group-dates">${rango}</span>` : ''}
            ${totalesHTML}
            ${grupo.archived ? '<span class="badge-archived">Archivado</span>' : ''}
            ${cerrado ? '<span class="badge-closed">Cerrado</span>' : ''}
          </div>
          <div class="group-actions">
            ${grupo.archived 
              ? `<button class="btn-small btn-delete" data-id="${grupo.id}" data-name="${grupo.name}" title="Eliminar">&#128465;</button>
                 <button class="btn-small btn-restore" data-id="${grupo.id}" title="Restaurar">&#8634;</button>` 
              : `<button class="btn-small btn-archive" data-id="${grupo.id}" title="Archivar">&#128230;</button>`
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
      });
    });

    groupsList.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await archivarGrupo(btn.dataset.id, false);
        await cargarGrupos();
      });
    });

    groupsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const groupId = btn.dataset.id;
        const groupName = btn.dataset.name;
        if (!confirm(`Eliminar el grupo "${groupName}" y TODOS sus datos? Esta accion no se puede deshacer.`)) return;
        await eliminarGrupo(groupId);
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
// 3. ELIMINAR GRUPO
// ==========================================
export async function eliminarGrupo(groupId) {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    alert('Error al eliminar el grupo: ' + error.message);
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
// 5. CREAR GRUPO (con cotizacion manual)
// ==========================================
export async function crearGrupo(nombre, tipo, moneda) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const dateStart = document.getElementById('group-date-start')?.value || null;
  const dateEnd = document.getElementById('group-date-end')?.value || null;
  const manualRateInput = document.getElementById('group-manual-rate')?.value;
  const manualRate = manualRateInput ? parseFloat(manualRateInput) : null;

  // Convertir la cotizacion manual a USD (referencia universal)
  let manualRateUSD = null;
  if (manualRate && manualRate > 0) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('preferred_currency')
      .eq('id', user.id)
      .single();

    const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

    if (monedaUsuario === 'USD') {
      manualRateUSD = manualRate;
    } else {
      const tasaUsuarioAUSD = await obtenerTasa(monedaUsuario, 'USD');
      if (tasaUsuarioAUSD !== null) {
        manualRateUSD = manualRate / tasaUsuarioAUSD;
      } else {
        manualRateUSD = manualRate;
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

    // Actualizar label del input de cotizacion manual
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
      if (labelEl) labelEl.textContent = `1 ${monedaUsuario} =`;
      if (currencyEl) currencyEl.textContent = 'Moneda grupo';
    }
  });

  btnCancel?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Escuchar cambio de moneda del grupo
  const selectCurrency = document.getElementById('group-currency');
  selectCurrency?.addEventListener('change', (e) => {
    const currencyEl = document.getElementById('group-manual-rate-currency');
    if (currencyEl) currencyEl.textContent = e.target.value || 'ARS';
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
  const { cargarGastosDelGrupo } = await import('./expenses.js');
  const { mostrarBalance } = await import('./debtSolver.js');
  const { cargarMiembrosDelGrupo } = await import('./members.js');
  const { cargarHistorial } = await import('./history.js');
  const { cargarGraficos } = await import('./charts.js');

  const modal = document.getElementById('modal-group-detail');

  const { data: grupo } = await supabase
    .from('groups')
    .select('name, archived, currency, date_start, date_end, date_closed, closed_total, manual_exchange_rate')
    .eq('id', groupId)
    .single();

  document.getElementById('detail-group-name').textContent = grupo ? grupo.name : 'Detalle';
  modal.dataset.groupId = groupId;
  modal.dataset.groupName = grupo ? grupo.name : 'Grupo';
  modal.dataset.groupCurrency = (grupo?.currency || 'EUR').toUpperCase();
  modal.dataset.manualRate = grupo?.manual_exchange_rate || '';

  const selectFiltro = document.getElementById('filter-category');
  if (selectFiltro) selectFiltro.value = '';

  // Total del grupo
  const monedaGrupo = (grupo?.currency || 'EUR').toUpperCase();
  const infoTotal = await calcularTotalGrupo(
    groupId,
    monedaGrupo,
    grupo?.closed_total,
    grupo?.date_closed
  );

  // Convertir mi parte
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

  // Ocultar editor de cotizacion al abrir
  document.getElementById('manual-rate-editor')?.classList.add('hidden');

  modal.classList.remove('hidden');
  await cargarGastosDelGrupo(groupId);
  await mostrarBalance(groupId);
  await cargarMiembrosDelGrupo(groupId);
  await cargarHistorial(groupId);
  await cargarGraficos(groupId);
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

  html += `
    <div class="group-total-box">
      <div class="group-total-row">
        <div class="group-total-col">
          <p class="group-total-label">
            ${cerrado ? 'Total final' : 'Total del viaje'}
          </p>
          <p class="group-total-value">
            ${sinGastos ? '0.00' : infoTotal.total.toFixed(2)} ${monedaGrupo}
          </p>
          ${!sinGastos ? `<p class="group-total-count">(${infoTotal.count} gastos)</p>` : ''}
        </div>
        <div class="group-total-divider"></div>
        <div class="group-total-col">
          <p class="group-total-label">Mi parte</p>
          <p class="group-total-value group-total-value-mia">
            ${infoTotal.miParte.toFixed(2)} ${monedaGrupo}
          </p>
          ${conversionHTML}
        </div>
      </div>
    </div>
  `;

  if (cerrado) {
    html += `<p class="group-closed-date">Cerrado el ${formatearFecha(grupo.date_closed)}</p>`;
  }

  // Mostrar cotizacion manual si existe
  if (grupo.manual_exchange_rate) {
    html += `<p class="group-manual-rate-info">Cotizacion manual: ${parseFloat(grupo.manual_exchange_rate).toFixed(2)} USD</p>`;
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

  if (cerrado) {
    btnClose.style.display = 'none';
    btnReopen.style.display = 'inline-block';
  } else {
    btnClose.style.display = 'inline-block';
    btnReopen.style.display = 'none';
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
    .select('amount, currency, exchange_rate')
    .eq('group_id', groupId);

  let total = 0;
  (gastos || []).forEach(g => {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasa = parseFloat(g.exchange_rate) || 1;

    if (monedaGasto === monedaGrupo) {
      total += monto;
    } else {
      total += monto * tasa;
    }
  });

  const hoy = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('groups')
    .update({
      date_closed: hoy,
      closed_total: parseFloat(total.toFixed(2))
    })
    .eq('id', groupId);

  if (error) {
    alert('Error al cerrar computo: ' + error.message);
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
      closed_total: null
    })
    .eq('id', groupId);

  if (error) {
    alert('Error al reabrir computo: ' + error.message);
    throw error;
  }
}

// ==========================================
// 14. CALCULADORA "HOY"
// ==========================================
async function abrirCalculadora(groupId, groupName) {
  const modal = document.getElementById('modal-calculator');
  const body = document.getElementById('calculator-body');
  body.innerHTML = '<p class="placeholder-text">Calculando...</p>';
  modal.classList.remove('hidden');

  try {
    const { data: grupoInfo } = await supabase
      .from('groups')
      .select('currency')
      .eq('id', groupId)
      .single();

    const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

    const { data: gastos } = await supabase
      .from('expenses')
      .select('amount, currency, exchange_rate')
      .eq('group_id', groupId);

    if (!gastos || gastos.length === 0) {
      body.innerHTML = '<p class="placeholder-text">Este grupo no tiene gastos.</p>';
      return;
    }

    const { simularHoy } = await import('./currency.js');
    const resultado = await simularHoy(gastos, monedaGrupo);

    const difColor = resultado.diferencia > 0.01 ? '#e53e3e'
                   : resultado.diferencia < -0.01 ? '#38a169'
                   : '#718096';
    const difSigno = resultado.diferencia > 0 ? '+' : '';
    const flecha = resultado.diferencia > 0.01 ? 'subio' : resultado.diferencia < -0.01 ? 'bajo' : 'igual';

    body.innerHTML = `
      <p style="text-align: center; color: #718096; margin-bottom: 20px;">
        Grupo: <strong>${groupName}</strong>
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 12px;">
        <p style="font-size: 0.8rem; color: #718096; margin-bottom: 4px;">Total gastado (con tasas del momento)</p>
        <p style="font-size: 1.5rem; font-weight: 700; color: #2d3748;">
          ${resultado.totalHistorico.toFixed(2)} ${resultado.moneda}
        </p>
      </div>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 15px; margin-bottom: 12px; border: 1px solid #c6f6d5;">
        <p style="font-size: 0.8rem; color: #4a5568; margin-bottom: 4px;">Si lo hicieras HOY</p>
        <p style="font-size: 1.5rem; font-weight: 700; color: #2ecc87;">
          ${resultado.totalHoy.toFixed(2)} ${resultado.moneda}
        </p>
      </div>

      <div style="background: #ffffff; border-radius: 12px; padding: 15px; border: 2px solid ${difColor}20;">
        <p style="font-size: 0.8rem; color: #718096; margin-bottom: 4px;">Diferencia</p>
        <p style="font-size: 1.2rem; font-weight: 700; color: ${difColor};">
          ${difSigno}${resultado.diferencia.toFixed(2)} ${resultado.moneda}
          <small style="font-size: 0.8rem; font-weight: 400;">
            (${difSigno}${resultado.porcentaje.toFixed(1)}%)
          </small>
        </p>
        <p style="font-size: 0.75rem; color: #a0aec0; margin-top: 6px;">
          La moneda ${flecha} respecto al momento del viaje.
        </p>
      </div>

      <p style="font-size: 0.75rem; color: #a0aec0; text-align: center; margin-top: 15px;">
        Este calculo es solo informativo. No modifica ningun dato.
      </p>
    `;

  } catch (error) {
    console.error('Error calculadora:', error);
    body.innerHTML = '<p class="error-msg">Error al calcular.</p>';
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

  document.getElementById('btn-calculate-today')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    const groupName = document.getElementById('modal-group-detail').dataset.groupName || 'Grupo';
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

  document.getElementById('btn-close-computo')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;
    if (!confirm('Cerrar el computo de este grupo? Se guardara la fecha y el total final.')) return;
    await cerrarComputo(groupId);
    await abrirDetalleGrupo(groupId);
    await cargarGrupos();
  });

  document.getElementById('btn-reopen-computo')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    if (!groupId) return;
    if (!confirm('Reabrir el computo? Se borrara la fecha de cierre y el total final guardado.')) return;
    await reabrirComputo(groupId);
    await abrirDetalleGrupo(groupId);
    await cargarGrupos();
  });

  // BOTON EDITAR COTIZACION
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

    // Convertir de USD a la moneda del usuario para mostrarlo
    let rateMostrar = '';
    if (rateUSD && rateUSD > 0) {
      if (monedaUsuario === 'USD') {
        rateMostrar = rateUSD.toFixed(2);
      } else {
        const tasa = await obtenerTasa('USD', monedaUsuario);
        if (tasa !== null) {
          rateMostrar = (rateUSD * tasa).toFixed(2);
        } else {
          rateMostrar = rateUSD.toFixed(2);
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

  // CANCELAR EDICION DE COTIZACION
  document.getElementById('btn-cancel-manual-rate')?.addEventListener('click', () => {
    document.getElementById('manual-rate-editor')?.classList.add('hidden');
  });

  // GUARDAR COTIZACION
  document.getElementById('btn-save-manual-rate')?.addEventListener('click', async () => {
    const groupId = document.getElementById('modal-group-detail').dataset.groupId;
    const input = document.getElementById('edit-manual-rate-input');
    const errorMsg = document.getElementById('manual-rate-error');

    if (!groupId || !input) return;

    const valor = parseFloat(input.value);
    if (isNaN(valor) || valor < 0) {
      errorMsg.textContent = 'Ingresa un numero valido.';
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data: perfil } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();

      const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

      // Convertir a USD
      let valorUSD = valor;
      if (monedaUsuario !== 'USD') {
        const tasa = await obtenerTasa(monedaUsuario, 'USD');
        if (tasa !== null) {
          valorUSD = valor * tasa;
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

    } catch (error) {
      errorMsg.textContent = 'Error al guardar: ' + error.message;
    }
  });
}
