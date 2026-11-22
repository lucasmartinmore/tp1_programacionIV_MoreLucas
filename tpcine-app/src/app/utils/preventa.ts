// Devuelve 'antes' (todavía no se puede comprar), 'preventa', o 'normal'
// No hace falta "apagar" la preventa a mano
// se calcula sola comparando hoy contra la fecha de estreno
export function estadoPreventa(fechaEstreno: string | null | undefined): 'antes' | 'preventa' | 'normal' {
  if (!fechaEstreno) {
    return 'normal';
  }

  // Tomo solo YYYY-MM-DD por si viene con hora y le sumo medianoche local
  const soloFecha = fechaEstreno.slice(0, 10);
  const estreno = new Date(soloFecha + 'T00:00:00').getTime();
  const sieteDias = 7 * 24 * 60 * 60 * 1000;
  const ahora = Date.now();

  if (ahora < estreno - sieteDias) {
    return 'antes';
  }
  if (ahora < estreno) {
    return 'preventa';
  }
  return 'normal';
}