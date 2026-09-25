// js/history.js
import { supabase } from './supabase.js';

export async function cargarHistorial(groupId) {
  const listContainer = document.getElementById('group-history-list');
  if (!listContainer) return;
  listContainer.innerHTML = '<p class="placeholder-text">Cargando historial...</p>';

  // 1. Gastos activos (no archivados)
  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, created_at, paid_by')
    .eq('group_id', groupId)
    .eq('archived', false);

  // 2. Settlements
  const { data: pagos } = await supabase
    .from('settlements')
    .select('id, amount, currency, date, created_at, from_user, to_user')
    .eq('group_id', groupId);

  // 3. Recolectar user_ids
  const userIds = new Set();
  (gastos || []).forEach(g => g.paid_by && userIds.add(g.paid_by));
  (pagos || []).forEach(p => {
    if (p.from_user) userIds.add(p.from_user);
    if (p.to_user) userIds.add(p.to_user);
  });

  // 4. Traer perfiles
  const nombres = {};
  if (userIds.size > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', [...userIds]);
    (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email);
  }

  const eventos = [];

  (gastos || []).forEach(g => {
    eventos.push({
      tipo: 'gasto',
      fecha: g.created_at || g.date,
      icono: '&#127829;',
      titulo: g.description,
      detalle: `${nombres[g.paid_by] || 'Alguien'} pago ${parseFloat(g.amount).toFixed(2)} ${g.currency}`,
      color: '#3182ce'
    });
  });

  (pagos || []).forEach(p => {
    eventos.push({
      tipo: 'pago',
      fecha: p.created_at || p.date,
      icono: '&#128176;',
      titulo: 'Deuda saldada',
      detalle: `${nombres[p.from_user] || 'Alguien'} pago a ${nombres[p.to_user] || 'alguien'} ${parseFloat(p.amount).toFixed(2)} ${p.currency}`,
      color: '#38a169'
    });
  });

  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (eventos.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">Sin actividad aun.</p>';
    return;
  }

  listContainer.innerHTML = eventos.map(e => `
    <div class="history-item">
      <div class="history-icon" style="background: ${e.color}20; color: ${e.color};">${e.icono}</div>
      <div class="history-info">
        <h5>${e.titulo}</h5>
        <p>${e.detalle}</p>
        <small>${new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
      </div>
    </div>
  `).join('');
}
