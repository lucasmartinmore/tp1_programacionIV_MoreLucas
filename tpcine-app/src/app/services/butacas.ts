import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class ButacasService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  getSalaDeLaFuncion(funcionId: string) {
    return this.supabase
      .from('funciones')
      .select('sala_id')
      .eq('id_funcion', funcionId)
      .single();
  }

  getButacasDeLaSala(salaId: string) {
    return this.supabase
      .from('butacas')
      .select('*')
      .eq('sala_id', salaId)
      .order('fila_de_butaca', { ascending: true })
      .order('columna_de_butaca', { ascending: true });
  }

  getButacasOcupadasDeLaFuncion(funcionId: string) {
    return this.supabase
      .from('entradas')
      .select('butaca_id')
      .eq('funcion_id', funcionId);
  }
}