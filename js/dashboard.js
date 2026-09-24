// js/dashboard.js
import { supabase } from './supabase.js';
import { sumarConvertido, formatearMonto } from './currency.js';

let chartHistoryInstance = null;
let rangoActual = 'month'; // 'month' | '3months' | 'year' | 'all'

// ==========================================
// CARGAR DASHBOARD
// ==========================================
export async function cargarDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single();

  const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

  try {
    // Traer grupos activos
    const { data: grupos } = await supabase
      .from('groups')
      .select('id, currency')
      .eq('archived', false);

    const groupIds = (grupos || []).map(g => g.id);
    const monedaPorGrupo = {};
    (grupos || []).forEach(g => monedaPorGrupo[g.id] = g.currency || 'EUR');

    if (groupIds.length === 0) {
      renderizarVacio(monedaUsuario);
      return;
    }

    // Calcular rango de fechas segÃºn el tab activo
    const rango = calcularRango(rangoActual);

    // Traer gastos del rango
    let query = supabase
      .from('expenses')
      .select('id, description, amount, currency, date, paid_by, group_id, category')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    if (rango.desde) {
      query = query.gte('date', rango.desde);
    }
    if (rango.hasta) {
      query = query.lte('date', rango.hasta);
    }

    const { data: gastosRango } = await query;

    // Preparar items para conversiÃ³n
    const itemsRango = (gastosRango || []).map(g => ({
      monto: parseFloat(g.amount),
      moneda: g.currency || monedaPorGrupo[g.group_id] || 'EUR'
    }));

    const resultado = await sumarConvertido(itemsRango, monedaUsuario);

    // Balance global (todos los gastos de todos los grupos activos)
    const { data: gastosTodos } = await supabase
      .from('expenses')
      .select('id, amount, currency, paid_by, group_id')
      .in('group_id', groupIds);

    const balance = {};

    if (gastosTodos && gastosTodos.length > 0) {
      const sumasPorPersona = {};
      gastosTodos.forEach(g => {
        const moneda = g.currency || monedaPorGrupo[g.group_id] || 'EUR';
        if (!sumasPorPersona[g.paid_by]) sumasPorPersona[g.paid_by] = [];
        sumasPorPersona[g.paid_by].push({ monto: parseFloat(g.amount), moneda });
      });

      for (const [userId, items] of Object.entries(sumasPorPersona)) {
        const { total } = await sumarConvertido(items, monedaUsuario);
        balance[userId] = (balance[userId] || 0) + total;
      }

      const expIds = gastosTodos.map(g => g.id);
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed, expense_id')
        .in('expense_id', expIds);

      const monedaPorExpense = {};
      gastosTodos.forEach(g => monedaPorExpense[g.id] = g.currency || monedaPorGrupo[g.group_id] || 'EUR');

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

    // Label dinÃ¡mico del total
    const labelTotal = document.querySelector('.stat-card .stat-label');
    if (labelTotal) {
      labelTotal.textContent = rango.label;
    }

    document.getElementById('stat-total-mes').textContent = formatearMonto(resultado.total, monedaUsuario);
    document.getElementById('stat-te-deben').textContent = formatearMonto(teDeben, monedaUsuario);
    document.getElementById('stat-debes').textContent = formatearMonto(debes, monedaUsuario);

    actualizarSubtextos(resultado, monedaUsuario);

    // Ãšltimos movimientos
    const ultimos = (gastosRango || []).slice(0, 5);
    await renderizarUltimos(ultimos, groupIds, monedaPorGrupo, monedaUsuario);

    // HistÃ³rico (siempre Ãºltimos 12 meses)
    await cargarHistorico(groupIds, monedaPorGrupo, monedaUsuario);

  } catch (error) {
    console.error('Error dashboard:', error);
  }
}

// ==========================================
// CALCULAR RANGO DE FECHAS
// ==========================================
function calcularRango(rango) {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();

  if (rango === 'month') {
    const desde = new Date(y, m, 1).toISOString().split('T')[0];
    return { desde, hasta: null, label: 'Total gastado este mes' };
  }

  if (rango === '3months') {
    const desde = new Date(y, m - 2, 1).toISOString().split('T')[0];
    return { desde, hasta: null, label: 'Total ultimos 3 meses' };
  }

  if (rango === 'year') {
    const desde = new Date(y, 0, 1).toISOString().split('T')[0];
    return { desde, hasta: null, label: 'Total este ano' };
  }

  return { desde: null, hasta: null, label: 'Total historico' };
}

// ==========================================
// SUBTEXTOS DE CONVERSION
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
    sub.textContent = `Sin convertir: ${resultado.noConvertidas.join(', ')}`;
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
    container.innerHTML = '<p class="placeholder-text">No hay movimientos en este rango.</p>';
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
// HISTORICO POR MES (ultimos 12 meses)
// ==========================================
async function cargarHistorico(groupIds, monedaPorGrupo, monedaUsuario) {
  const tableContainer = document.getElementById('history-table');
  const canvas = document.getElementById('chart-history');
  if (!tableContainer || !canvas) return;

  // Rango: ultimos 12 meses
  const hoy = new Date();
  const hace12 = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  const desdeHistorico = hace12.toISOString().split('T')[0];

  const { data: gastos } = await supabase
    .from('expenses')
    .select('amount, currency, date, group_id')
    .in('group_id', groupIds)
    .gte('date', desdeHistorico);

  if (!gastos || gastos.length === 0) {
    tableContainer.innerHTML = '<p class="placeholder-text">No hay datos historicos.</p>';
    if (chartHistoryInstance) { chartHistoryInstance.destroy(); chartHistoryInstance = null; }
    return;
  }

  // Agrupar por mes (YYYY-MM)
  const porMes = {};
  gastos.forEach(g => {
    const mes = (g.date || '').substring(0, 7);
    if (!mes) return;
    const moneda = g.currency || monedaPorGrupo[g.group_id] || 'EUR';
    if (!porMes[mes]) porMes[mes] = { items: [], count: 0 };
    porMes[mes].items.push({ monto: parseFloat(g.amount), moneda });
    porMes[mes].count++;
  });

  // Convertir cada mes a la moneda del usuario
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

  // === GrÃ¡fico ===
  if (chartHistoryInstance) chartHistoryInstance.destroy();

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

  // === Tabla ===
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

  const container = document.getElementById('dashboard-recent');
  if (container) {
    container.innerHTML = '<p class="placeholder-text">No hay movimientos aun.</p>';
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
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      rangoActual = tab.dataset.range || 'month';
      await cargarDashboard();
    });
  });
}
