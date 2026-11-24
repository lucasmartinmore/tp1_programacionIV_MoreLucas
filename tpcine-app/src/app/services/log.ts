import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Log {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Los últimos 100 movimientos, del más nuevo
  // al más viejo (con el nombre de quien lo hizo)
  getUltimos() {
    return this.supabase
      .from('log_actividad')
      .select('*, usuarios(nombre_usuario)')
      .order('creada', { ascending: false })
      .limit(100);
  }
}