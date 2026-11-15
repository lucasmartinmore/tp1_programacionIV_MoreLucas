import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Resenas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  getResenasDePelicula(idPelicula: string) {
    return this.supabase
      .from('resenas')
      .select('*')
      .eq('pelicula_id', idPelicula)
      .order('creado', { ascending: false });
  }

  // upsert: Inserta y si ya existe (misma película y mismo usuario) actualiza
  guardarResena(datos: any) {
    return this.supabase
      .from('resenas')
      .upsert([datos], { onConflict: 'pelicula_id,usuario_id' });
  }
}