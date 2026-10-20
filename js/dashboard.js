// js/dashboard.js
import { supabase } from './supabase.js';
import { sumarConvertido, formatearMonto, convertirMonto } from './currency.js';
import { t } from './i18n.js';

let chartHistoryInstance = null;
let rangoActual = 'active';

// ==========================================
// Helper: calcular monto en moneda del grupo con tasa HISTORICA
// ==========================================
function montoEnMonedaGrupo(g, monedaGrupo) {
  const monto = parseFloat(g.amount) || 0;
  const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
  const monedaGrupoUp = monedaGrupo.toUpperCase();

  if (monedaGasto === monedaGrupoUp) return monto;

  const tasaRaw = parseFloat(g.exchange_rate);
  let tasa;
  if (!isFinite(tasaRaw) || tasaRaw <= 0) {
    console.warn('[dashboard] exchange_rate invalido, usando 1:', {
      id: g.id, exchange_rate: g.exchange_rate
    });
    tasa = 1;
  } else {
    tasa = tasaRaw;
  }
  return monto * tasa;
}

// ==========================================
// CARGAR DASHBOARD
// ==========================================
export async function cargarDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  document.querySelectorAll('.dash-tab').forEach(tab => {
    if (tab.dataset.range === rangoActual) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  const { data: perfil } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single();

  const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

  try {
    let queryGrupos = supabase
      .from('groups')
      .select('id, currency');

    if (rangoActual === 'active') {
      queryGrupos = queryGrupos.eq('archived', false);
    } else if (rangoActual === 'archived') {
      queryGrupos = queryGrupos.eq('archived', true);
    }

    const { data: grupos } = await queryGrupos;

    const groupIds = (grupos || []).map(g => g.id);
    const monedaPorGrupo = {};
    (grupos || []).forEach(g => monedaPorGrupo[g.id] = (g.currency || 'EUR').toUpperCase());

    if (groupIds.length === 0) {
      renderizarVacio(monedaUsuario);
      return;
    }

    // Traemos exchange_rate tambien
    const { data: gastosRango } = await supabase
      .from('expenses')
      .select('id, description, amount, currency, exchange_rate, date, paid_by, group_id, category')
      .in('group_id', groupIds)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    // FIX #1: convertir con tasa HISTORICA a moneda del grupo, luego a monedaUsuario
    const itemsRango = (gastosRango || []).map(g => {
      const monedaGrupo = monedaPorGrupo[g.group_id] || 'EUR';
      const montoEnGrupo = montoEnMonedaGrupo(g, monedaGrupo);
      return { monto: montoEnGrupo, moneda: monedaGrupo };
    });

    const resultado = await sumarConvertido(itemsRango, monedaUsuario);

    // Balance global
    const balance = {};

    if (gastosRango && gastosRango.length > 0) {
      // 1. Sumar lo que pago cada uno (con tasa HISTORICA a moneda del grupo)
      const sumasPorPersona = {};
      gastosRango.forEach(g => {
        const monedaGrupo = monedaPorGrupo[g.group_id] || 'EUR';
        const montoEnGrupo = montoEnMonedaGrupo(g, monedaGrupo);
        if (!sumasPorPersona[g.paid_by]) sumasPorPersona[g.paid_by] = [];
        sumasPorPersona[g.paid_by].push({ monto: montoEnGrupo, moneda: monedaGrupo });
      });

      for (const [userId, items] of Object.entries(sumasPorPersona)) {
        const { total } = await sumarConvertido(items, monedaUsuario);
        balance[userId] = (balance[userId] || 0) + total;
      }

      // 2. Restar lo que consumio cada uno (splits con tasa HISTORICA)
      const expIds = gastosRango.map(g => g.id);
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed, expense_id')
        .in('expense_id', expIds);

      const grupoPorExpense = {};
      const monedaPorExpense = {};
      const tasaPorExpense = {};
      gastosRango.forEach(g => {
        monedaPorExpense[g.id] = (g.currency || monedaPorGrupo[g.group_id] || 'EUR').toUpperCase();
        grupoPorExpense[g.id] = monedaPorGrupo[g.group_id] || 'EUR';
        const tasaRaw = parseFloat(g.exchange_rate);
        tasaPorExpense[g.id] = (isFinite(tasaRaw) && tasaRaw > 0) ? tasaRaw : 1;
      });

      if (splits && splits.length > 0) {
        const splitsPorPersona = {};
        splits.forEach(s => {
          const monedaGasto = monedaPorExpense[s.expense_id] || 'EUR';
          const monedaGrupo = grupoPorExpense[s.expense_id] || 'EUR';
          const tasa = tasaPorExpense[s.expense_id] || 1;
          const montoSplit = parseFloat(s.amount_owed) || 0;

          // amount_owed esta en moneda del gasto. Pasarlo a moneda del grupo.
          const montoEnGrupo = (monedaGasto === monedaGrupo)
            ? montoSplit
            : montoSplit * tasa;

          if (!splitsPorPersona[s.user_id]) splitsPorPersona[s.user_id] = [];
          splitsPorPersona[s.user_id].push({ monto: montoEnGrupo, moneda: monedaGrupo });
        });

        for (const [userId, items] of Object.entries(splitsPorPersona)) {
          const { total } = await sumarConvertido(items, monedaUsuario);
          balance[userId] = (balance[userId] || 0) - total;
        }
      }

      // 3. Settlements
      const { data: pagos } = await supabase
        .from('settlements')
        .select('from_user, to_user, amount, currency, group_id')
        .in('group_id', groupIds);

      if (pagos && pagos.length > 0) {
        const pagosDesde = {};
        const pagosHacia = {};
        pagos.forEach(p => {
          const moneda = (p.currency || monedaPorGrupo[p.group_id] || 'EUR').toUpperCase();
          if (!pagosDesde[p.from_user]) pagosDesde[p.from_user] = [];
          if (!pagosHacia[p.to_user]) pagosHacia[p.to_user] = [];
          pagosDesde[p.from_user].push({ monto: parseFloat(p.amount), moneda });
          pagosHacia[p.to_user].push({ monto: parseFloat(p.amount), moneda });
        });

        for (const [userId, items] of Object.entries(pagosDesde)) {
          const { total } = await sumarConvertido(items, monedaUsuario);
          balance[userId] = (balance[userId] || 0) + total;
        }
        for (const [userId, items] of Object.entries(pagosHacia)) {
          const { total } = await sumarConvertido(items, monedaUsuario);
          balance[userId] = (balance[userId] || 0) - total;
        }
      }
    }

    const miBalance = balance[user.id] || 0;
    const teDeben = miBalance > 0 ? miBalance : 0;
    const debes = miBalance < 0 ? Math.abs(miBalance) : 0;

    const labelTotal = document.getElementById('stat-total-label');
    if (labelTotal) {
      if (rangoActual === 'active') {
        labelTotal.textContent = t('dashboard.total.active');
      } else if (rangoActual === 'archived') {
        labelTotal.textContent = t('dashboard.total.archived');
      } else {
        labelTotal.textContent = t('dashboard.total.all');
      }
    }

    document.getElementById('stat-total-mes').textContent = formatearMonto(resultado.total, monedaUsuario);
    document.getElementById('stat-te-deben').textContent = formatearMonto(teDeben, monedaUsuario);
    document.getElementById('stat-debes').textContent = formatearMonto(debes, monedaUsuario);

    actualizarSubtextos(resultado, monedaUsuario);

    const ultimos = (gastosRango || []).slice(0, 2);
    await renderizarUltimos(ultimos, groupIds, monedaPorGrupo, monedaUsuario);

    await cargarHistorico(monedaUsuario);

  } catch (error) {
    console.error('Error dashboard:', error);
  }
}

// ==========================================
// SUBTEXTOS
// ==========================================
function actualizarSubtextos(resultado, monedaUsuario) {
  const statTotal = document.getElementById('stat-total-mes');
  if (!statTotal) return;

  let sub = document.getElementById('stat-total-mes-sub');
  if (!sub) {
    sub = document.createElement('div');
    sub.id = 'stat-total-mes-sub';
    sub.className = 'stat-subtext';
    statTotal.parentNode.appendChild(sub);
  }

  if (resultado.noConvertidas.length > 0) {
    const montoExcluido = resultado.montoNoConvertido
      ? ` (${resultado.montoNoConvertido.toFixed(2)} ${t('dashboard.not_included')})`
      : '';
    sub.textContent = `${t('dashboard.not_converted')}: ${resultado.noConvertidas.join(', ')}${montoExcluido}`;
    sub.style.color = '#e53e3e';
  } else if (resultado.monedasOrigen.length > 0) {
    sub.textContent = `${t('dashboard.converted_from')} ${resultado.monedasOrigen.join(', ')}`;
    sub.style.color = '#a0aec0';
  } else {
    sub.textContent = '';
  }
}

// ==========================================
// ULTIMOS MOVIMIENTOS
// ==========================================
async function renderizarUltimos(gastos, groupIds, monedaPorGrupo, monedaUsuario) {
  const container = document.getElementById('dashboard-recent');
  if (!container) return;

  if (!gastos || gastos.length === 0) {
    container.innerHTML = `<p class="placeholder-text">${t('dashboard.recent_empty')}</p>`;
    return;
  }

  const { data: grupos } = await supabase
    .from('groups')
    .select('id, name')
    .in('id', groupIds);

  const nombresGrupos = {};
  (grupos || []).forEach(g => nombresGrupos[g.id] = g.name);

  const paidByIds = [...new Set(gastos.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);

  const CATEGORIAS_ICONOS = {
    comida: '&#127829;', transporte: '&#128663;', alojamiento: '&#127968;',
    supermercado: '&#128722;', ocio: '&#127881;', salud: '&#128138;',
    servicios: '&#128241;', compras: '&#128717;', viajes: '&#9992;', otros: '&#128176;'
  };

  const html = [];
  for (const g of gastos) {
    const icono = CATEGORIAS_ICONOS[g.category] || CATEGORIAS_ICONOS.otros;
    const monedaGrupo = monedaPorGrupo[g.group_id] || 'EUR';
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();

    // Monto en moneda del grupo con tasa HISTORICA
    const montoEnGrupo = montoEnMonedaGrupo(g, monedaGrupo);

    let montoMostrar;
    let subtexto = '';

    if (monedaGrupo === monedaUsuario) {
      montoMostrar = montoEnGrupo.toFixed(2) + ' ' + monedaUsuario;
      if (monedaGasto !== monedaGrupo) {
        subtexto = `(${parseFloat(g.amount).toFixed(2)} ${monedaGasto})`;
      }
    } else {
      const r = await convertirMonto(montoEnGrupo, monedaGrupo, monedaUsuario);
      if (r.convertido) {
        montoMostrar = r.monto.toFixed(2) + ' ' + monedaUsuario;
        if (monedaGasto !== monedaGrupo) {
          subtexto = `(${parseFloat(g.amount).toFixed(2)} ${monedaGasto})`;
        }
      } else {
        montoMostrar = montoEnGrupo.toFixed(2) + ' ' + monedaGrupo;
      }
    }

    html.push(`
      <div class="recent-item">
        <div class="recent-icon">${icono}</div>
        <div class="recent-info">
          <h5>${g.description}</h5>
          <span>${nombresGrupos[g.group_id] || t('dashboard.group_fallback')} - ${nombres[g.paid_by] || t('expense.detail.unknown')}</span>
          ${subtexto ? `<small class="recent-subtext">${subtexto}</small>` : ''}
        </div>
        <div class="recent-amount">${montoMostrar}</div>
      </div>
    `);
  }

  container.innerHTML = html.join('');
}

// ==========================================
// HISTORICO POR MES
// ==========================================
async function cargarHistorico(monedaUsuario) {
  const tableContainer = document.getElementById('history-table');
  if (!tableContainer) return;

  const canvas = document.getElementById('chart-history');

  const hoy = new Date();
  const hace12 = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  const desdeHistorico = hace12.toISOString().split('T')[0];

  const { data: grupos } = await supabase
    .from('groups')
    .select('id, currency');

  const groupIds = (grupos || []).map(g => g.id);
  const monedaPorGrupo = {};
  (grupos || []).forEach(g => monedaPorGrupo[g.id] = (g.currency || 'EUR').toUpperCase());

  if (groupIds.length === 0) {
    tableContainer.innerHTML = `<p class="placeholder-text">${t('dashboard.history_empty')}</p>`;
    if (chartHistoryInstance) { chartHistoryInstance.destroy(); chartHistoryInstance = null; }
    return;
  }

  // FIX #1: traer exchange_rate
  const { data: gastos } = await supabase
    .from('expenses')
    .select('amount, currency, exchange_rate, date, group_id')
    .in('group_id', groupIds)
    .eq('archived', false)
    .gte('date', desdeHistorico);

  if (!gastos || gastos.length === 0) {
    tableContainer.innerHTML = `<p class="placeholder-text">${t('dashboard.history_empty')}</p>`;
    if (chartHistoryInstance) { chartHistoryInstance.destroy(); chartHistoryInstance = null; }
    return;
  }

  const porMes = {};
  gastos.forEach(g => {
    const mes = (g.date || '').substring(0, 7);
    if (!mes) return;
    const monedaGrupo = monedaPorGrupo[g.group_id] || 'EUR';
    const montoEnGrupo = montoEnMonedaGrupo(g, monedaGrupo);

    if (!porMes[mes]) porMes[mes] = { items: [], count: 0 };
    porMes[mes].items.push({ monto: montoEnGrupo, moneda: monedaGrupo });
    porMes[mes].count++;
  });

  const mesesOrdenados = Object.keys(porMes).sort();
  const resultados = [];

  for (const mes of mesesOrdenados) {
    const { total } = await sumarConvertido(porMes[mes].items, monedaUsuario);
    resultados.push({
      mes,
      label: formatearMes(mes),
      total,
      count: porMes[mes].count
    });
  }

  if (chartHistoryInstance) chartHistoryInstance.destroy();

  if (canvas) {
    const labels = resultados.map(r => r.label);
    const data = resultados.map(r => r.total);

    chartHistoryInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: t('dashboard.history_chart_label'),
          data,
          backgroundColor: '#2ecc87',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(2)} ${monedaUsuario}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => v.toFixed(0) + ' ' + monedaUsuario
            }
          },
          x: {
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  const totalGeneral = resultados.reduce((sum, r) => sum + r.total, 0);

  tableContainer.innerHTML = `
    <div class="history-table-wrap">
      ${resultados.slice().reverse().map(r => `
        <div class="history-row">
          <span class="history-month">${r.label}</span>
          <span class="history-count">${t('dashboard.history_expenses_count', { count: r.count })}</span>
          <span class="history-total">${r.total.toFixed(2)} ${monedaUsuario}</span>
        </div>
      `).join('')}
      <div class="history-row history-row-total">
        <span class="history-month">${t('dashboard.history_total_12m')}</span>
        <span class="history-count">${t('dashboard.history_expenses_count', { count: gastos.length })}</span>
        <span class="history-total">${totalGeneral.toFixed(2)} ${monedaUsuario}</span>
      </div>
    </div>
  `;
}

function formatearMes(yyyymm) {
  const [y, m] = yyyymm.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(m) - 1]} ${y.substring(2)}`;
}

// ==========================================
// RENDERIZAR VACIO
// ==========================================
function renderizarVacio(monedaUsuario) {
  document.getElementById('stat-total-mes').textContent = formatearMonto(0, monedaUsuario);
  document.getElementById('stat-te-deben').textContent = formatearMonto(0, monedaUsuario);
  document.getElementById('stat-debes').textContent = formatearMonto(0, monedaUsuario);

  const labelTotal = document.getElementById('stat-total-label');
  if (labelTotal) {
    if (rangoActual === 'active') {
      labelTotal.textContent = t('dashboard.total.active');
    } else if (rangoActual === 'archived') {
      labelTotal.textContent = t('dashboard.total.archived');
    } else {
      labelTotal.textContent = t('dashboard.total.all');
    }
  }

  const container = document.getElementById('dashboard-recent');
  if (container) {
    container.innerHTML = `<p class="placeholder-text">${t('dashboard.recent_empty')}</p>`;
  }

  const table = document.getElementById('history-table');
  if (table) {
    table.innerHTML = `<p class="placeholder-text">${t('dashboard.history_empty')}</p>`;
  }
}

// ==========================================
// INICIALIZAR TABS
// ==========================================
export function initDashboardTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      rangoActual = tab.dataset.range || 'active';

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      await cargarDashboard();
    });
  });
}
