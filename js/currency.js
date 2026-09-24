// js/currency.js

// ==========================================
// MONEDAS SOPORTADAS POR FRANKFURTER
// ==========================================
// Frankfurter (del Banco Central Europeo) soporta estas monedas.
// El resto se muestra sin convertir.
export const MONEDAS_SOPORTADAS = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

const CACHE_PREFIX = 'pym_tasa_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ==========================================
// OBTENER TIPO DE CAMBIO (con cache)
// ==========================================
export async function obtenerTasa(desde, hasta) {
  desde = (desde || 'EUR').toUpperCase();
  hasta = (hasta || 'EUR').toUpperCase();

  if (desde === hasta) return 1;

  // Verificar cache en localStorage
  const cacheKey = CACHE_PREFIX + desde + '_' + hasta;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { tasa, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        return tasa;
      }
    }
  } catch (e) {
    // Ignorar errores de localStorage
  }

  // Consultar Frankfurter
  try {
    const url = `https://api.frankfurter.app/latest?from=${desde}&to=${hasta}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Error HTTP ' + resp.status);

    const data = await resp.json();
    const tasa = data.rates?.[hasta];

    if (!tasa) throw new Error('Sin tasa disponible');

    // Guardar en cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        tasa,
        timestamp: Date.now()
      }));
    } catch (e) {}

    return tasa;

  } catch (error) {
    console.warn(`No se pudo convertir ${desde} -> ${hasta}:`, error.message);
    return null;
  }
}

// ==========================================
// CONVERTIR MONTO
// ==========================================
export async function convertirMonto(monto, desde, hasta) {
  monto = parseFloat(monto);
  if (isNaN(monto)) return { monto: 0, convertido: true };

  desde = (desde || 'EUR').toUpperCase();
  hasta = (hasta || 'EUR').toUpperCase();

  if (desde === hasta) {
    return { monto, convertido: true };
  }

  const tasa = await obtenerTasa(desde, hasta);
  if (tasa === null) {
    // No se pudo convertir
    return { monto, convertido: false };
  }

  return { monto: monto * tasa, convertido: true };
}

// ==========================================
// CONVERTIR VARIOS MONTOS Y SUMAR
// ==========================================
// Recibe: [{ monto, moneda }] y una moneda destino
// Devuelve: { total, noConvertidas: [monedas] }
export async function sumarConvertido(items, monedaDestino) {
  monedaDestino = (monedaDestino || 'EUR').toUpperCase();

  let total = 0;
  const noConvertidas = new Set();
  const monedasOrigen = new Set();

  for (const item of items) {
    const monedaOrigen = (item.moneda || 'EUR').toUpperCase();

    if (monedaOrigen === monedaDestino) {
      total += parseFloat(item.monto) || 0;
      continue;
    }

    monedasOrigen.add(monedaOrigen);

    const tasa = await obtenerTasa(monedaOrigen, monedaDestino);
    if (tasa === null) {
      total += parseFloat(item.monto) || 0;
      noConvertidas.add(monedaOrigen);
    } else {
      total += (parseFloat(item.monto) || 0) * tasa;
    }
  }

  return {
    total,
    noConvertidas: [...noConvertidas],
    monedasOrigen: [...monedasOrigen]
  };
}

// ==========================================
// FORMATEAR MONTO CON MONEDA
// ==========================================
export function formatearMonto(monto, moneda) {
  const n = parseFloat(monto) || 0;
  return n.toFixed(2) + ' ' + (moneda || 'EUR').toUpperCase();
}
// ==========================================
// CALCULAR SIMULADOR "HOY"
// ==========================================
// Recibe: array de gastos con { amount, currency }
// Devuelve: { totalHistorico, totalHoy, diferencia, moneda }
export async function simularHoy(gastos, monedaGrupo) {
  monedaGrupo = (monedaGrupo || 'EUR').toUpperCase();

  let totalHistorico = 0;
  let totalHoy = 0;

  for (const g of gastos) {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasaGuardada = parseFloat(g.exchange_rate) || 1;

    // Total histÃ³rico: monto * tasa del momento (si el gasto fue en otra moneda)
    if (monedaGasto === monedaGrupo) {
      totalHistorico += monto;
    } else {
      totalHistorico += monto * tasaGuardada;
    }

    // Total hoy: convertir con tasas actuales
    if (monedaGasto === monedaGrupo) {
      totalHoy += monto;
    } else {
      const tasaHoy = await obtenerTasa(monedaGasto, monedaGrupo);
      if (tasaHoy !== null) {
        totalHoy += monto * tasaHoy;
      } else {
        totalHoy += monto * tasaGuardada;
      }
    }
  }

  const diferencia = totalHoy - totalHistorico;
  const porcentaje = totalHistorico > 0 ? (diferencia / totalHistorico * 100) : 0;

  return {
    totalHistorico,
    totalHoy,
    diferencia,
    porcentaje,
    moneda: monedaGrupo
  };
}
