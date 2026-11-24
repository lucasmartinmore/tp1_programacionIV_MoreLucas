import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Reportes {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Compras completadas en un rango de fechas, con sus entradas (para contarlas).
  // Solo el admin/empleado puede leer todas las compras (policy "compras_select").
  getComprasEnRango(desde: string, hasta: string) {
    return this.supabase
      .from('compras_entradas')
      .select('creado_dia, total_compra, entradas(id_entrada)')
      .eq('estado_de_compra', 'COMPLETADA')
      .gte('creado_dia', desde + 'T00:00:00')
      .lte('creado_dia', hasta + 'T23:59:59')
      .order('creado_dia');
  }

  // Entradas vendidas desde una fecha
  // con el título de la película (join anidado)
  getEntradasDesde(desdeISO: string) {
    return this.supabase
      .from('compras_entradas')
      .select('entradas(funciones(peliculas(titulo_de_pelicula)))')
      .eq('estado_de_compra', 'COMPLETADA')
      .gte('creado_dia', desdeISO);
  }

  // Candy vendida desde una fecha. "!inner" obliga a que
  // exista la compra y permite filtrar por ella
  getCandyDesde(desdeISO: string) {
    return this.supabase
      .from('compras_candy')
      .select('cantidad, productos_candy(nombre_producto), compras_entradas!inner(creado_dia, estado_de_compra)')
      .eq('compras_entradas.estado_de_compra', 'COMPLETADA')
      .gte('compras_entradas.creado_dia', desdeISO);
  }
}