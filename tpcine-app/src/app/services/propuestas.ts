import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Propuestas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // La regla de "una propuesta pendiente por usuario"
  // la garantiza un índice único parcial en PostgreSQL
  crear(titulo: string, sinopsis: string) {
    return this.supabase.from('propuestas_peliculas').insert({ titulo, sinopsis });
  }

  getPendientes() {
    return this.supabase
      .from('propuestas_peliculas')
      .select('*, usuarios(nombre_usuario)')
      .eq('estado', 'PENDIENTE')
      .order('creada');
  }

  getMias() {
    return this.supabase
      .from('propuestas_peliculas')
      .select('*')
      .order('creada', { ascending: false });
  }

  // El admin resuelve por RPC (security definer) para aprobar/rechazar
  // y disparar la notificación atómicamente
  resolver(id: number, acepta: boolean) {
    return this.supabase.rpc('resolver_propuesta', { p_id: id, p_acepta: acepta });
  }
}