import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js/dist/index.cjs';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class CandyService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  getProductos() {
    return this.supabase.from('productos_candy').select('*').order('precio_producto', { ascending: false });
  }
}