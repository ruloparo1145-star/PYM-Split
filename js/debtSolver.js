// js/debtSolver.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CALCULAR BALANCE NETO DEL GRUPO
// ==========================================
export async function calcularBalance(groupId) {
  const balance = {};

  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, paid_by')
    .eq('group_id', groupId);

  if (!gastos) return balance;

  gastos.forEach(g => {
    balance[g.paid_by] = (balance[g.paid_by] || 0) + parseFloat(g.amount);
  });

  const expenseIds = gastos.map(g => g.id);
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('user_id, amount_owed')
    .in('expense_id', expenseIds);

  if (splits) {
    splits.forEach(s => {
      balance[s.user_id] = (balance[s.user_id] || 0) - parseFloat(s.amount_owed);
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
  container.innerHTML = '<p class="placeholder-text">Calculando...</p>';

  const balance = await calcularBalance(groupId);
  
  const userIds = Object.keys(balance);
  if (userIds.length === 0) {
    container.innerHTML = '<p class="placeholder-text">Sin movimientos todavía.</p>';
    return;
  }

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const nombres = {};
  perfiles?.forEach(p => nombres[p.id] = p.full_name || p.email);

  const transacciones = simplificarDeudas(balance);

  if (transacciones.length === 0) {
    container.innerHTML = '<p class="success-msg" style="text-align: center;">✅ ¡Todo saldado!</p>';
    return;
  }

  container.innerHTML = transacciones.map(t => `
    <div class="debt-card">
      <span class="debt-from">${nombres[t.from]}</span>
      <span class="debt-arrow">→</span>
      <span class="debt-to">${nombres[t.to]}</span>
      <span class="debt-amount">${t.amount} €</span>
    </div>
  `).join('');
}
