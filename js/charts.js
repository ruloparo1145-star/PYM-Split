// js/charts.js
import { supabase } from './supabase.js';

let chartPersonaInstance = null;
let chartCategoriaInstance = null;

const CATEGORIAS_CHART = {
  comida:       { label: 'Comida',       icono: '\u{1F355}', color: '#e53e3e' },
  transporte:   { label: 'Transporte',   icono: '\u{1F697}', color: '#3182ce' },
  alojamiento:  { label: 'Alojamiento',  icono: '\u{1F3E0}', color: '#38a169' },
  supermercado: { label: 'Supermercado', icono: '\u{1F6D2}', color: '#d69e2e' },
  ocio:         { label: 'Ocio',         icono: '\u{1F389}', color: '#9f7aea' },
  salud:        { label: 'Salud',        icono: '\u{1F48A}', color: '#e53e9e' },
  servicios:    { label: 'Servicios',    icono: '\u{1F4F1}', color: '#38b2ac' },
  compras:      { label: 'Compras',      icono: '\u{1F6CD}', color: '#ed8936' },
  viajes:       { label: 'Viajes',       icono: '\u2708',    color: '#4299e1' },
  otros:        { label: 'Otros',        icono: '\u{1F4B0}', color: '#718096' }
};

function getCat(c) {
  return CATEGORIAS_CHART[c] || CATEGORIAS_CHART.otros;
}

export async function cargarGraficos(groupId) {
  const { data: gastos, error } = await supabase
    .from('expenses')
    .select('amount, paid_by, category')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error cargando graficos:', error);
    return;
  }

  if (!gastos || gastos.length === 0) {
    limpiarCanvas('chart-by-person', chartPersonaInstance);
    chartPersonaInstance = null;
    limpiarCanvas('chart-by-category', chartCategoriaInstance);
    chartCategoriaInstance = null;
    const totales = document.getElementById('group-category-totals');
    if (totales) totales.innerHTML = '<p class="placeholder-text">Sin datos.</p>';
    return;
  }

  // === GrÃ¡fico por persona ===
  const paidByIds = [...new Set(gastos.map(g => g.paid_by))];
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', paidByIds);

  const nombres = {};
  (perfiles || []).forEach(p => nombres[p.id] = p.full_name || p.email || 'Desconocido');

  const porPersona = {};
  gastos.forEach(g => {
    const nombre = nombres[g.paid_by] || 'Desconocido';
    porPersona[nombre] = (porPersona[nombre] || 0) + parseFloat(g.amount);
  });

  const canvasPersona = document.getElementById('chart-by-person');
  if (canvasPersona) {
    if (chartPersonaInstance) chartPersonaInstance.destroy();
    chartPersonaInstance = new Chart(canvasPersona, {
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

  // === GrÃ¡fico por categorÃ­a ===
  const porCategoria = {};
  gastos.forEach(g => {
    const cat = g.category || 'otros';
    porCategoria[cat] = (porCategoria[cat] || 0) + parseFloat(g.amount);
  });

  const catLabels = [];
  const catData = [];
  const catColors = [];
  Object.keys(porCategoria).forEach(c => {
    const info = getCat(c);
    catLabels.push(info.label);
    catData.push(porCategoria[c]);
    catColors.push(info.color);
  });

  const canvasCat = document.getElementById('chart-by-category');
  if (canvasCat) {
    if (chartCategoriaInstance) chartCategoriaInstance.destroy();
    chartCategoriaInstance = new Chart(canvasCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: catColors,
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

  // === Totales por categorÃ­a (lista) ===
  const totales = document.getElementById('group-category-totals');
  if (totales) {
    const total = Object.values(porCategoria).reduce((a, b) => a + b, 0);
    const items = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
    totales.innerHTML = items.map(([cat, monto]) => {
      const info = getCat(cat);
      const pct = total > 0 ? ((monto / total) * 100).toFixed(0) : 0;
      return `
        <div class="category-total-row">
          <span class="category-total-icon">${info.icono}</span>
          <span class="category-total-label">${info.label}</span>
          <span class="category-total-amount">${monto.toFixed(2)} EUR <small>(${pct}%)</small></span>
        </div>
      `;
    }).join('');
  }
}

function limpiarCanvas(id, instance) {
  if (instance) instance.destroy();
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
