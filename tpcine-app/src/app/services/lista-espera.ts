import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class ListaEspera {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  anotarme(idFuncion: string, idUsuario: string) {
    return this.supabase
      .from('lista_espera')
      .insert({ funcion_id: idFuncion, usuario_id: idUsuario });
  }

  salir(idEspera: number) {
    return this.supabase.from('lista_espera').delete().eq('id_espera', idEspera);
  }

  miTurno(idFuncion: string, idUsuario: string) {
    return this.supabase
      .from('lista_espera')
      .select('*')
      .eq('funcion_id', idFuncion)
      .eq('usuario_id', idUsuario)
      .maybeSingle();
  }

  misListas(idUsuario: string) {
    return this.supabase
      .from('lista_espera')
      .select('*, funciones(id_funcion, fecha_hora_inicio, peliculas(titulo_de_pelicula))')
      .eq('usuario_id', idUsuario)
      .in('estado', ['ESPERANDO', 'NOTIFICADO'])
      .order('creada', { ascending: false });
  }

  marcarComprado(idFuncion: string, idUsuario: string) {
    return this.supabase
      .from('lista_espera')
      .update({ estado: 'COMPRADO' })
      .eq('funcion_id', idFuncion)
      .eq('usuario_id', idUsuario)
      .eq('estado', 'NOTIFICADO');
  }

  avanzarCola(idFuncion: string) {
    return this.supabase.rpc('avisar_siguiente_espera', { p_funcion: idFuncion });
  }

  conteoPorFuncion() {
    return this.supabase
      .from('lista_espera')
      .select('funcion_id')
      .in('estado', ['ESPERANDO', 'NOTIFICADO']);
  }
}