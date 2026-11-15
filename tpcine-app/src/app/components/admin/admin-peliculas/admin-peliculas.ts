import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Pelicula } from '../../../models/pelicula';
import { Peliculas } from '../../../services/peliculas';
import { DuracionPipe } from '../../../pipes/duracion-pipe';

@Component({
  imports: [DuracionPipe],
  selector: 'app-admin-peliculas',
  styleUrl: './admin-peliculas.css',
  templateUrl: './admin-peliculas.html',
})
export class AdminPeliculas implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);
  errorMensaje = signal<string>('');

  constructor(private peliculasService: Peliculas, private router: Router) {}

  ngOnInit(): void {
    this.cargarPeliculas();
  }

  async cargarPeliculas() {
    const resultado = await this.peliculasService.getTodasLasPeliculas();
    this.peliculas.set(resultado.data || []);
    this.cargando.set(false);
  }

  nueva() {
    this.router.navigate(['/admin/peliculas/nueva']);
  }

  editar(id?: string) {
    if (id) {
      this.router.navigate(['/admin/peliculas', id, 'editar']);
    }
  }

  // Prende o apaga "en cartelera" sin borrar la película
  async cambiarCartelera(pelicula: Pelicula) {
    if (!pelicula.id_pelicula) return;

    this.errorMensaje.set('');
    const resultado = await this.peliculasService.actualizarPelicula(pelicula.id_pelicula, {
      esta_en_cartelera: !pelicula.esta_en_cartelera,
    });

    if (resultado.error) {
      this.errorMensaje.set('No se pudo cambiar el estado de la película.');
      return;
    }
    this.cargarPeliculas();
  }

  async eliminar(pelicula: Pelicula) {
    if (!pelicula.id_pelicula) return;

    const confirmado = confirm(`¿Eliminar "${pelicula.titulo_de_pelicula}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.errorMensaje.set('');
    const resultado = await this.peliculasService.eliminarPelicula(pelicula.id_pelicula);

    if (resultado.error) {
      // Lo más probable: la película ya tiene funciones o entradas vendidas (clave foránea)
      this.errorMensaje.set(
        'No se pudo eliminar: probablemente tiene funciones o entradas asociadas. Sacala de la cartelera en su lugar.'
      );
      return;
    }
    this.cargarPeliculas();
  }
}