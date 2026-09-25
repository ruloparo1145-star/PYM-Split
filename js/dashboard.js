// js/dashboard.js
import { supabase } from './supabase.js';
import { sumarConvertido, formatearMonto } from './currency.js';

let chartHistoryInstance = null;
let rangoActual = 'active';

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
    // Grupos segun el tab seleccionado
    let queryGrupos = supabase
      .from('groups')
      .select('id, currency');

    if (rangoActual === 'active') {
      queryGrupos = queryGrupos.eq('archived', false);
    } else if (rangoActual === 'archived') {
      queryGrupos = queryGrupos.eq('archived', true);
    }
    // Si es 'all', no filtramos

    const { data: grupos } = await queryGrupos;

    const groupIds = (grupos || []).map(g => g.id);
    const monedaPorGrupo = {};
    (grupos || []).forEach(g => monedaPorGrupo[g.id] = g.currency || 'EUR');

    if (groupIds.length === 0) {
      renderizarVacio(monedaUsuario);
      return;
    }

    // Gastos del rango (todos los gastos activos de esos grupos)
    const { data: gastosRango } = await supabase
      .from('expenses')
      .select('id, description, amount, currency, date, paid_by, group_id, category')
      .in('group_id', groupIds)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    const itemsRango = (gastosRango || []).map(g => ({
      monto: parseFloat(g.amount),
      moneda: g.currency || monedaPorGrupo[g.group_id] || 'EUR'
    }));

    const resultado = await sumarConvertido(itemsRango, monedaUsuario);

    // Balance global
    const balance = {};

    if (gastosRango && gastosRango.length > 0) {
      const sumasPorPersona = {};
      gastosRango.forEach(g => {
        const moneda = g.currency || monedaPorGrupo[g.group_id] || 'EUR';
        if (!sumasPorPersona[g.paid_by]) sumasPorPersona[g.paid_by] = [];
        sumasPorPersona[g.paid_by].push({ monto: parseFloat(g.amount), moneda });
      });

      for (const [userId, items] of Object.entries(sumasPorPersona)) {
        const { total } = await sumarConvertido(items, monedaUsuario);
        balance[userId] = (balance[userId] || 0) + total;
      }

      const expIds = gastosRango.map(g => g.id);
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed, expense_id')
        .in('expense_id', expIds);

      const monedaPorExpense = {};
      gastosRango.forEach(g => monedaPorExpense[g.id] = g.currency || monedaPorGrupo[g.group_id] || 'EUR');

      if (splits && splits.length > 0) {
        const splitsPorPersona = {};
        splits.forEach(s => {
          const moneda = monedaPorExpense[s.expense_id] || 'EUR';
          if (!splitsPorPersona[s.user_id]) splitsPorPersona[s.user_id] = [];
          splitsPorPersona[s.user_id].push({ monto: parseFloat(s.amount_owed), moneda });
        });

        for (const [userId, items] of Object.entries(splitsPorPersona)) {
          const { total } = await sumarConvertido(items, monedaUsuario);
          balance[userId] = (balance[userId] || 0) - total;
        }
      }

      const { data: pagos } = await supabase
        .from('settlements')
        .select('from_user, to_user, amount, currency, group_id')
        .in('group_id', groupIds);

      if (pagos && pagos.length > 0) {
        const pagosDesde = {};
        const pagosHacia = {};
        pagos.forEach(p => {
          const moneda = p.currency || monedaPorGrupo[p.group_id] || 'EUR';
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

    // Label dinamico segun el tab
    const labelTotal = document.getElementById('stat-total-label');
    if (labelTotal) {
      if (rangoActual === 'active') {
        labelTotal.textContent = 'Total gastado en grupos activos';
      } else if (rangoActual === 'archived') {
        labelTotal.textContent = 'Total gastado en grupos archivados';
      } else {
        labelTotal.textContent = 'Total gastado (todos los grupos)';
      }
    }

    document.getElementById('stat-total-mes').textContent = formatearMonto(resultado.total, monedaUsuario);
    document.getElementById('stat-te-deben').textContent = formatearMonto(teDeben, monedaUsuario);
    document.getElementById('stat-debes').textContent = formatearMonto(debes, monedaUsuario);

    actualizarSubtextos(resultado, monedaUsuario);

    const ultimos = (gastosRango || []).slice(0, 5);
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
      ? ` (${resultado.montoNoConvertido.toFixed(2)} no incluidos)`
      : '';
    sub.textContent = `Sin convertir: ${resultado.noConvertidas.join(', ')}${montoExcluido}`;
    sub.style.color = '#e53e3e';
  } else if (resultado.monedasOrigen.length > 0) {
    sub.textContent = `Convertido desde ${resultado.monedasOrigen.join(', ')}`;
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
    container.innerHTML = '<p class="placeholder-text">No hay movimientos.</p>';
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
    const monedaOrigen = g.currency || monedaPorGrupo[g.group_id] || 'EUR';

    let montoMostrar;
    let subtexto = '';

    if (monedaOrigen === monedaUsuario) {
      montoMostrar = parseFloat(g.amount).toFixed(2) + ' ' + monedaUsuario;
    } else {
      const { convertirMonto } = await import('./currency.js');
      const r = await convertirMonto(parseFloat(g.amount), monedaOrigen, monedaUsuario);
      if (r.convertido) {
        montoMostrar = r.monto.toFixed(2) + ' ' + monedaUsuario;
        subtexto = `(${parseFloat(g.amount).toFixed(2)} ${monedaOrigen})`;
      } else {
        montoMostrar = parseFloat(g.amount).toFixed(2) + ' ' + monedaOrigen;
      }
    }

    html.push(`
      <div class="recent-item">
        <div class="recent-icon">${icono}</div>
        <div class="recent-info">
          <h5>${g.description}</h5>
          <span>${nombresGrupos[g.group_id] || 'Grupo'} - ${nombres[g.paid_by] || 'Desconocido'}</span>
          ${subtexto ? `<small class="recent-subtext">${subtexto}</small>` : ''}
        </div>
        <div class="recent-amount">${montoMostrar}</div>
      </div>
    `);
  }

  container.innerHTML = html.join('');
}

// ==========================================
// HISTORICO POR MES (siempre con todos los grupos)
// ==========================================
async function cargarHistorico(monedaUsuario) {
  const tableContainer = document.getElementById('history-table');
  if (!tableContainer) return;

  const canvas = document.getElementById('chart-history');

  const hoy = new Date();
  const hace12 = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  const desdeHistorico = hace12.toISOString().split('T')[0];

  // Todos los grupos (activos + archivados)
  const { data: grupos } = await supabase
    .from('groups')
    .select('id, currency');

  const groupIds = (grupos || []).map(g => g.id);
  const monedaPorGrupo = {};
  (grupos || []).forEach(g => monedaPorGrupo[g.id] = g.currency || 'EUR');

  if (groupIds.length === 0) {
    tableContainer.innerHTML = '<p class="placeholder-text">No hay datos historicos.</p>';
    if (chartHistoryInstance) { chartHistoryInstance.destroy(); chartHistoryInstance = null; }
    return;
  }

  // Gastos activos (no archivados) de todos los grupos
  const { data: gastos } = await supabase
    .from('expenses')
    .select('amount, currency, date, group_id')
    .in('group_id', groupIds)
    .eq('archived', false)
    .gte('date', desdeHistorico);

  if (!gastos || gastos.length === 0) {
    tableContainer.innerHTML = '<p class="placeholder-text">No hay datos historicos.</p>';
    if (chartHistoryInstance) { chartHistoryInstance.destroy(); chartHistoryInstance = null; }
    return;
  }

  const porMes = {};
  gastos.forEach(g => {
    const mes = (g.date || '').substring(0, 7);
    if (!mes) return;
    const moneda = g.currency || monedaPorGrupo[g.group_id] || 'EUR';
    if (!porMes[mes]) porMes[mes] = { items: [], count: 0 };
    porMes[mes].items.push({ monto: parseFloat(g.amount), moneda });
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
          label: 'Gastado',
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
          <span class="history-count">${r.count} gastos</span>
          <span class="history-total">${r.total.toFixed(2)} ${monedaUsuario}</span>
        </div>
      `).join('')}
      <div class="history-row history-row-total">
        <span class="history-month">Total 12 meses</span>
        <span class="history-count">${gastos.length} gastos</span>
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
      labelTotal.textContent = 'Total gastado en grupos activos';
    } else if (rangoActual === 'archived') {
      labelTotal.textContent = 'Total gastado en grupos archivados';
    } else {
      labelTotal.textContent = 'Total gastado (todos los grupos)';
    }
  }

  const container = document.getElementById('dashboard-recent');
  if (container) {
    container.innerHTML = '<p class="placeholder-text">No hay movimientos.</p>';
  }

  const table = document.getElementById('history-table');
  if (table) {
    table.innerHTML = '<p class="placeholder-text">No hay datos historicos.</p>';
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
