import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Butaca } from '../../models/butaca';

@Component({
  imports: [NgClass],
  selector: 'app-asiento',
  styleUrl: './asiento.css',
  templateUrl: './asiento.html',
})
export class Asiento {
  // Datos que le manda el padre
  butaca = input.required<Butaca>();
  ocupada = input<boolean>(false);
  seleccionada = input<boolean>(false);

  // Aviso que le manda al padre cuando hacen click
  butacaClickeada = output<Butaca>();

  elegir() {
    this.butacaClickeada.emit(this.butaca());
  }
}