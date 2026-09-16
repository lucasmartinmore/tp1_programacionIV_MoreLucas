import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class Peliculas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl, 
      environment.supabasePublishableKey
    );
  }

  /*===========================
    =   Cartelera Princ       =
    ===========================
  */
  getPeliculas() {
    return this.supabase
      .from('peliculas')
      .select('*')
      .eq('esta_en_cartelera', true);
  }

  /*===========================
    =   Cartelera Prox        =
    ===========================
  */
  getProximosEstrenos() {
    return this.supabase
      .from('peliculas')
      .select('*')
      .eq('esta_en_cartelera', false);
  }

  /*===========================
    =   Cartelera Mas Vend    =
    ===========================
  */
  getTop3MasVendidas() {
    return this.supabase
      .from('peliculas')
      .select('*')
      .eq('esta_en_cartelera', true)
      .limit(3);
  }

  /*===========================
    =     Obtengo por ID      =
    ===========================
  */
  getPeliculaById(id: string) {
    return this.supabase
      .from('peliculas')
      .select('*')
      .eq('id_pelicula', id)
      .single();
  }
}