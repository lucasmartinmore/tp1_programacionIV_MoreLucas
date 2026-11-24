import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Alertas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Ids de las películas en las que ya activé alerta
  //  (la policy solo me deja ver las mías)
  getMias() {
    return this.supabase.from('alertas_estreno').select('pelicula_id');
  }

  // usuario_id se completa solo en la base con auth.uid()
  activar(idPelicula: string) {
    return this.supabase.from('alertas_estreno').insert({ pelicula_id: idPelicula });
  }

  desactivar(idPelicula: string) {
    return this.supabase.from('alertas_estreno').delete().eq('pelicula_id', idPelicula);
  }

  // Llama a la función de la base que
  // avisa a quienes ya pueden comprar
  procesar() {
    return this.supabase.rpc('procesar_alertas');
  }
}