// js/groups.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR GRUPOS
// ==========================================
export async function cargarGrupos() {
  const groupsList = document.getElementById('groups-list');

  // Obtenemos el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Traemos los grupos donde el usuario es miembro.
  // Gracias a RLS, Supabase automÃ¡ticamente solo nos devuelve los grupos correctos.
  const { data: grupos, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando grupos:', error);
    groupsList.innerHTML = '<p class="error-msg">Error al cargar grupos.</p>';
    return;
  }

  if (grupos.length === 0) {
    groupsList.innerHTML = '<p class="placeholder-text">AÃºn no tienes grupos. Â¡Crea uno nuevo!</p>';
    return;
  }

  // Renderizar grupos
  groupsList.innerHTML = grupos.map(grupo => `
    <div class="group-card" data-id="${grupo.id}">
      <div class="group-info">
        <h4>${grupo.name}</h4>
        <span>${grupo.type.toUpperCase()} Â· ${grupo.currency}</span>
      </div>
      <div>â–¶</div>
    </div>
  `).join('');
}

// ==========================================
// 2. CREAR GRUPO
// ==========================================
export async function crearGrupo(nombre, tipo, moneda) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Insertar el grupo
  // IMPORTANTE: mandamos owner_id ADEMÃS de created_by.
  // Las polÃ­ticas RLS de INSERT/SELECT/UPDATE/DELETE de "groups"
  // estÃ¡n basadas en owner_id (auth.uid() = owner_id), asÃ­ que si
  // no se envÃ­a, la fila queda con owner_id = null y el INSERT
  // es rechazado por RLS aunque el resto de los datos sea correcto.
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert([{
      name: nombre,
      type: tipo,
      currency: moneda,
      created_by: user.id,
      owner_id: user.id
    }])
    .select();

  if (groupError) throw groupError;

  // NOTA: ya NO insertamos manualmente en group_members.
  // El trigger "trg_add_creator_as_member" (AFTER INSERT en groups)
  // aÃ±ade automÃ¡ticamente al creador como miembro. Si lo hacÃ­amos
  // tambiÃ©n aquÃ­, chocaba con la primary key (group_id, user_id)
  // -> error "duplicate key value violates unique constraint
  // group_members_pkey".

  return groupData[0];
}

// ==========================================
// 3. MANEJO DEL MODAL
// ==========================================
export function initGroupModal() {
  const modal = document.getElementById('modal-group');
  const btnNew = document.getElementById('btn-new-group');
  const btnFab = document.getElementById('fab-add');
  const btnCancel = document.getElementById('btn-cancel-group');
  const form = document.getElementById('form-group');
  const errorMsg = document.getElementById('group-error');

  // Abrir modal
  const abrirModal = () => {
    modal.classList.remove('hidden');
    errorMsg.textContent = '';
    form.reset();
  };

  btnNew.addEventListener('click', abrirModal);

  // Cerrar modal
  btnCancel.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Enviar formulario
  form.addEventListener('submit', async (e) => {
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
      cargarGrupos(); // Recargar la lista
    } catch (error) {
      errorMsg.textContent = 'Error al crear el grupo: ' + error.message;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Crear Grupo';
    }
  });
}
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
/* ==========================================
   8. DETALLE DEL GRUPO: BALANCE Y GASTOS
   ========================================== */
.balance-section, .expenses-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #edf2f7;
}

.balance-section h4, .expenses-section h4 {
  font-size: 1rem;
  color: #4a5568;
  margin-bottom: 12px;
}

.debt-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffaf0;
  border: 1px solid #fbd38d;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.debt-from { color: #e53e3e; font-weight: 600; }
.debt-arrow { color: #a0aec0; }
.debt-to { color: #38a169; font-weight: 600; }
.debt-amount { margin-left: auto; font-weight: 700; color: #2d3748; }

.expense-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
}

.expense-info h5 {
  font-size: 0.9rem;
  color: #2d3748;
  margin-bottom: 2px;
}

.expense-info span {
  font-size: 0.75rem;
  color: #718096;
}

.expense-amount {
  font-weight: 700;
  color: #2ecc87;
  font-size: 1rem;
}
