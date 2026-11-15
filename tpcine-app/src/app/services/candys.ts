import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { DatosProducto } from '../models/candy';

@Service()
export class CandyService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Lista para los clientes (candy bar): del mas caro al mas barato
  getProductos() {
    return this.supabase
      .from('productos_candy')
      .select('*')
      .order('precio_producto', { ascending: false });
  }

  /*===========================
    =        ADMIN            =
    ===========================
  */

  // Lista para el admin: ordenada por categoria y nombre 
  getProductosAdmin() {
    return this.supabase
      .from('productos_candy')
      .select('*')
      .order('categoria_producto', { ascending: true })
      .order('nombre_producto', { ascending: true });
  }

  getProductoById(id: string) {
    return this.supabase
      .from('productos_candy')
      .select('*')
      .eq('id_producto', id)
      .single();
  }

  crearProducto(datos: DatosProducto) {
    return this.supabase.from('productos_candy').insert([datos]);
  }

  actualizarProducto(id: string, datos: DatosProducto) {
    return this.supabase.from('productos_candy').update(datos).eq('id_producto', id);
  }

  eliminarProducto(id: string) {
    return this.supabase.from('productos_candy').delete().eq('id_producto', id);
  }
}