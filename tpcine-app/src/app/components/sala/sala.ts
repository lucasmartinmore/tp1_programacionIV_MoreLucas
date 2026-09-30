import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButacasService } from '../../services/butacas';
import { Butaca, FilaSala } from '../../models/butaca';

@Component({
  selector: 'app-sala',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink],
  templateUrl: './sala.html',
  styleUrl: './sala.css'
})
export class Sala implements OnInit {
  filas = signal<FilaSala[]>([]);
  butacasElegidas = signal<Butaca[]>([]);
  cargando = signal<boolean>(true);
  precioTotal = signal<number>(0);

  constructor(
    private butacasService: ButacasService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const funcionId = this.route.snapshot.params['id'];
    if (funcionId) {
      this.cargarDatos(funcionId);
    }
  }

  async cargarDatos(funcionId: string) {
    this.cargando.set(true);

    // Busca la sala de la funcíon
    const resultadoFuncion = await this.butacasService.getSalaDeLaFuncion(funcionId);

    if (resultadoFuncion.error || !resultadoFuncion.data) {
      console.error('No se encontró la función:', resultadoFuncion.error);
      this.cargando.set(false);
      return;
    }

    const salaId = resultadoFuncion.data['sala_id'];

    // Me traigo las butacas de esa sala y cuáles están ocupadas
    const [resultadoButacas, resultadoOcupadas] = await Promise.all([
      this.butacasService.getButacasDeLaSala(salaId),
      this.butacasService.getButacasOcupadasDeLaFuncion(funcionId)
    ]);

    const butacasCrudas = resultadoButacas.data || [];
    const idsOcupadas = (resultadoOcupadas.data || []).map(e => e['butaca_id']);

    // Transformo cada butaca de la tabla en el formato que
    // necesita mi interfaz Butaca, calculando tipo y ocupada acá mismo.
    const butacas: Butaca[] = butacasCrudas.map(b => ({
      id_butaca: b['id_butaca'],
      fila: b['fila_de_butaca'].trim(),
      columna: b['columna_de_butaca'],
      tipo: this.determinarTipoAsiento(b['fila_de_butaca'].trim()),
      ocupada: idsOcupadas.includes(b['id_butaca']),
      seleccionada: false
    }));

    this.armarFilas(butacas);
    this.cargando.set(false);
  }

  // J y K son accesibles, R/S/T son VIP, el resto es estándar.
  determinarTipoAsiento(fila: string): string {
    if (fila === 'J' || fila === 'K') return 'ACCESIBLE';
    if (fila === 'R' || fila === 'S' || fila === 'T') return 'VIP';
    return 'ESTANDAR';
  }

  armarFilas(asientos: Butaca[]) {
    const letrasFilas = Array.from(new Set(asientos.map(a => a.fila))).sort();
    const resultado: FilaSala[] = [];

    for (const letra of letrasFilas) {
      const asientosDeFila = asientos.filter(a => a.fila === letra);
      resultado.push({ letra, butacas: asientosDeFila });
    }

    this.filas.set(resultado);
  }

  seleccionarButaca(butaca: Butaca) {
    if (butaca.ocupada) return;
    butaca.seleccionada = !butaca.seleccionada;
    this.actualizarSeleccionadas();
    this.calcularPrecio();
  }

  actualizarSeleccionadas() {
    const elegidas: Butaca[] = [];
    for (const fila of this.filas()) {
      for (const b of fila.butacas) {
        if (b.seleccionada) elegidas.push(b);
      }
    }
    this.butacasElegidas.set(elegidas);
  }

  calcularPrecio() {
    let subtotal = 0;
    for (const b of this.butacasElegidas()) {
      subtotal += b.tipo === 'VIP' ? 7500 : 5000;
    }
    this.precioTotal.set(subtotal);
  }
}