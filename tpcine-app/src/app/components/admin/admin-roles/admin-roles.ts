import { Component, OnInit, signal } from '@angular/core';
import { Permisos } from '../../../services/permisos';

@Component({
  imports: [],
  selector: 'app-admin-roles',
  styleUrl: './admin-roles.css',
  templateUrl: './admin-roles.html',
})
export class AdminRoles implements OnInit {
  secciones = ['peliculas', 'funciones', 'productos', 'cupones', 'recompensas', 'reportes', 'propuestas'];
  roles = signal<any[]>([]);
  usuarios = signal<any[]>([]);
  elegidas = signal<string[]>([]);
  mensaje = signal<string>('');
  errorMensaje = signal<string>('');

  constructor(private permisos: Permisos) {}

  async ngOnInit() {
    this.roles.set((await this.permisos.getRoles()).data || []);
    this.usuarios.set((await this.permisos.getUsuarios()).data || []);
  }

  alternar(s: string) {
    const actual = this.elegidas();
    this.elegidas.set(actual.includes(s) ? actual.filter(x => x !== s) : [...actual, s]);
  }

  async crear(nombre: HTMLInputElement) {
    this.mensaje.set('');
    this.errorMensaje.set('');
    if (!nombre.value.trim()) {
      this.errorMensaje.set('Escribí un nombre para el rol.');
      return;
    }
    const r = await this.permisos.crearRol(nombre.value.trim(), this.elegidas());
    if (r.error) {
      this.errorMensaje.set(r.error.message);
      return;
    }
    nombre.value = '';
    this.elegidas.set([]);
    this.mensaje.set('Rol creado.');
    await this.ngOnInit();
  }

  async asignar(idUsuario: string, idRol: string) {
    this.mensaje.set('');
    this.errorMensaje.set('');
    const r = await this.permisos.asignarRol(idUsuario, idRol ? Number(idRol) : null);
    if (r.error) {
      this.errorMensaje.set(r.error.message);
      return;
    }
    this.mensaje.set('Rol actualizado.');
    await this.ngOnInit();
  }
}