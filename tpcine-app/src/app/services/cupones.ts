import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Cupones {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  getTodosLosCupones() {
    return this.supabase.from('cupones').select('*').order('codigo');
  }

  actualizarCupon(codigo: string, porcentaje: number, activo: boolean) {
    return this.supabase
      .from('cupones')
      .update({ porcentaje: porcentaje, activo: activo })
      .eq('codigo', codigo);
  }
}