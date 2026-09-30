import { Component, OnInit, signal } from '@angular/core';
import { Pelicula } from '../../models/pelicula';
import { Peliculas } from '../../services/peliculas';

@Component({
  selector: 'app-proximamente',
  standalone: true,
  imports: [],
  templateUrl: './proximamente.html',
  styleUrl: './proximamente.css'
})
export class Proximamente implements OnInit {
  peliculasProximas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);

  constructor(private peliculasService: Peliculas) {}

  ngOnInit(): void {
    this.cargarEstrenos();
  }

  cargarEstrenos(): void {
    this.cargando.set(true);
    this.peliculasService.getProximosEstrenos().then(result => {
      this.peliculasProximas.set(result.data || []);
      this.cargando.set(false);
    });
  }

  activarAlerta(titulo: string): void {
    alert(`${titulo} - Te avisaremos cuando abra la preventa -`);
  }
}