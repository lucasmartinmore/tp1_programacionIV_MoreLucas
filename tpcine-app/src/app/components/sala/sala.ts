import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute} from '@angular/router';
import { Subscription } from 'rxjs';
import { Asiento } from '../asiento/asiento';
import { ButacasService } from '../../services/butacas';
import { Butaca, FilaSala } from '../../models/butaca';
import { Carrito } from '../../services/carrito';

// Lo que se suma al precio de la función cuando la butaca es VIP (filas R, S y T)
const RECARGO_VIP = 2500;

@Component({
  imports: [Asiento, CurrencyPipe],
  selector: 'app-sala',
  styleUrl: './sala.css',
  templateUrl: './sala.html',
})
export class Sala implements OnInit, OnDestroy {
  filas = signal<FilaSala[]>([]);
  idsOcupadas = signal<string[]>([]);
  butacasElegidas = signal<Butaca[]>([]);
  cargando = signal<boolean>(true);
  precioBase = signal<number>(0);
  precioTotal = signal<number>(0);

  private funcionId = '';
  private suscripcion?: Subscription;

  constructor(
    private butacasService: ButacasService,
    private route: ActivatedRoute,
    private carrito: Carrito,
    private router: Router
  ) {}

  ngOnInit() {
    this.funcionId = this.route.snapshot.params['id'];
    if (this.funcionId) {
      this.cargarSala();
    }
  }

  // Al salir de la pantalla cierro la suscripción al realtime (igual que cosas-realtime de la cátedra)
  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }

  async cargarSala() {
    this.cargando.set(true);

    // 1. Datos de la función: de acá sale la sala y el precio base
    const resultadoFuncion = await this.butacasService.getFuncionById(this.funcionId);

    if (resultadoFuncion.error || !resultadoFuncion.data) {
      console.error('No se encontró la función:', resultadoFuncion.error);
      this.cargando.set(false);
      return;
    }

    const funcion = resultadoFuncion.data;
    this.precioBase.set(funcion['precio_base']);

    // 2. Las butacas físicas de esa sala
    const resultadoButacas = await this.butacasService.getButacasDeLaSala(funcion['sala_id']);

    const butacas: Butaca[] = (resultadoButacas.data || []).map((b: any) => ({
      id_butaca: b['id_butaca'],
      fila: b['fila_de_butaca'].trim(),
      columna: b['columna_de_butaca'],
      tipo: b['tipo_de_butaca'],
    }));

    this.armarFilas(butacas);
    this.cargando.set(false);

    // 3. Me suscribo para ver en vivo qué butacas se van ocupando
    this.escucharOcupadas();
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

  // Cada vez que alguien compra una butaca, el servicio emite la lista actualizada de ocupadas
  escucharOcupadas() {
    this.suscripcion = this.butacasService.getOcupadasRealtime(this.funcionId).subscribe({
      next: (ids) => {
        this.idsOcupadas.set(ids);

        // Si otra persona me ganó una butaca que yo ya había elegido, se la saco a mi selección
        const todaviaLibres = this.butacasElegidas().filter(b => !ids.includes(b.id_butaca));
        this.butacasElegidas.set(todaviaLibres);
        this.calcularPrecio();
      },
      error: (error) => console.error('Error de realtime:', error),
    });
  }

  estaOcupada(butaca: Butaca): boolean {
    return this.idsOcupadas().includes(butaca.id_butaca);
  }

  estaElegida(butaca: Butaca): boolean {
    return this.butacasElegidas().some(b => b.id_butaca === butaca.id_butaca);
  }

  // Los pasillos: filas comunes 4-20-4 (después de la columna 4 y la 24),
  // fila accesible 2-10-2 (después de la columna 2 y la 12)
  hayPasilloDespues(butaca: Butaca): boolean {
    if (butaca.tipo === 'ACCESIBLE') {
      return butaca.columna === 2 || butaca.columna === 12;
    }
    return butaca.columna === 4 || butaca.columna === 24;
  }

  // Este método lo llama el hijo (Asiento) con (butacaClickeada)
  seleccionarButaca(butaca: Butaca) {
    if (this.estaOcupada(butaca)) return;

    if (this.estaElegida(butaca)) {
      this.butacasElegidas.set(this.butacasElegidas().filter(b => b.id_butaca !== butaca.id_butaca));
    } else {
      this.butacasElegidas.set([...this.butacasElegidas(), butaca]);
    }

    this.calcularPrecio();
  }

  // Precio de una butaca: el de la función, más el recargo si es VIP
  precioDeButaca(butaca: Butaca): number {
    return butaca.tipo === 'VIP' ? this.precioBase() + RECARGO_VIP : this.precioBase();
  }

  calcularPrecio() {
    let subtotal = 0;
    for (const b of this.butacasElegidas()) {
      subtotal += this.precioDeButaca(b);
    }
    this.precioTotal.set(subtotal);
  }

   // Guarda las butacas elegidas en el carrito y sigue a la candy bar
  continuar() {
    const items = this.butacasElegidas().map(b => ({
      butaca_id: b.id_butaca,
      fila: b.fila,
      columna: b.columna,
      tipo: b.tipo,
      precio: this.precioDeButaca(b),
    }));

    this.carrito.guardarEntradas(this.funcionId, items);
    this.router.navigate(['/candy']);
  }
}