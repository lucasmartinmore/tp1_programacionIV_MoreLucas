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
}