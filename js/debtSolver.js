// js/debtSolver.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CALCULAR BALANCE NETO DEL GRUPO
// ==========================================
// Devuelve un objeto: { userId: balanceNeto }
// Positivo = le deben dinero | Negativo = debe dinero
export async function calcularBalance(groupId) {
  const balance = {};

  // 1. Traer todos los gastos del grupo
  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, amount, paid_by')
    .eq('group_id', groupId);

  if (!gastos) return balance;

  // 2. Sumar lo que pagÃ³ cada persona
  gastos.forEach(g => {
    balance[g.paid_by] = (balance[g.paid_by] || 0) + parseFloat(g.amount);
  });

  // 3. Traer todos los splits de esos gastos
  const expenseIds = gastos.map(g => g.id);
  const { data: splits } = await supabase
    .from('expense_splits')
    .select('user_id, amount_owed')
    .in('expense_id', expenseIds);

  // 4. Restar lo que debe cada persona
  if (splits) {
    splits.forEach(s => {
      balance[s.user_id] = (balance[s.user_id] || 0) - parseFloat(s.amount_owed);
    });
  }

  return balance;
}

// ==========================================
// 2. SIMPLIFICAR DEUDAS (Algoritmo)
// ==========================================
// Recibe el balance neto y devuelve un array de transacciones simplificadas:
// [{ from, to, amount }]
export function simplificarDeudas(balance) {
  const deudores = [];
  const acreedores = [];

  // Separar en quiÃ©n debe (negativo) y quiÃ©n le deben (positivo)
  Object.entries(balance).forEach(([userId, monto]) => {
    if (monto < -0.01) deudores.push({ userId, monto: Math.abs(monto) });
    else if (monto > 0.01) acreedores.push({ userId, monto });
  });

  // Ordenar de mayor a menor
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
// 3. RENDERIZAR BALANCE EN EL MODAL
// ==========================================
export async function mostrarBalance(groupId) {
  const container = document.getElementById('group-balance');
  container.innerHTML = '<p class="placeholder-text">Calculando...</p>';

  // 1. Calcular balance
  const balance = await calcularBalance(groupId);
  
  // 2. Traer los perfiles para mostrar nombres
  const userIds = Object.keys(balance);
  if (userIds.length === 0) {
    container.innerHTML = '<p class="placeholder-text">Sin movimientos todavÃ­a.</p>';
    return;
  }

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const nombres = {};
  perfiles?.forEach(p => nombres[p.id] = p.full_name || p.email);

  // 3. Simplificar
  const transacciones = simplificarDeudas(balance);

  // 4. Renderizar
  if (transacciones.length === 0) {
    container.innerHTML = '<p class="success-msg" style="text-align: center;">âœ… Â¡Todo saldado!</p>';
    return;
  }

  container.innerHTML = transacciones.map(t => `
    <div class="debt-card">
      <span class="debt-from">${nombres[t.from]}</span>
      <span class="debt-arrow">â†’</span>
      <span class="debt-to">${nombres[t.to]}</span>
      <span class="debt-amount">${t.amount} â‚¬</span>
    </div>
  `).join('');
}
