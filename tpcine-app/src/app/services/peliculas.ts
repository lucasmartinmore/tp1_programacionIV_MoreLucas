import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class Peliculas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabasePublishableKey
    );
  }

  getPeliculas() {
    return this.supabase.from('peliculas').select('*').eq('esta_en_cartelera', true);
  }

  getProximosEstrenos() {
    return this.supabase.from('peliculas').select('*').eq('esta_en_cartelera', false);
  }

  getTop3MasVendidas() {
    return this.supabase
      .from('peliculas')
      .select('*')
      .eq('esta_en_cartelera', true)
      .order('ventas_totales', { ascending: false })
      .limit(3);
  }

  getPeliculaById(id: string) {
    return this.supabase.from('peliculas').select('*').eq('id_pelicula', id).single();
  }
}