import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Funciones {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Todas las funciones (horarios) de una película, de la más próxima a la más lejana
  getFuncionesDePelicula(peliculaId: string) {
    return this.supabase
      .from('funciones')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha_hora_inicio', { ascending: true });
  }

  /*===========================
    =        ADMIN            =
    ===========================
  */

  // Proximas funciones con el título de la película y el nombre de la sala.
  // "peliculas(...)" y "salas(...)" traen los datos de las tablas relacionadas (join).
  getFuncionesProximas() {
    return this.supabase
      .from('funciones')
      .select('*, peliculas(titulo_de_pelicula), salas(nombre_de_sala)')
      .gte('fecha_hora_inicio', new Date().toISOString())
      .order('fecha_hora_inicio', { ascending: true })
      .limit(200);
  }

  // Funciones que caen dentro de un período (de todas las salas): se usan para buscar sala libre
  getFuncionesEnPeriodo(desdeISO: string, hastaISO: string) {
    return this.supabase
      .from('funciones')
      .select('*')
      .lt('fecha_hora_inicio', hastaISO)
      .gt('fecha_hora_fin', desdeISO);
  }

  getSalas() {
    return this.supabase
      .from('salas')
      .select('*')
      .order('nombre_de_sala', { ascending: true });
  }

  // Inserta varias funciones de una sola vez (recibe un array)
  crearFunciones(funciones: any[]) {
    return this.supabase.from('funciones').insert(funciones);
  }

  eliminarFuncion(id: string) {
    return this.supabase.from('funciones').delete().eq('id_funcion', id);
  }

  // Funcion con los datos de su pelicula y su sala (para el checkout y el ticket)
  getFuncionDetalle(idFuncion: string) {
    return this.supabase
      .from('funciones')
      .select('*, peliculas(titulo_de_pelicula, restriccion_de_edad), salas(nombre_de_sala)')
      .eq('id_funcion', idFuncion)
      .single();
  }
}