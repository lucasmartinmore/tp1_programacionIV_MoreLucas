import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Funciones } from '../../services/funciones';
import { Peliculas } from '../../services/peliculas';
import { Funcion } from '../../models/funcion';
import { Pelicula } from '../../models/pelicula';
import { ResenasPelicula } from '../resenas-pelicula/resenas-pelicula';

@Component({
  selector: 'app-funciones',
  standalone: true,
  imports: [CommonModule,ResenasPelicula],
  templateUrl: './funciones.html',
  styleUrl: './funciones.css'
})
export class FuncionesPage implements OnInit {
  pelicula = signal<Pelicula | null>(null);
  funciones = signal<Funcion[]>([]);
  cargando = signal<boolean>(true);

  constructor(
    private funcionesService: Funciones,
    private peliculasService: Peliculas,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idPelicula = this.route.snapshot.params['id'];
    if (idPelicula) {
      this.cargarDatos(idPelicula);
    }
  }

  cargarDatos(idPelicula: string) {
    this.cargando.set(true);

    // Traigo el detalle de la película (para mostrar título/poster arriba)
    // y sus funciones, en paralelo porque son independientes entre sí
    Promise.all([
      this.peliculasService.getPeliculaById(idPelicula),
      this.funcionesService.getFuncionesDePelicula(idPelicula)
    ]).then(([resultadoPelicula, resultadoFunciones]) => {
      this.pelicula.set(resultadoPelicula.data);
      this.funciones.set(resultadoFunciones.data || []);
      this.cargando.set(false);
    });
  }

  // Muestra solo la hora (ej: "18:00")
  formatearHora(fechaHoraInicio: string): string {
    const fecha = new Date(fechaHoraInicio);
    return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  // Recién aca se navega a la sala, con el id de la FUNCIÓN elegida, no de la película.
  elegirFuncion(idFuncion: string): void {
    this.router.navigate(['/sala', idFuncion]);
  }
}