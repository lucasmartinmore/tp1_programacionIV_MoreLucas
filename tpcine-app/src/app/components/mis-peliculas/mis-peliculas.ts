import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Compras } from '../../services/compras';
import { Resenas } from '../../services/resenas';
import { HoverZoomDirective } from '../../directivas/hover-zoom.directive';

// Una tarjeta del historial: una película con
// la fecha de su función más reciente
interface PeliculaVista {
  id: string;
  titulo: string;
  imagen: string;
  fecha: string;         // fecha_hora_inicio de la función más reciente
  estrellas: number;     // 0 = todavía no la calificaste
}

@Component({
  imports: [DatePipe, RouterLink, HoverZoomDirective],
  selector: 'app-mis-peliculas',
  styleUrl: './mis-peliculas.css',
  templateUrl: './mis-peliculas.html',
})
export class MisPeliculas implements OnInit {
  lista = signal<PeliculaVista[]>([]);
  cargando = signal<boolean>(true);

  constructor(private auth: Auth, private compras: Compras, private resenas: Resenas) {}

  async ngOnInit() {
    const usuario = (await this.auth.getUser()).data.user;
    if (!usuario) {
      this.cargando.set(false);
      return;
    }

    const resultadoCompras = await this.compras.getMisPeliculas(usuario.id);
    const resultadoResenas = await this.resenas.getMisResenas(usuario.id);

    // Armo un "diccionario"
    // id de película -> mis estrellas
    const misEstrellas: Record<string, number> = {};
    for (const r of resultadoResenas.data || []) {
      misEstrellas[r['pelicula_id']] = r['estrellas'];
    }

    // Una sola tarjeta por película, aunque haya comprado varias veces:
    // la clave del objeto es el id de la película y me quedo con la función más reciente
    const porPelicula: Record<string, PeliculaVista> = {};

    for (const compra of (resultadoCompras.data || []) as any[]) {
      for (const entrada of compra['entradas'] || []) {
        const funcion = entrada['funciones'];
        if (!funcion) {
          continue;
        }
        const peli = funcion['peliculas'];
        const actual = porPelicula[peli['id_pelicula']];

        if (!actual || funcion['fecha_hora_inicio'] > actual.fecha) {
          porPelicula[peli['id_pelicula']] = {
            id: peli['id_pelicula'],
            titulo: peli['titulo_de_pelicula'],
            imagen: peli['imagen_url'],
            fecha: funcion['fecha_hora_inicio'],
            estrellas: misEstrellas[peli['id_pelicula']] ?? 0,
          };
        }
      }
    }

    // Object.values devuelve la lista de tarjetas
    // las ordeno de la más reciente a la más vieja
    this.lista.set(Object.values(porPelicula).sort((a, b) => b.fecha.localeCompare(a.fecha)));
    this.cargando.set(false);
  }

  // Si la función todavía no pasó, la película
  // aparece como "Próxima" en vez de "Vista"
  esFutura(fecha: string): boolean {
    return new Date(fecha).getTime() > Date.now();
  }

  // 3 -> ★★★☆☆
  estrellas(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}