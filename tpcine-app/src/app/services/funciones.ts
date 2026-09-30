import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class Funciones {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Todas las funciones programadas para una película puntual
  // ordenadas de la más próxima a la más lejana.
  getFuncionesDePelicula(peliculaId: string) {
    return this.supabase
      .from('funciones')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha_hora_inicio', { ascending: true });
  }
}