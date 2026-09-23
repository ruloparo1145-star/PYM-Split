// js/dashboard.js
import { supabase } from './supabase.js';

// ==========================================
// CALCULAR ESTADISTICAS GLOBALES
// ==========================================
export async function cargarDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 1. Traer todos los grupos activos del usuario
    const { data: grupos } = await supabase
      .from('groups')
      .select('id')
      .eq('archived', false);

    const groupIds = (grupos || []).map(g => g.id);

    if (groupIds.length === 0) {
      renderizarVacio();
      return;
    }

    // 2. Gastos de este mes
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];

    const { data: gastosMes } = await supabase
      .from('expenses')
      .select('id, description, amount, currency, date, paid_by, group_id, category')
      .in('group_id', groupIds)
      .gte('date', inicioMes)
      .order('created_at', { ascending: false });

    const totalMes = (gastosMes || []).reduce((sum, g) => sum + parseFloat(g.amount), 0);

    // 3. Balance global: gastos - splits - settlements
    const { data: gastosTodos } = await supabase
      .from('expenses')
      .select('id, amount, paid_by, group_id')
      .in('group_id', groupIds);

    const balance = {};

    if (gastosTodos && gastosTodos.length > 0) {
      // Sumar lo que pagÃ³ cada uno
      gastosTodos.forEach(g => {
        balance[g.paid_by] = (balance[g.paid_by] || 0) + parseFloat(g.amount);
      });

      // Restar splits
      const expIds = gastosTodos.map(g => g.id);
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed')
        .in('expense_id', expIds);

      (splits || []).forEach(s => {
        balance[s.user_id] = (balance[s.user_id] || 0) - parseFloat(s.amount_owed);
      });

      // Aplicar settlements
      const { data: pagos } = await supabase
        .from('settlements')
        .select('from_user, to_user, amount')
        .in('group_id', groupIds);

      (pagos || []).forEach(p => {
        balance[p.from_user] = (balance[p.from_user] || 0) + parseFloat(p.amount);
        balance[p.to_user] = (balance[p.to_user] || 0) - parseFloat(p.amount);
      });
    }

    const miBalance = balance[user.id] || 0;
    const teDeben = miBalance > 0 ? miBalance : 0;
    const debes = miBalance < 0 ? Math.abs(miBalance) : 0;

    // 4. Renderizar tarjetas
    document.getElementById('stat-total-mes').textContent = `${totalMes.toFixed(2)} EUR`;
    document.getElementById('stat-te-deben').textContent = `${teDeben.toFixed(2)} EUR`;
    document.getElementById('stat-debes').textContent = `${debes.toFixed(2)} EUR`;
    // 5. Ãšltimos movimientos
    const ultimos = (gastosMes || []).slice(0, 5);
    renderizarUltimos(ultimos, groupIds);

  } catch (error) {
    console.error('Error dashboard:', error);
  }
}

// ==========================================
// RENDERIZAR ULTIMOS MOVIMIENTOS
// ==========================================
async function renderizarUltimos(gastos, groupIds) {
  const container = document.getElementById('dashboard-recent');
  if (!container) return;

  if (!gastos || gastos.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No hay movimientos este mes.</p>';
    return;
  }

  // Traer grupos y pagadores
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

  container.innerHTML = gastos.map(g => {
    const icono = CATEGORIAS_ICONOS[g.category] || CATEGORIAS_ICONOS.otros;
    return `
      <div class="recent-item">
        <div class="recent-icon">${icono}</div>
        <div class="recent-info">
          <h5>${g.description}</h5>
          <span>${nombresGrupos[g.group_id] || 'Grupo'} Â· ${nombres[g.paid_by] || 'Desconocido'}</span>
        </div>
        <div class="recent-amount">${parseFloat(g.amount).toFixed(2)} â‚¬</div>
      </div>
    `;
  }).join('');
}

// ==========================================
// RENDERIZAR VACIO
// ==========================================
function renderizarVacio() {
  document.getElementById('stat-total-mes').textContent = '0.00 â‚¬';
  document.getElementById('stat-te-deben').textContent = '0.00 â‚¬';
  document.getElementById('stat-debes').textContent = '0.00 â‚¬';

  const container = document.getElementById('dashboard-recent');
  if (container) {
    container.innerHTML = '<p class="placeholder-text">No hay movimientos aun.</p>';
  }
}
