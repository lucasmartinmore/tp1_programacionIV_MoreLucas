import { DatePipe } from '@angular/common';
import { Component, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Resena } from '../../models/resena';
import { Auth } from '../../services/auth';
import { Resenas } from '../../services/resenas';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-resenas-pelicula',
  styleUrl: './resenas-pelicula.css',
  templateUrl: './resenas-pelicula.html',
})
export class ResenasPelicula implements OnInit {
  // El padre (pantalla de funciones) nos pasa el id de la pelicula
  peliculaId = input.required<string>();

  resenas = signal<Resena[]>([]);
  hayUsuario = signal<boolean>(false);
  estrellasElegidas = signal<number>(0);
  mensaje = signal<string>('');

  constructor(private resenasService: Resenas, private auth: Auth) {}

  async ngOnInit() {
    const resultadoUsuario = await this.auth.getUser();
    this.hayUsuario.set(resultadoUsuario.data.user !== null);
    await this.cargar();
  }

  async cargar() {
    const resultado = await this.resenasService.getResenasDePelicula(this.peliculaId());
    this.resenas.set((resultado.data as Resena[]) || []);
  }

  // Promedio de estrellas (0 si todavia no hay reseñas)
  promedio(): number {
    const lista = this.resenas();
    if (lista.length === 0) {
      return 0;
    }
    let suma = 0;
    for (const r of lista) {
      suma += r.estrellas;
    }
    return Math.round((suma / lista.length) * 10) / 10;
  }

  // Dibuja n estrellas llenas y el resto vacias asi: 3 -> ★★★☆☆
  estrellas(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  elegir(n: number) {
    this.estrellasElegidas.set(n);
  }

  async enviar(comentario: string, campo: HTMLTextAreaElement) {
    this.mensaje.set('');

    if (this.estrellasElegidas() === 0) {
      this.mensaje.set('Elegí de 1 a 5 estrellas.');
      return;
    }

    const resultadoUsuario = await this.auth.getUser();
    const usuario = resultadoUsuario.data.user;
    if (!usuario) {
      return;
    }

    // Para mostrar el nombre del autor lo copio del perfil
    const perfil = await this.auth.getPerfil(usuario.id);
    const nombre = perfil.data?.['nombre_usuario'] ?? 'Usuario';

    const resultado = await this.resenasService.guardarResena({
      pelicula_id: this.peliculaId(),
      usuario_id: usuario.id,
      nombre_autor: nombre,
      estrellas: this.estrellasElegidas(),
      comentario: comentario.trim() === '' ? null : comentario.trim(),
    });

    if (resultado.error) {
      this.mensaje.set('No se pudo guardar tu reseña.');
      return;
    }

    campo.value = '';
    this.estrellasElegidas.set(0);
    this.mensaje.set('¡Gracias por tu reseña!');
    await this.cargar();
  }
}