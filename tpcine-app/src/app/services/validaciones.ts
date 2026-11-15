import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

// Resultado que muestra la pantalla
export interface ResultadoValidacion {
  ok: boolean;
  mensaje: string;
}

@Service()
export class Validaciones {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Decide si es candy o entrada segun el prefijo del texto del QR
  async validar(codigo: string): Promise<ResultadoValidacion> {
    if (codigo.startsWith('CANDY:')) {
      return this.validarCandy(codigo.replace('CANDY:', ''));
    }
    if (codigo.startsWith('CANJE:')) {
    return this.validarCanje(codigo.replace('CANJE:', ''));
    }
    return this.validarEntrada(codigo);
  }

  private async validarEntrada(qr: string): Promise<ResultadoValidacion> {
    // Marco como validada SOLO si todavia no lo estaba, y pido de vuelta los datos
    const resultado = await this.supabase
      .from('entradas')
      .update({ entrada_validada: true })
      .eq('qr_code_entrada', qr)
      .eq('entrada_validada', false)
      .select('butaca_id, funciones(fecha_hora_inicio, peliculas(titulo_de_pelicula), salas(nombre_de_sala))');

    if (resultado.error) {
      return { ok: false, mensaje: 'Error: ' + resultado.error.message };
    }

    const filas: any[] = resultado.data || [];

    if (filas.length > 0) {
      const funcion = filas[0]['funciones'];
      const pelicula = funcion?.['peliculas']?.['titulo_de_pelicula'];
      const sala = funcion?.['salas']?.['nombre_de_sala'];
      return {
        ok: true,
        mensaje: 'ENTRADA VÁLIDA · ' + pelicula + ' · ' + sala + ' · butaca ' + filas[0]['butaca_id'],
      };
    }

    // No actualizo nada: o el codigo no existe, o ya se habia usado. Me fijo
    const existe = await this.supabase
      .from('entradas')
      .select('id_entrada')
      .eq('qr_code_entrada', qr)
      .maybeSingle();

    if (existe.data) {
      return { ok: false, mensaje: 'ENTRADA YA UTILIZADA' };
    }
    return { ok: false, mensaje: 'CÓDIGO INEXISTENTE' };
  }

// Canje de producto de candy: se marca como usado solo si todavia no lo estaba
  private async validarCanje(codigo: string): Promise<ResultadoValidacion> {
    const resultado = await this.supabase
      .from('canjes')
      .update({ usado: true })
      .eq('codigo', codigo)
      .eq('tipo', 'CANDY')
      .eq('usado', false)
      .select('nombre_recompensa');

    if (resultado.error) {
      return { ok: false, mensaje: 'Error: ' + resultado.error.message };
    }

    const filas: any[] = resultado.data || [];

    if (filas.length > 0) {
      return { ok: true, mensaje: 'CANJE VÁLIDO · Entregar: ' + filas[0]['nombre_recompensa'] };
    }
    return { ok: false, mensaje: 'CANJE YA USADO O INEXISTENTE' };
  }

  private async validarCandy(idCompra: string): Promise<ResultadoValidacion> {
    const resultado = await this.supabase
      .from('compras_candy')
      .update({ retirado: true })
      .eq('compra_id', idCompra)
      .eq('retirado', false)
      .select('cantidad, productos_candy(nombre_producto)');

    if (resultado.error) {
      return { ok: false, mensaje: 'Error: ' + resultado.error.message };
    }

    const filas: any[] = resultado.data || [];

    if (filas.length > 0) {
      let detalle = '';
      for (const f of filas) {
        detalle += f['productos_candy']?.['nombre_producto'] + ' x' + f['cantidad'] + '  ';
      }
      return { ok: true, mensaje: 'CANDY VÁLIDA · Entregar: ' + detalle };
    }

    return { ok: false, mensaje: 'CANDY YA RETIRADA O INEXISTENTE' };
  }
}