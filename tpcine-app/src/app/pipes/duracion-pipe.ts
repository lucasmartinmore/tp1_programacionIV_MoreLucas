import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duracion',
})
export class DuracionPipe implements PipeTransform {
  // 135 -> "2 h 15 min"   |   45 -> "45 min"
  transform(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (horas === 0) {
      return `${resto} min`;
    }
    return `${horas} h ${resto} min`;
  }
}