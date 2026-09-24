// js/dashboard.js
import { supabase } from './supabase.js';
import { sumarConvertido, formatearMonto } from './currency.js';

// ==========================================
// CARGAR DASHBOARD CON CONVERSION
// ==========================================
export async function cargarDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Moneda preferida del usuario
  const { data: perfil } = await supabase
    .from('profiles')
    .select('preferred_currency')
    .eq('id', user.id)
    .single();

  const monedaUsuario = (perfil?.preferred_currency || 'EUR').toUpperCase();

  try {
    // Traer todos los grupos activos
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

    // Gastos de este mes
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];

    const { data: gastosMes } = await supabase
      .from('expenses')
      .select('id, description, amount, currency, date, paid_by, group_id, category')
      .in('group_id', groupIds)
      .gte('date', inicioMes)
      .order('created_at', { ascending: false });

    // Preparar items para convertir (usando la moneda del grupo si el gasto no tiene)
    const itemsMes = (gastosMes || []).map(g => ({
      monto: parseFloat(g.amount),
      moneda: g.currency || monedaPorGrupo[g.group_id] || 'EUR'
    }));

    const resultadoMes = await sumarConvertido(itemsMes, monedaUsuario);

    // Balance global
    const { data: gastosTodos } = await supabase
      .from('expenses')
      .select('id, amount, currency, paid_by, group_id')
      .in('group_id', groupIds);

    const balance = {};

    if (gastosTodos && gastosTodos.length > 0) {
      // Preparar para convertir
      const itemsBalance = gastosTodos.map(g => ({
        monto: parseFloat(g.amount),
        moneda: g.currency || monedaPorGrupo[g.group_id] || 'EUR',
        tipo: 'pago',
        userId: g.paid_by
      }));

      // Sumar por persona
      const sumasPorPersona = {};
      for (const item of itemsBalance) {
        if (!sumasPorPersona[item.userId]) sumasPorPersona[item.userId] = [];
        sumasPorPersona[item.userId].push({ monto: item.monto, moneda: item.moneda });
      }

      for (const [userId, items] of Object.entries(sumasPorPersona)) {
        const { total } = await sumarConvertido(items, monedaUsuario);
        balance[userId] = (balance[userId] || 0) + total;
      }

      // Restar splits (convertidos)
      const expIds = gastosTodos.map(g => g.id);
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed, expense_id')
        .in('expense_id', expIds);

      const monedaPorExpense = {};
      gastosTodos.forEach(g => monedaPorExpense[g.id] = g.currency || monedaPorGrupo[g.group_id] || 'EUR');

      if (splits && splits.length > 0) {
        const splitsPorPersona = {};
        for (const s of splits) {
          const moneda = monedaPorExpense[s.expense_id] || 'EUR';
          if (!splitsPorPersona[s.user_id]) splitsPorPersona[s.user_id] = [];
          splitsPorPersona[s.user_id].push({ monto: parseFloat(s.amount_owed), moneda });
        }

        for (const [userId, items] of Object.entries(splitsPorPersona)) {
          const { total } = await sumarConvertido(items, monedaUsuario);
          balance[userId] = (balance[userId] || 0) - total;
        }
      }

      // Aplicar settlements
      const { data: pagos } = await supabase
        .from('settlements')
        .select('from_user, to_user, amount, currency, group_id')
        .in('group_id', groupIds);

      if (pagos && pagos.length > 0) {
        const pagosDesde = {};
        const pagosHacia = {};

        for (const p of pagos) {
          const moneda = p.currency || monedaPorGrupo[p.group_id] || 'EUR';
          if (!pagosDesde[p.from_user]) pagosDesde[p.from_user] = [];
          if (!pagosHacia[p.to_user]) pagosHacia[p.to_user] = [];
          pagosDesde[p.from_user].push({ monto: parseFloat(p.amount), moneda });
          pagosHacia[p.to_user].push({ monto: parseFloat(p.amount), moneda });
        }

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

    // Renderizar tarjetas
    document.getElementById('stat-total-mes').textContent = formatearMonto(resultadoMes.total, monedaUsuario);
    document.getElementById('stat-te-deben').textContent = formatearMonto(teDeben, monedaUsuario);
    document.getElementById('stat-debes').textContent = formatearMonto(debes, monedaUsuario);

    // Subtexto de conversiÃ³n
    actualizarSubtextos(resultadoMes, monedaUsuario);

    // Ãšltimos movimientos
    const ultimos = (gastosMes || []).slice(0, 5);
    await renderizarUltimos(ultimos, groupIds, monedaPorGrupo, monedaUsuario);

  } catch (error) {
    console.error('Error dashboard:', error);
  }
}

// ==========================================
// SUBTEXTOS DE CONVERSION
// ==========================================
function actualizarSubtextos(resultado, monedaUsuario) {
  // Buscar o crear subtexto debajo del total
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
    container.innerHTML = '<p class="placeholder-text">No hay movimientos este mes.</p>';
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

  // Convertir cada monto
  const items = gastos.map(g => {
    const monedaOrigen = g.currency || monedaPorGrupo[g.group_id] || 'EUR';
    return {
      monto: parseFloat(g.amount),
      moneda: monedaOrigen,
      gasto: g
    };
  });

  const html = [];
  for (const item of items) {
    const g = item.gasto;
    const icono = CATEGORIAS_ICONOS[g.category] || CATEGORIAS_ICONOS.otros;

    let montoMostrar;
    let subtexto = '';

    if (item.moneda === monedaUsuario) {
      montoMostrar = parseFloat(g.amount).toFixed(2) + ' ' + monedaUsuario;
    } else {
      const { convertirMonto } = await import('./currency.js');
      const r = await convertirMonto(item.monto, item.moneda, monedaUsuario);
      if (r.convertido) {
        montoMostrar = r.monto.toFixed(2) + ' ' + monedaUsuario;
        subtexto = `(${parseFloat(g.amount).toFixed(2)} ${item.moneda})`;
      } else {
        montoMostrar = parseFloat(g.amount).toFixed(2) + ' ' + item.moneda;
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
}
