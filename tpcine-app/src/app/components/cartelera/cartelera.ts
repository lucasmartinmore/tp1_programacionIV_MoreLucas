import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Pelicula } from '../../models/pelicula';
import { Peliculas as PeliculasService } from '../../services/peliculas';

@Component({
  imports: [CommonModule],
  selector: 'app-cartelera',
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);

  private peliculasService: PeliculasService;

  constructor() {
    this.peliculasService = new PeliculasService();
  }

  ngOnInit() {
    this.cargarPeliculas();
  }

  private cargarPeliculas() {
    this.peliculasService.getPeliculas().then(result => {
      this.peliculas.set(result.data || []);
      this.cargando.set(false);
    });
  }

  seleccionarPelicula(idPelicula?: string) {
    console.log('Película seleccionada:', idPelicula);
  }
}