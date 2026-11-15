import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Recompensas {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Las que ve el cliente en el club: solo las activas, de la mas barata a la mas cara
  getRecompensasActivas() {
    return this.supabase
      .from('recompensas')
      .select('*')
      .eq('activo', true)
      .order('costo_puntos');
  }

  // ---- Admin ----
  getTodasLasRecompensas() {
    return this.supabase.from('recompensas').select('*').order('costo_puntos');
  }

  crearRecompensa(datos: any) {
    return this.supabase.from('recompensas').insert([datos]);
  }

  actualizarRecompensa(id: string, costo: number, activo: boolean) {
    return this.supabase
      .from('recompensas')
      .update({ costo_puntos: costo, activo: activo })
      .eq('id', id);
  }

  // ---- Canje ----
  // rpc = "remote procedure call": llama a una función de Postgres por su nombre,
  // pasandole los parametros en un objeto
  canjear(idRecompensa: string) {
    return this.supabase.rpc('canjear_recompensa', { p_recompensa: idRecompensa });
  }

  getMisCanjes(idUsuario: string) {
    return this.supabase
      .from('canjes')
      .select('*')
      .eq('usuario_id', idUsuario)
      .order('creado', { ascending: false });
  }

  // Canjes de entrada gratis que todavia no uso (para el checkout)
  getCanjesEntradaDisponibles(idUsuario: string) {
    return this.supabase
      .from('canjes')
      .select('*')
      .eq('usuario_id', idUsuario)
      .eq('tipo', 'ENTRADA')
      .eq('usado', false);
  }

  usarCanjeEntrada(idCanje: string) {
    return this.supabase.rpc('usar_canje_entrada', { p_canje: idCanje });
  }
}