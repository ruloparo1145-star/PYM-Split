// js/charts.js
import { supabase } from './supabase.js';

let chartInstance = null;

export async function cargarGraficos(groupId) {
  const canvas = document.getElementById('chart-by-person');
  if (!canvas) return;

  // Traer gastos del grupo
  const { data: gastos, error } = await supabase
    .from('expenses')
  .select('amount, paid_by, profiles(full_name, email)')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error cargando grÃ¡ficos:', error);
    return;
  }

  // Si no hay gastos, limpiar el canvas
  if (!gastos || gastos.length === 0) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  // Agrupar gastos por persona
  const porPersona = {};
  gastos.forEach(g => {
    const nombre = g.profiles?.full_name || g.profiles?.email || 'Desconocido';
    porPersona[nombre] = (porPersona[nombre] || 0) + parseFloat(g.amount);
  });

  // Destruir chart anterior si existe
  if (chartInstance) chartInstance.destroy();

  // Crear chart nuevo
  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(porPersona),
      datasets: [{
        data: Object.values(porPersona),
        backgroundColor: [
          '#2ecc87', '#3182ce', '#e53e3e', '#ed8936',
          '#9f7aea', '#38b2ac', '#d69e2e', '#e53e9e'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(2)} â‚¬`
          }
        }
      }
    }
  });
}
