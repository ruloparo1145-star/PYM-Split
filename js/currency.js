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
// DolarAPI devuelve cotizaciones del dolar en Argentina.
// Endpoint: https://dolarapi.com/v1/dolares
// Tambien tiene cotizaciones en: https://dolarapi.com/v1/cotizaciones
async function obtenerTasaDolarAPI(desde, hasta) {
  // Necesitamos las cotizaciones base (todas respecto a ARS)
  // Pero DolarAPI solo da ARS como base, asi que necesitamos
  // convertir: desde -> ARS -> hasta

  // Caso 1: desde o hasta es ARS
  if (desde === 'ARS' || hasta === 'ARS') {
    // Necesitamos la cotizacion de la moneda NO-ARS
    const monedaExtranjera = desde === 'ARS' ? hasta : desde;

    // Obtener cotizacion de esa moneda respecto a ARS
    const cotizacion = await getCotizacionDolarAPI(monedaExtranjera);
    if (cotizacion === null) return null;

    // cotizacion = cuantos ARS vale 1 unidad de monedaExtranjera
    if (desde === 'ARS') {
      // ARS -> monedaExtranjera: 1 ARS = 1/cotizacion monedaExtranjera
      return 1 / cotizacion;
    } else {
      // monedaExtranjera -> ARS: 1 monedaExtranjera = cotizacion ARS
      return cotizacion;
    }
  }

  // Caso 2: ninguna es ARS, pero ambas tienen cotizacion en DolarAPI
  // Ej: USD -> EUR. Se hace USD -> ARS -> EUR
  const cotDesde = await getCotizacionDolarAPI(desde);
  const cotHasta = await getCotizacionDolarAPI(hasta);

  if (cotDesde === null || cotHasta === null) return null;

  // cotDesde = cuantos ARS vale 1 desde
  // cotHasta = cuantos ARS vale 1 hasta
  // desde -> hasta = cotDesde / cotHasta
  return cotDesde / cotHasta;
}

// ==========================================
// OBTENER COTIZACION ESPECIFICA
// ==========================================
async function getCotizacionDolarAPI(moneda) {
  // DolarAPI tiene 2 endpoints:
  // /v1/dolares -> cotizacion del dolar (oficial, blue, mep, etc.)
  // /v1/cotizaciones -> cotizacion de otras monedas (EUR, BRL, etc.)

  try {
    if (moneda === 'USD') {
      // Usar dolar oficial
      const resp = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (!resp.ok) return null;
      const data = await resp.json();
      return parseFloat(data.venta) || null;
    }

    // Otras monedas: EUR, BRL, CLP, UYU
    const resp = await fetch('https://dolarapi.com/v1/cotizaciones');
    if (!resp.ok) return null;
    const data = await resp.json();

    // data es un array tipo [{moneda: 'EUR', nombre: 'Euro', compra: ..., venta: ...}, ...]
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
// CONVERTIR VARIOS MONTOS Y SUMAR
// ==========================================
export async function sumarConvertido(items, monedaDestino) {
  monedaDestino = (monedaDestino || 'EUR').toUpperCase();

  let total = 0;
  const noConvertidas = new Set();
  const monedasOrigen = new Set();
  let montoNoConvertido = 0;

  for (const item of items) {
    const monedaOrigen = (item.moneda || 'EUR').toUpperCase();
    const monto = parseFloat(item.monto) || 0;

    if (monedaOrigen === monedaDestino) {
      total += monto;
      continue;
    }

    monedasOrigen.add(monedaOrigen);

    const tasa = await obtenerTasa(monedaOrigen, monedaDestino);
    if (tasa === null) {
      noConvertidas.add(monedaOrigen);
      montoNoConvertido += monto;
    } else {
      total += monto * tasa;
    }
  }

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
