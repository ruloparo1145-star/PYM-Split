// js/debtSolver.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CALCULAR BALANCE NETO DEL GRUPO
// ==========================================
export async function calcularBalance(groupId) {
  const balance = {};

  // Obtener moneda del grupo
  const { data: grupoInfo } = await supabase
    .from('groups')
    .select('currency')
    .eq('id', groupId)
    .single();

  const monedaGrupo = (grupoInfo?.currency || 'EUR').toUpperCase();

  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, paid_by, currency, exchange_rate')
    .eq('group_id', groupId);

  if (gastos) {
    // Sumar lo que pagÃ³ cada persona (convertido a moneda del grupo)
    gastos.forEach(g => {
      const monto = parseFloat(g.amount);
      const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
      const tasa = parseFloat(g.exchange_rate) || 1;

      let montoConvertido = monto;
      if (monedaGasto !== monedaGrupo) {
        montoConvertido = monto * tasa;
      }

      balance[g.paid_by] = (balance[g.paid_by] || 0) + montoConvertido;
    });

    const expenseIds = gastos.map(g => g.id);
    if (expenseIds.length > 0) {
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('user_id, amount_owed, expense_id')
        .in('expense_id', expenseIds);

      const monedaPorExpense = {};
      gastos.forEach(g => monedaPorExpense[g.id] = {
        moneda: (g.currency || monedaGrupo).toUpperCase(),
        tasa: parseFloat(g.exchange_rate) || 1
      });

      if (splits) {
        splits.forEach(s => {
          const info = monedaPorExpense[s.expense_id];
          const monto = parseFloat(s.amount_owed);
          let montoConvertido = monto;
          if (info && info.moneda !== monedaGrupo) {
            montoConvertido = monto * info.tasa;
          }
          balance[s.user_id] = (balance[s.user_id] || 0) - montoConvertido;
        });
      }
    }
  }

  // Settlements
  const { data: pagos } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount, currency, group_id')
    .eq('group_id', groupId);

  if (pagos) {
    pagos.forEach(p => {
      const monto = parseFloat(p.amount);
      const monedaPago = (p.currency || monedaGrupo).toUpperCase();
      // Asumimos que settlements estÃ¡n en la moneda del grupo
      balance[p.from_user] = (balance[p.from_user] || 0) + monto;
      balance[p.to_user] = (balance[p.to_user] || 0) - monto;
    });
  }

  return balance;
}
// ==========================================
// 2. SIMPLIFICAR DEUDAS
// ==========================================
export function simplificarDeudas(balance) {
  const deudores = [];
  const acreedores = [];

  Object.entries(balance).forEach(([userId, monto]) => {
    if (monto < -0.01) deudores.push({ userId, monto: Math.abs(monto) });
    else if (monto > 0.01) acreedores.push({ userId, monto });
  });

  deudores.sort((a, b) => b.monto - a.monto);
  acreedores.sort((a, b) => b.monto - a.monto);

  const transacciones = [];
  let i = 0, j = 0;

  while (i < deudores.length && j < acreedores.length) {
    const deuda = deudores[i];
    const credito = acreedores[j];
    const montoPagar = Math.min(deuda.monto, credito.monto);

    transacciones.push({
      from: deuda.userId,
      to: credito.userId,
      amount: parseFloat(montoPagar.toFixed(2))
    });

    deuda.monto -= montoPagar;
    credito.monto -= montoPagar;

    if (deuda.monto < 0.01) i++;
    if (credito.monto < 0.01) j++;
  }

  return transacciones;
}

// ==========================================
// 3. RENDERIZAR BALANCE
// ==========================================
export async function mostrarBalance(groupId) {
  const container = document.getElementById('group-balance');
  if (!container) return;
  container.innerHTML = '<p class="placeholder-text">Calculando...</p>';

  const balance = await calcularBalance(groupId);
  const userIds = Object.keys(balance);

  if (userIds.length === 0) {
    container.innerHTML = '<p class="placeholder-text">Sin movimientos todavia.</p>';
    return;
  }

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email || 'Usuario');

  const transacciones = simplificarDeudas(balance);

  if (transacciones.length === 0) {
    container.innerHTML = '<p class="success-msg" style="text-align: center;">Todo saldado!</p>';
    return;
  }

  container.innerHTML = transacciones.map(t => `
    <div class="debt-card">
      <span class="debt-from">${nombres[t.from] || 'Alguien'}</span>
      <span class="debt-arrow">-></span>
      <span class="debt-to">${nombres[t.to] || 'Alguien'}</span>
      
      <span class="debt-amount">${t.amount.toFixed(2)} ${monedaGrupo}</span>
  
      <button class="btn-small btn-settle"
              data-group="${groupId}"
              data-from="${t.from}"
              data-to="${t.to}"
              data-amount="${t.amount}">
        Saldar
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-settle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const gId = btn.dataset.group;
      const fromId = btn.dataset.from;
      const toId = btn.dataset.to;
      const amount = parseFloat(btn.dataset.amount);

      if (!confirm(`Confirmas que se pagaron ${amount.toFixed(2)} EUR?`)) return;

      try {
        await saldarDeuda(gId, fromId, toId, amount);
        await mostrarBalance(gId);
        const { cargarHistorial } = await import('./history.js');
        await cargarHistorial(gId);
      } catch (error) {
        alert('Error al saldar: ' + error.message);
      }
    });
  });
}

// ==========================================
// 4. REGISTRAR UN PAGO
// ==========================================
async function saldarDeuda(groupId, fromUserId, toUserId, amount) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { error } = await supabase
    .from('settlements')
    .insert([{
      group_id: groupId,
      from_user: fromUserId,
      to_user: toUserId,
      amount: amount,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0]
    }]);

  if (error) throw error;
}
