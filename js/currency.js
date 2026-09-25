// js/currency.js

// ==========================================
// MONEDAS SOPORTADAS POR FRANKFURTER
// ==========================================
export const MONEDAS_FRANKFURTER = [
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
];

// Monedas que puede resolver DolarAPI (cotizacion respecto al ARS)
const MONEDAS_DOLARAPI = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'];

const CACHE_PREFIX = 'pym_tasa_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ==========================================
// OBTENER TIPO DE CAMBIO (con cache y fallback)
// ==========================================
export async function obtenerTasa(desde, hasta) {
  desde = (desde || 'EUR').toUpperCase();
  hasta = (hasta || 'EUR').toUpperCase();

  if (desde === hasta) return 1;

  // Verificar cache
  const cacheKey = CACHE_PREFIX + desde + '_' + hasta;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { tasa, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        return tasa;
      }
    }
  } catch (e) {}

  // Intentar 1: Frankfurter (si ambas monedas estan soportadas)
  if (MONEDAS_FRANKFURTER.includes(desde) && MONEDAS_FRANKFURTER.includes(hasta)) {
    try {
      const url = `https://api.frankfurter.app/latest?from=${desde}&to=${hasta}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const tasa = data.rates?.[hasta];
        if (tasa) {
          guardarCache(cacheKey, tasa);
          return tasa;
        }
      }
    } catch (e) {
      console.warn('Frankfurter fallo, intentando DolarAPI...', e.message);
    }
  }

  // Intentar 2: DolarAPI (para ARS y otras monedas latinoamericanas)
  if (MONEDAS_DOLARAPI.includes(desde) || MONEDAS_DOLARAPI.includes(hasta)) {
    try {
      const tasa = await obtenerTasaDolarAPI(desde, hasta);
      if (tasa !== null) {
        guardarCache(cacheKey, tasa);
        return tasa;
      }
    } catch (e) {
      console.warn('DolarAPI fallo:', e.message);
    }
  }

  // No se pudo convertir
  console.warn(`No se pudo convertir ${desde} -> ${hasta}`);
  return null;
}

// ==========================================
// GUARDAR EN CACHE
// ==========================================
function guardarCache(cacheKey, tasa) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      tasa,
      timestamp: Date.now()
    }));
  } catch (e) {}
}

// ==========================================
// DOLARAPI - Obtener cotizaciones
// ==========================================
async function obtenerTasaDolarAPI(desde, hasta) {
  // Caso 1: una es ARS
  if (desde === 'ARS' || hasta === 'ARS') {
    const monedaExtranjera = desde === 'ARS' ? hasta : desde;
    const cotizacion = await getCotizacionDolarAPI(monedaExtranjera);
    if (cotizacion === null) return null;

    if (desde === 'ARS') {
      return 1 / cotizacion;
    } else {
      return cotizacion;
    }
  }

  // Caso 2: ninguna es ARS pero ambas estan en DolarAPI
  const cotDesde = await getCotizacionDolarAPI(desde);
  const cotHasta = await getCotizacionDolarAPI(hasta);

  if (cotDesde === null || cotHasta === null) return null;

  return cotDesde / cotHasta;
}

// ==========================================
// OBTENER COTIZACION ESPECIFICA
// ==========================================
async function getCotizacionDolarAPI(moneda) {
  try {
    if (moneda === 'USD') {
      const resp = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (!resp.ok) return null;
      const data = await resp.json();
      return parseFloat(data.venta) || null;
    }

    const resp = await fetch('https://dolarapi.com/v1/cotizaciones');
    if (!resp.ok) return null;
    const data = await resp.json();

    const cot = data.find(item => item.moneda === moneda);
    if (cot) {
      return parseFloat(cot.venta) || null;
    }

    return null;
  } catch (e) {
    console.warn('Error getCotizacionDolarAPI:', e.message);
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
    return { monto, convertido: false };
  }

  return { monto: monto * tasa, convertido: true };
}

// ==========================================
// CONVERTIR CON FALLBACK A COTIZACION MANUAL
// ==========================================
// Prioriza: 1) Frankfurter, 2) DolarAPI, 3) Cotizacion manual del grupo
// La cotizacion manual se guarda SIEMPRE respecto a USD.
// manualRateUSD = cuantos USD vale 1 unidad de la moneda DESTINO (hasta)
export async function convertirMontoConGrupo(monto, desde, hasta, manualRateUSD) {
  monto = parseFloat(monto) || 0;
  desde = (desde || 'EUR').toUpperCase();
  hasta = (hasta || 'EUR').toUpperCase();

  if (desde === hasta) {
    return { monto, convertido: true, fuente: 'same' };
  }

  // 1. Intentar API (Frankfurter + DolarAPI)
  const tasaAPI = await obtenerTasa(desde, hasta);
  if (tasaAPI !== null) {
    return { monto: monto * tasaAPI, convertido: true, fuente: 'api' };
  }

  // 2. Fallback: cotizacion manual
  // La cotizacion manual es: cuantos USD vale 1 unidad de "hasta"
  // Ej: hasta = ARS, manualRateUSD = 0.00083 (1 ARS = 0.00083 USD)
  if (manualRateUSD && manualRateUSD > 0) {
    // Necesitamos: 1 desde = X hasta
    // 1) desde -> USD
    const desdeAUSD = await obtenerTasa(desde, 'USD');
    if (desdeAUSD !== null) {
      // 1 desde = desdeAUSD USD
      // 1 hasta = manualRateUSD USD
      // Entonces: 1 desde = desdeAUSD / manualRateUSD hasta
      const tasa = desdeAUSD / manualRateUSD;
      return { monto: monto * tasa, convertido: true, fuente: 'manual' };
    }

    // Si desde === USD, no hace falta convertir
    if (desde === 'USD') {
      // 1 USD = 1 / manualRateUSD hasta
      const tasa = 1 / manualRateUSD;
      return { monto: monto * tasa, convertido: true, fuente: 'manual' };
    }
  }

  return { monto, convertido: false, fuente: 'none' };
}

// ==========================================
// CONVERTIR VARIOS MONTOS Y SUMAR
// ==========================================
export async function sumarConvertido(items, monedaDestino) {
  monedaDestino = (monedaDestino || 'EUR').toUpperCase();

  let total = 0;
  const noConvertidas = new Set();
  const monedasOrigen = new Set();
  let montoNoConvertido = 0;

  // 1. Agrupar por moneda origen
  const porMoneda = {};
  for (const item of items) {
    const monedaOrigen = (item.moneda || 'EUR').toUpperCase();
    const monto = parseFloat(item.monto) || 0;

    if (monedaOrigen === monedaDestino) {
      total += monto;
      continue;
    }

    monedasOrigen.add(monedaOrigen);
    if (!porMoneda[monedaOrigen]) porMoneda[monedaOrigen] = 0;
    porMoneda[monedaOrigen] += monto;
  }

  // 2. Resolver todas las tasas en paralelo
  const monedas = Object.keys(porMoneda);
  const tasasPromises = monedas.map(m => obtenerTasa(m, monedaDestino));
  const tasas = await Promise.all(tasasPromises);

  // 3. Aplicar las tasas
  monedas.forEach((moneda, i) => {
    const tasa = tasas[i];
    const monto = porMoneda[moneda];

    if (tasa === null) {
      noConvertidas.add(moneda);
      montoNoConvertido += monto;
    } else {
      total += monto * tasa;
    }
  });

  return {
    total,
    noConvertidas: [...noConvertidas],
    monedasOrigen: [...monedasOrigen],
    montoNoConvertido
  };
}

// ==========================================
// FORMATEAR MONTO
// ==========================================
export function formatearMonto(monto, moneda) {
  const n = parseFloat(monto) || 0;
  return n.toFixed(2) + ' ' + (moneda || 'EUR').toUpperCase();
}

// ==========================================
// SIMULADOR "HOY"
// ==========================================
export async function simularHoy(gastos, monedaGrupo) {
  monedaGrupo = (monedaGrupo || 'EUR').toUpperCase();

  let totalHistorico = 0;
  let totalHoy = 0;

  for (const g of gastos) {
    const monto = parseFloat(g.amount) || 0;
    const monedaGasto = (g.currency || monedaGrupo).toUpperCase();
    const tasaGuardada = parseFloat(g.exchange_rate) || 1;

    if (monedaGasto === monedaGrupo) {
      totalHistorico += monto;
      totalHoy += monto;
    } else {
      totalHistorico += monto * tasaGuardada;

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
