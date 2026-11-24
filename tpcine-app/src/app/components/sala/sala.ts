import { CurrencyPipe } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Asiento } from '../asiento/asiento';
import { ButacasService } from '../../services/butacas';
import { Butaca, FilaSala } from '../../models/butaca';
import { Carrito } from '../../services/carrito';
import { Auth } from '../../services/auth';
import { ListaEspera } from '../../services/lista-espera';

// Lo que se suma al precio de la función
// cuando la butaca es VIP (filas R, S y T)
const RECARGO_VIP = 2500;

// Minutos que dura la reserva del lugar (tiene que coincidir con ventana_espera() de la base)
const MINUTOS_ESPERA = 1;

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

  // Lista de espera
  totalButacas = signal<number>(0);
  libres = computed(() => Math.max(0, this.totalButacas() - this.idsOcupadas().length));
  miEspera = signal<any>(null);
  mensajeEspera = signal<string>('');
  textoVentana = MINUTOS_ESPERA === 1 ? '1 minuto' : MINUTOS_ESPERA + ' minutos';

  private funcionId = '';
  private usuarioId = '';
  private suscripcion?: Subscription;
  private temporizador?: any;

  constructor(
    private butacasService: ButacasService,
    private route: ActivatedRoute,
    private carrito: Carrito,
    private router: Router,
    private auth: Auth,
    private esperaService: ListaEspera
  ) {}

  async ngOnInit() {
    this.funcionId = this.route.snapshot.params['id'];
    const u = (await this.auth.getUser()).data.user;
    this.usuarioId = u?.id ?? '';

    if (this.funcionId) {
      await this.cargarSala();
      if (this.usuarioId) {
        await this.cargarMiEspera();
        // Cada 5 segundos: la base vence los turnos pasados / avisa al siguiente, y yo releo mi estado
        this.temporizador = setInterval(() => this.actualizarEspera(), 5000);
      }
    }
  }

  // Al salir de la pantalla cierro la suscripción al realtime y el temporizador
  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
    clearInterval(this.temporizador);
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

    this.totalButacas.set(butacas.length);
    this.armarFilas(butacas);
    this.cargando.set(false);

    // 3. Me suscribo para ver en vivo qué butacas se van ocupando
    this.escucharOcupadas();
  }

  /*=========================================
    =  Lista de espera                       =
    =========================================
  */

  async cargarMiEspera() {
    const r = await this.esperaService.miTurno(this.funcionId, this.usuarioId);
    this.miEspera.set(r.data);
  }

  // Le pide a la base que procese la cola
  //  y después vuelve a leer mi estado
  async actualizarEspera() {
    await this.esperaService.avanzarCola(this.funcionId);
    await this.cargarMiEspera();
  }

  esperando(): boolean {
    return this.miEspera()?.estado === 'ESPERANDO';
  }

  estoyNotificado(): boolean {
    return this.miEspera()?.estado === 'NOTIFICADO';
  }

  estoyVencido(): boolean {
    return this.miEspera()?.estado === 'EXPIRADO';
  }

  // Me puedo anotar si la sala está llena y no
  //  estoy ya esperando ni con el turno activo
  puedeAnotarse(): boolean {
    return this.libres() === 0 && !this.esperando() && !this.estoyNotificado();
  }

  // El panel se ve si la sala está llena, o si me avisaron,
  //  o si se me venció el turno
  mostrarPanelEspera(): boolean {
    return this.libres() === 0 || this.estoyNotificado() || this.estoyVencido();
  }

  async anotarmeEspera() {
    this.mensajeEspera.set('');
    if (!this.usuarioId) {
      this.router.navigate(['/login']);
      return;
    }

    // Si tenía una fila vieja (vencida o comprada)
    //  la borro para poder anotarme de nuevo
    if (this.miEspera()) {
      await this.esperaService.salir(this.miEspera().id_espera);
      this.miEspera.set(null);
    }

    const r = await this.esperaService.anotarme(this.funcionId, this.usuarioId);
    if (r.error) {
      this.mensajeEspera.set(r.error.message);
      return;
    }
    await this.cargarMiEspera();
  }

  async salirEspera() {
    if (!this.miEspera()) return;
    await this.esperaService.salir(this.miEspera().id_espera);
    this.miEspera.set(null);
  }

  /*=========================================
    =  Mapa de butacas                       =
    =========================================
  */

  armarFilas(asientos: Butaca[]) {
    const letrasFilas = Array.from(new Set(asientos.map(a => a.fila))).sort();
    const resultado: FilaSala[] = [];

    for (const letra of letrasFilas) {
      const asientosDeFila = asientos.filter(a => a.fila === letra);
      resultado.push({ letra, butacas: asientosDeFila });
    }

    this.filas.set(resultado);
  }

  // Cada vez que alguien compra una butaca el
  //  servicio emite la lista actualizada de ocupadas
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

  // Este método lo llama el hijo (Asiento)
  //  con (butacaClickeada)
  seleccionarButaca(butaca: Butaca) {
    if (this.estaOcupada(butaca)) return;

    if (this.estaElegida(butaca)) {
      this.butacasElegidas.set(this.butacasElegidas().filter(b => b.id_butaca !== butaca.id_butaca));
    } else {
      this.butacasElegidas.set([...this.butacasElegidas(), butaca]);
    }

    this.calcularPrecio();
  }

  // Precio de una butaca: el de
  //  la función más el recargo si es VIP
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

  // Guarda las butacas elegidas en
  //  el carrito y sigue a la candy bar
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