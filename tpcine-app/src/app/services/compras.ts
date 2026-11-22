import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Compras {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Cuantas compras completadas tiene el usuario (para el cupon de primera compra)
  // count + head: pide solo la cantidad, sin traer las filas
  async contarComprasDelUsuario(idUsuario: string): Promise<number> {
    const resultado = await this.supabase
      .from('compras_entradas')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', idUsuario)
      .eq('estado_de_compra', 'COMPLETADA');
    return resultado.count ?? 0;
  }

  // El id lo genera el front (crypto.randomUUID) para no necesitar leer la fila despues
  // un usuario anonimo no tiene permiso de SELECT sobre compras
  crearCompra(datos: any) {
    return this.supabase.from('compras_entradas').insert([datos]);
  }

  crearEntradas(filas: any[]) {
    return this.supabase.from('entradas').insert(filas).select();
  }

  crearCandy(filas: any[]) {
    return this.supabase.from('compras_candy').insert(filas);
  }

  cancelarCompra(idCompra: string) {
    return this.supabase
      .from('compras_entradas')
      .update({ estado_de_compra: 'CANCELADA' })
      .eq('id_compra_entrada', idCompra);
  }

  // Usa credito del usuario en una compra 
  // (la función verifica que le alcance)
  usarCredito(monto: number) {
    return this.supabase.rpc('usar_credito', { p_monto: monto });
  }

  // Las compras del usuario con pelicula, sala y hora
  // de la función (join a traves de entradas)
  getMisCompras(idUsuario: string) {
    return this.supabase
      .from('compras_entradas')
      .select(`
        id_compra_entrada, total_compra, credito_usado, estado_de_compra, creado_dia,
        entradas ( id_entrada, butaca_id,
          funciones ( id_funcion, fecha_hora_inicio, peliculas ( titulo_de_pelicula ), salas ( nombre_de_sala ) )
        )
      `)
      .eq('usuario_id', idUsuario)
      .order('creado_dia', { ascending: false });
  }

  // Cancela la compra y devuelve 
  // el credito acreditado (lo calcula la base)
  cancelarConCredito(idCompra: string) {
    return this.supabase.rpc('cancelar_compra', { p_compra: idCompra });
  }
}