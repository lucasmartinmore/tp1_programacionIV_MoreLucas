import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Pelicula } from '../../models/pelicula';
import { Peliculas } from '../../services/peliculas';
import { DuracionPipe } from '../../pipes/duracion-pipe';
import { FiltroPipe } from '../../pipes/filtro-pipe';
import { HoverZoomDirective } from '../../directivas/hover-zoom.directive';
import { estadoPreventa } from '../../utils/preventa';

@Component({
  selector: 'app-cartelera',
  imports: [DuracionPipe, FiltroPipe, HoverZoomDirective],
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera implements OnInit {
  peliculas = signal<Pelicula[]>([]);
  cargando = signal<boolean>(true);

  // Texto que escribe el usuario en el buscador; 
  // el pipe "filtro" lo usa para filtrar la lista
  busqueda = signal<string>('');

  // Genero elegido en los botones 
  // ('' significa "todos")
  generoElegido = signal<string>('');

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

  // Se ejecuta cada vez que el usuario
  //  escribe una letra en el buscador
  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  // Nombres de los generos que existen en la lista actual (sin repetir),
  // se usan para armar los botones de filtro
  generosDisponibles(): string[] {
    const nombres: string[] = [];

    for (const p of this.peliculas()) {
      for (const pg of p.peliculas_generos ?? []) {
        if (!nombres.includes(pg.generos.nombre)) {
          nombres.push(pg.generos.nombre);
        }
      }
    }

    return nombres.sort();
  }

  // Se ejecuta al tocar un boton de genero 
  elegirGenero(nombre: string): void {
    this.generoElegido.set(nombre);
  }

  // Las 3 peliculas mas vendidas, de mayor a menor 
  // (solo cuentan las que vendieron algo)
  top3(): Pelicula[] {
    // [...] hace una copia de la lista para ordenarla sin modificar la original
    return [...this.peliculas()]
      .sort((a, b) => (b.ventas_totales ?? 0) - (a.ventas_totales ?? 0))
      .slice(0, 3)
      .filter(p => (p.ventas_totales ?? 0) > 0);
  }

  // filtrada solo por el genero elegido
  peliculasFiltradas(): Pelicula[] {
    const genero = this.generoElegido();

    return this.peliculas().filter(p =>
      genero === '' || (p.peliculas_generos ?? []).some(pg => pg.generos.nombre === genero)
    );
  }

  // Devuelve true si faltan 7 días o menos para el estreno
  // y tiene descuento configurado
  enPreventa(p: Pelicula): boolean {
    return estadoPreventa(p.fecha_estreno) === 'preventa' && (p.descuento_preventa ?? 0) > 0;
  }

  seleccionarPelicula(idPelicula?: string): void {
    if (idPelicula) {
      this.router.navigate(['/funciones', idPelicula]);
    }
  }
}