// js/history.js
import { supabase } from './supabase.js';

// ==========================================
// 1. CARGAR HISTORIAL DEL GRUPO
// ==========================================
export async function cargarHistorial(groupId) {
  const listContainer = document.getElementById('group-history-list');
  listContainer.innerHTML = '<p class="placeholder-text">Cargando historial...</p>';

  // Traer gastos y pagos en paralelo
  const [gastosRes, pagosRes] = await Promise.all([
    supabase
      .from('expenses')
      .select(`
        id, description, amount, currency, date, created_at,
       .select('amount, paid_by, profiles(full_name, email)')
      `)
      .eq('group_id', groupId),
    supabase
      .from('settlements')
      .select(`
        id, amount, currency, date, created_at,
        from_profile:profiles!settlements_from_user_fkey(id, full_name, email),
        to_profile:profiles!settlements_to_user_fkey(id, full_name, email)
      `)
      .eq('group_id', groupId)
  ]);

  const eventos = [];

  // AÃ±adir gastos como eventos
  (gastosRes.data || []).forEach(g => {
    eventos.push({
      tipo: 'gasto',
      fecha: g.created_at || g.date,
      icono: 'ðŸ�•',
      titulo: g.description,
      detalle: `${g.payer?.full_name || g.payer?.email || 'Alguien'} pagÃ³ ${parseFloat(g.amount).toFixed(2)} ${g.currency}`,
      color: '#3182ce'
    });
  });

  // AÃ±adir pagos como eventos
  (pagosRes.data || []).forEach(p => {
    eventos.push({
      tipo: 'pago',
      fecha: p.created_at || p.date,
      icono: 'ðŸ’¸',
      titulo: 'Deuda saldada',
      detalle: `${p.from_profile?.full_name || p.from_profile?.email || 'Alguien'} pagÃ³ a ${p.to_profile?.full_name || p.to_profile?.email || 'alguien'} ${parseFloat(p.amount).toFixed(2)} ${p.currency}`,
      color: '#38a169'
    });
  });

  // Ordenar por fecha descendente
  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (eventos.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">Sin actividad aÃºn.</p>';
    return;
  }

  // Renderizar
  listContainer.innerHTML = eventos.map(e => `
    <div class="history-item">
      <div class="history-icon" style="background: ${e.color}20; color: ${e.color};">
        ${e.icono}
      </div>
      <div class="history-info">
        <h5>${e.titulo}</h5>
        <p>${e.detalle}</p>
        <small>${new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
      </div>
    </div>
  `).join('');
}
