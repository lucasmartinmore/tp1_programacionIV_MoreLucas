import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Imagenes {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Sube el archivo al bucket "imagenes" y devuelve su URL pública
  // El nombre es un UUID para que dos archivos nunca se pisen
  async subir(archivo: File, carpeta: string): Promise<{ url: string; error: string }> {
    const extension = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
    const ruta = carpeta + '/' + crypto.randomUUID() + '.' + extension;

    const resultado = await this.supabase.storage
      .from('imagenes')
      .upload(ruta, archivo, { contentType: archivo.type });

    if (resultado.error) {
      return { url: '', error: resultado.error.message };
    }

    const publica = this.supabase.storage.from('imagenes').getPublicUrl(ruta);
    return { url: publica.data.publicUrl, error: '' };
  }
}