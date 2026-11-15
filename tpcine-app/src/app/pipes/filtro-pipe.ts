import { Pipe, PipeTransform } from '@angular/core';
import { Pelicula } from '../models/pelicula';

@Pipe({
  name: 'filtro',
})
export class FiltroPipe implements PipeTransform {
  transform(peliculas: Pelicula[], busqueda: string): Pelicula[] {
    if (!busqueda) {
      return peliculas;
    }
    return peliculas.filter(p =>
      p.titulo_de_pelicula.toLowerCase().includes(busqueda.toLowerCase())
    );
  }
}