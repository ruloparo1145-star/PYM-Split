// js/charts.js
import { supabase } from './supabase.js';

let chartInstance = null;

export async function cargarGraficos(groupId) {
  const canvas = document.getElementById('chart-by-person');
  if (!canvas) return;

  // 1. Traer gastos sin join
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select('amount, paid_by')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error cargando graficos:', error);
    return;
  }

  if (!gastos || gastos.length === 0) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // 2. Traer perfiles
  const paidByIds = [...new Set(gastos.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email || 'Desconocido');

  // 3. Agrupar por persona
  const porPersona = {};
  gastos.forEach(g => {
    const nombre = nombres[g.paid_by] || 'Desconocido';
    porPersona[nombre] = (porPersona[nombre] || 0) + parseFloat(g.amount);
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(porPersona),
      datasets: [{
        data: Object.values(porPersona),
        backgroundColor: ['#2ecc87', '#3182ce', '#e53e3e', '#ed8936', '#9f7aea', '#38b2ac', '#d69e2e', '#e53e9e'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(2)} EUR` } }
      }
    }
  });
}
