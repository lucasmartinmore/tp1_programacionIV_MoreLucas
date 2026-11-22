import { Service, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';

@Service()
export class Permisos {
  private supabase: SupabaseClient;
  secciones = signal<string[]>([]);
  esAdmin = signal<boolean>(false);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  // Se llama una vez al iniciar sesión (o al abrir el admin)
  async cargar(idUsuario: string) {
    const r = await this.supabase
      .from('usuarios')
      .select('rol_usuario, roles(permisos)')
      .eq('id_usuario', idUsuario)
      .single();

    this.esAdmin.set(r.data?.['rol_usuario'] === 'admin');
    this.secciones.set((r.data?.['roles'] as any)?.permisos || []);
  }

  limpiar() {
    this.esAdmin.set(false);
    this.secciones.set([]);
  }

  tiene(seccion: string): boolean {
    return this.esAdmin() || this.secciones().includes(seccion);
  }

  tieneAlguno(): boolean {
    return this.esAdmin() || this.secciones().length > 0;
  }

  getRoles() {
    return this.supabase.from('roles').select('*').order('nombre');
  }

  crearRol(nombre: string, permisos: string[]) {
    return this.supabase.from('roles').insert({ nombre, permisos });
  }

  asignarRol(idUsuario: string, idRol: number | null) {
    return this.supabase.rpc('asignar_rol', { p_usuario: idUsuario, p_rol: idRol });
  }

  getUsuarios() {
    return this.supabase
      .from('usuarios')
      .select('id_usuario, nombre_usuario, apellido_usuario, rol_usuario, rol_id')
      .order('nombre_usuario');
  }
}