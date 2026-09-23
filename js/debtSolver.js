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

  if (gastos) {
    // Sumar lo que pagÃ³ cada persona
    gastos.forEach(g => {
      balance[g.paid_by] = (balance[g.paid_by] || 0) + parseFloat(g.amount);
    });

    // 2. Restar lo que debe cada persona (splits)
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
  }

  // 3. Aplicar los pagos ya realizados (settlements)
  const { data: pagos } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('group_id', groupId);

  if (pagos) {
    pagos.forEach(p => {
      // El que pagÃ³ recupera su deuda
      balance[p.from_user] = (balance[p.from_user] || 0) + parseFloat(p.amount);
      // El que recibiÃ³ le resta el crÃ©dito
      balance[p.to_user] = (balance[p.to_user] || 0) - parseFloat(p.amount);
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
// 3. RENDERIZAR BALANCE CON BOTÃ“N DE SALDAR
// ==========================================
export async function mostrarBalance(groupId) {
  const container = document.getElementById('group-balance');
  container.innerHTML = '<p class="placeholder-text">Calculando...</p>';

  // 1. Calcular balance
  const balance = await calcularBalance(groupId);
  
  const userIds = Object.keys(balance);
  if (userIds.length === 0) {
    container.innerHTML = '<p class="placeholder-text">Sin movimientos todavÃ­a.</p>';
    return;
  }

  // 2. Traer los perfiles para mostrar nombres
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const nombres = {};
  perfiles?.forEach(p => nombres[p.id] = p.full_name || p.email);

  // 3. Simplificar deudas
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
      <button class="btn-small btn-settle" 
              data-group="${groupId}"
              data-from="${t.from}" 
              data-to="${t.to}" 
              data-amount="${t.amount}">
        Saldar
      </button>
    </div>
  `).join('');

  // 5. AÃ±adir listeners a los botones de saldar
  container.querySelectorAll('.btn-settle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupId = btn.dataset.group;
      const fromId = btn.dataset.from;
      const toId = btn.dataset.to;
      const amount = parseFloat(btn.dataset.amount);

      if (!confirm(`Â¿Confirmas que se pagaron ${amount.toFixed(2)} â‚¬?`)) return;

      try {
        await saldarDeuda(groupId, fromId, toId, amount);
        // Recargar el balance
        await mostrarBalance(groupId);
      } catch (error) {
        alert('Error al saldar: ' + error.message);
      }
    });
  });
}

// ==========================================
// 4. REGISTRAR UN PAGO (SALDAR DEUDA)
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
