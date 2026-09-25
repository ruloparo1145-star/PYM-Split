// js/history.js
import { supabase } from './supabase.js';
import { t } from './i18n.js';

const CATEGORIAS_ICONOS = {
  comida: '&#127829;',
  transporte: '&#128663;',
  alojamiento: '&#127968;',
  supermercado: '&#128722;',
  ocio: '&#127881;',
  salud: '&#128138;',
  servicios: '&#128241;',
  compras: '&#128717;',
  viajes: '&#9992;',
  otros: '&#128176;'
};

export async function cargarHistorial(groupId) {
  const listContainer = document.getElementById('group-history-list');
  if (!listContainer) return;
  listContainer.innerHTML = `<p class="placeholder-text">${t('group.detail.history_loading')}</p>`;

  // Gastos activos (no archivados) con categoria
  const { data: gastos } = await supabase
    .from('expenses')
    .select('id, description, amount, currency, date, created_at, paid_by, category')
    .eq('group_id', groupId)
    .eq('archived', false);

  // Settlements
  const { data: pagos } = await supabase
    .from('settlements')
    .select('id, amount, currency, date, created_at, from_user, to_user')
    .eq('group_id', groupId);

  const userIds = new Set();
  (gastos || []).forEach(g => g.paid_by && userIds.add(g.paid_by));
  (pagos || []).forEach(p => {
    if (p.from_user) userIds.add(p.from_user);
    if (p.to_user) userIds.add(p.to_user);
  });

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
    const cat = g.category || 'otros';
    eventos.push({
      tipo: 'gasto',
      fecha: g.created_at || g.date,
      icono: CATEGORIAS_ICONOS[cat] || CATEGORIAS_ICONOS.otros,
      titulo: g.description,
      detalle: t('history.paid_by', {
        nombre: nombres[g.paid_by] || t('debt.someone'),
        monto: parseFloat(g.amount).toFixed(2),
        moneda: g.currency
      }),
      color: '#3182ce'
    });
  });

  (pagos || []).forEach(p => {
    eventos.push({
      tipo: 'pago',
      fecha: p.created_at || p.date,
      icono: '&#128176;',
      titulo: t('history.debt_settled'),
      detalle: t('history.paid_from_to', {
        from: nombres[p.from_user] || t('debt.someone'),
        to: nombres[p.to_user] || t('debt.someone'),
        monto: parseFloat(p.amount).toFixed(2),
        moneda: p.currency
      }),
      color: '#38a169'
    });
  });

  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (eventos.length === 0) {
    listContainer.innerHTML = `<p class="placeholder-text">${t('group.detail.no_activity')}</p>`;
    return;
  }

  listContainer.innerHTML = eventos.map(e => `
    <div class="history-item">
      <div class="history-icon" style="background: ${e.color}20; color: ${e.color};">${e.icono}</div>
      <div class="history-info">
        <h5>${e.titulo}</h5>
        <p>${e.detalle}</p>
        <small>${new Date(e.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</small>
      </div>
    </div>
  `).join('');
}
