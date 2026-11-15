import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { DatosPelicula } from '../models/pelicula';

@Service()
export class Peliculas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  /*===========================
    =   Cartelera Princ       =
    ===========================
  */
  // Me devuelve tambien los generos de cada pelicula (join con peliculas_generos y generos)
  getPeliculas() {
    return this.supabase
      .from('peliculas')
      .select('*, peliculas_generos(generos(id_genero, nombre))')
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
      .order('ventas_totales', { ascending: false })
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

  /*===========================
    =        GENEROS          =
    ===========================
  */

  // Traigo todos los generos disponibles (para los checkbox del formulario)
  getGeneros() {
    return this.supabase.from('generos').select('*').order('nombre');
  }

  // Traigo los ids de los generos que ya tiene una pelicula (para tildarlos al editar)
  getGenerosDePelicula(idPelicula: string) {
    return this.supabase
      .from('peliculas_generos')
      .select('genero_id')
      .eq('pelicula_id', idPelicula);
  }

  // Reemplazo los generos de la pelicula: borro los que tenia y guardo los elegidos
  async guardarGeneros(idPelicula: string, idsGeneros: number[]) {
    await this.supabase.from('peliculas_generos').delete().eq('pelicula_id', idPelicula);

    if (idsGeneros.length === 0) {
      return;
    }

    const filas = idsGeneros.map(id => ({ pelicula_id: idPelicula, genero_id: id }));
    await this.supabase.from('peliculas_generos').insert(filas);
  }

  /*===========================
    =        ADMIN            =
    ===========================
  */

  // Todas las peliculas, esten o no en cartelera
  getTodasLasPeliculas() {
    return this.supabase
      .from('peliculas')
      .select('*')
      .order('titulo_de_pelicula', { ascending: true });
  }

  // Devuelvo la pelicula creada (con su id) para poder guardar sus generos
  crearPelicula(datos: DatosPelicula) {
    return this.supabase.from('peliculas').insert([datos]).select().single();
  }

  actualizarPelicula(id: string, datos: Partial<DatosPelicula>) {
    return this.supabase.from('peliculas').update(datos).eq('id_pelicula', id);
  }

  eliminarPelicula(id: string) {
    return this.supabase.from('peliculas').delete().eq('id_pelicula', id);
  }
}