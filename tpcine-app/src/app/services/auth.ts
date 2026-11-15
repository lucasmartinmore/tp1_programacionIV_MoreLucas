import { Service, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environments';
import { DatosRegistro } from '../models/usuario';

@Service()
export class Auth {
  private supabase: SupabaseClient;

  // Signals que lee el navbar: se actualizan solos al iniciar o cerrar sesión
  emailUsuario = signal<string | null>(null);
  rolUsuario = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
    // Si ya había una sesión abierta (al recargar la página), la recupero
    this.recuperarSesion();
  }

  private async recuperarSesion() {
    const resultado = await this.supabase.auth.getUser();
    this.emailUsuario.set(resultado.data.user?.email ?? null);
    await this.obtenerRol();
  }

  // Busca en mi tabla "usuarios" el rol (admin / empleado / cliente) de quien está logueado.
  // Devuelve null si no hay nadie logueado.
  async obtenerRol(): Promise<string | null> {
    const resultado = await this.supabase.auth.getUser();
    const usuario = resultado.data.user;

    if (!usuario) {
      this.rolUsuario.set(null);
      return null;
    }

    const perfil = await this.getPerfil(usuario.id);
    const rol = perfil.data?.rol_usuario ?? null;
    this.rolUsuario.set(rol);
    return rol;
  }

  async signUp(email: string, password: string) {
    const resultado = await this.supabase.auth.signUp({ email, password });
    if (!resultado.error && resultado.data.session) {
      this.emailUsuario.set(resultado.data.user?.email ?? null);
    }
    return resultado;
  }

  crearPerfilUsuario(idUsuario: string, datos: DatosRegistro) {
    return this.supabase.from('usuarios').insert([{ id_usuario: idUsuario, ...datos }]);
  }

  async signIn(email: string, password: string) {
    const resultado = await this.supabase.auth.signInWithPassword({ email, password });
    if (!resultado.error) {
      this.emailUsuario.set(resultado.data.user.email ?? null);
      await this.obtenerRol();
    }
    return resultado;
  }

  async signOut() {
    const resultado = await this.supabase.auth.signOut();
    this.emailUsuario.set(null);
    this.rolUsuario.set(null);
    return resultado;
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  getPerfil(idUsuario: string) {
    return this.supabase.from('usuarios').select('*').eq('id_usuario', idUsuario).single();
  }

  // Después del registro el rol queda en 'cliente' (valor por defecto de la tabla)
  async despuesDeRegistro() {
    await this.obtenerRol();
  }
}