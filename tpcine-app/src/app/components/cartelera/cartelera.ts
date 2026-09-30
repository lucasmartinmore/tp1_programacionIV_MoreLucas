import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Pelicula } from '../../models/pelicula';
import { Peliculas } from '../../services/peliculas';

@Component({
  selector: 'app-cartelera',
  standalone: true,
  imports: [],
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);

  constructor(
    private peliculasService: Peliculas,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPeliculas();
  }

  private cargarPeliculas(): void {
    this.peliculasService.getPeliculas().then(result => {
      this.peliculas.set(result.data || []);
      this.cargando.set(false);
    });
  }

  seleccionarPelicula(idPelicula?: string): void {
  if (idPelicula) {
    this.router.navigate(['/funciones', idPelicula]); 
  }
}
}