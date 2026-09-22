// ==========================================
// 5. CARGAR GASTOS DE UN GRUPO
// ==========================================
export async function cargarGastosDelGrupo(groupId) {
  const listContainer = document.getElementById('group-expenses-list');
  
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, currency, date,
      payer:profiles!expenses_paid_by_fkey(id, full_name, email)
    `)
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) {
    listContainer.innerHTML = '<p class="error-msg">Error al cargar gastos.</p>';
    return;
  }

  if (!gastos || gastos.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No hay gastos aún. ¡Añade el primero!</p>';
    return;
  }

  listContainer.innerHTML = gastos.map(g => `
    <div class="expense-card">
      <div class="expense-info">
        <h5>${g.description}</h5>
        <span>Pagó: ${g.payer?.full_name || g.payer?.email || 'Desconocido'} · ${g.date}</span>
      </div>
      <div class="expense-amount">
        ${parseFloat(g.amount).toFixed(2)} ${g.currency}
      </div>
    </div>
  `).join('');
}
