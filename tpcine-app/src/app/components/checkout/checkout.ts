import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Carrito } from '../../services/carrito';
import { Auth } from '../../services/auth';
import { CandyService } from '../../services/candys';
import { Compras } from '../../services/compras';
import { Cupones } from '../../services/cupones';
import { Funciones } from '../../services/funciones';
import { Recompensas } from '../../services/recompensas';
import { ListaEspera } from '../../services/lista-espera';
import { estadoPreventa } from '../../utils/preventa';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  enviando = signal<boolean>(false);
  errorMensaje = signal<string>('');

  funcion = signal<any>(null);// funcion + pelicula + sala
  hayUsuario = signal<boolean>(false);
  edad = signal<number | null>(null);
  cupon = signal<{ codigo: string; porcentaje: number; descripcion: string } | null>(null);
  canjesEntrada = signal<any[]>([]);     // entradas gratis canjeadas y sin usar
  usarCanje = signal<boolean>(false);    // si el usuario tildo "usar entrada gratis"
  credito = signal<number>(0);               // saldo de credito del usuario
  usarCredito = signal<boolean>(false);      // si tildo "usar mi crédito"
  idsComboConEntrada = signal<string[]>([]);      // ids de productos que incluyen entrada

  constructor(
    public carrito: Carrito,
    private auth: Auth,
    private candyService: CandyService,
    private compras: Compras,
    private cuponesService: Cupones,
    private funcionesService: Funciones,
    private recompensasService: Recompensas,
    private esperaService: ListaEspera,
    private router: Router
  ) {}

  async ngOnInit() {
    if (this.carrito.funcionId() === '') {
      return;
    }
    const resultadoCombos = await this.candyService.getCombosConEntrada();
    this.idsComboConEntrada.set((resultadoCombos.data || []).map((c: any) => c['id_producto']));

    const resultadoFuncion = await this.funcionesService.getFuncionDetalle(this.carrito.funcionId());
    this.funcion.set(resultadoFuncion.data);

    const resultadoUsuario = await this.auth.getUser();
    const usuario = resultadoUsuario.data.user;
    this.hayUsuario.set(usuario !== null);

    if (usuario) {
      await this.cargarDatosDelUsuario(usuario.id);
    }
  }

    // Calcula la edad, elige el mejor cupón que le corresponde y trae sus canjes
  private async cargarDatosDelUsuario(idUsuario: string) {
    const perfil = await this.auth.getPerfil(idUsuario);
    this.credito.set(Number(perfil.data?.['credito'] ?? 0));

    const fecha = perfil.data?.['fecha_de_nacimiento'];
    if (fecha) {
      this.edad.set(this.calcularEdad(fecha));
    }

    const resultadoCupones = await this.cuponesService.getTodosLosCupones();
    const cupones = (resultadoCupones.data || []).filter((c: any) => c['activo']);
    const cantidadCompras = await this.compras.contarComprasDelUsuario(idUsuario);

    // Reviso cada cupón activo: si le corresponde
    // me quedo con el de mayor porcentaje
    let mejor: any = null;
    for (const c of cupones) {
      let corresponde = false;

      if (c['condicion'] === 'PRIMERA_COMPRA') {
        corresponde = cantidadCompras === 0;
      } else if (c['condicion'] === 'EDAD_MINIMA') {
        corresponde = this.edad() !== null && this.edad()! > c['edad_minima'];
      } else if (c['condicion'] === 'GENERAL') {
        corresponde = true;
      }

      if (corresponde && (mejor === null || c['porcentaje'] > mejor['porcentaje'])) {
        mejor = c;
      }
    }

    if (mejor) {
      this.cupon.set({
        codigo: mejor['codigo'],
        porcentaje: mejor['porcentaje'],
        descripcion: mejor['descripcion'],
      });
    }

    const canjes = await this.recompensasService.getCanjesEntradaDisponibles(idUsuario);
    this.canjesEntrada.set(canjes.data || []);
  }

  private calcularEdad(fechaTexto: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaTexto);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumplio =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (aunNoCumplio) {
      edad--;
    }
    return edad;
  }

  // ---- Cosas que va a usar el HTML ----

  restriccion(): number {
    return this.funcion()?.peliculas?.restriccion_de_edad ?? 0;
  }

  hayVip(): boolean {
    return this.carrito.entradas().some(e => e.tipo === 'VIP');
  }

  alternarCanje() {
    this.usarCanje.set(!this.usarCanje());
  }

  // La entrada gratis descuenta el precio 
  // de la entrada MAS BARATA del carrito
  descuentoCanje(): number {
    const entradas = this.carrito.entradas();
    if (!this.usarCanje() || entradas.length === 0) {
      return 0;
    }
    return Math.min(...entradas.map(e => e.precio));
  }

  // Por cada combo con entrada en el carrito, la entrada más barata no se cobra
  // Ordeno precios de menor a mayor y descuento tantas entradas
  //  como combos con entrada haya comprado
  descuentoCombos(): number {
    let cantidadCombos = 0;
    for (const c of this.carrito.candys()) {
      if (this.idsComboConEntrada().includes(c.id_producto)) {
        cantidadCombos += c.cantidad;
      }
    }

    const precios = this.carrito.entradas().map(e => e.precio).sort((a, b) => a - b);
    let descuento = 0;
    for (let i = 0; i < cantidadCombos && i < precios.length; i++) {
      descuento += precios[i];
    }
    return descuento;
  }

  // Preventa de esta película (7 días antes del estreno)
  estadoPreventa(): 'antes' | 'preventa' | 'normal' {
    return estadoPreventa(this.funcion()?.peliculas?.fecha_estreno);
  }

  descuentoPreventa(): number {
    if (this.estadoPreventa() !== 'preventa') {
      return 0;
    }
    const porcentaje = this.funcion()?.peliculas?.descuento_preventa ?? 0;
    const entradas = this.carrito.entradas().reduce((suma, e) => suma + e.precio, 0);
    return Math.round(entradas * porcentaje / 100);
  }

  // El cupon se calcula sobre lo que queda despues del canje
  descuentoCupon(): number {
    const cupon = this.cupon();
    if (!cupon) {
      return 0;
    }
    return Math.round((this.carrito.total() - this.descuentoCanje()) * cupon.porcentaje / 100);
  }

  descuento(): number {
    return this.descuentoCanje() + this.descuentoCupon() + this.descuentoCombos() + this.descuentoPreventa();
  }

  alternarCredito() {
    this.usarCredito.set(!this.usarCredito());
  }

  // Total despues de cupon y entrada gratis
  // pero antes de usar credito
  totalSinCredito(): number {
    return Math.max(0, this.carrito.total() - this.descuento());
  }

  // El credito se usa hasta donde alcance
  // nunca mas de lo que falta pagar
  creditoAplicado(): number {
    if (!this.usarCredito()) {
      return 0;
    }
    return Math.min(this.credito(), this.totalSinCredito());
  }

  // Lo que se paga en plata
  totalFinal(): number {
    return this.totalSinCredito() - this.creditoAplicado();
  }

  // Texto de por que no se puede pagar ('' = se puede pagar)
  mensajeBloqueo(): string {
    if (this.estadoPreventa() === 'antes') {
      return 'La venta de esta película todavía no está habilitada (la preventa empieza 7 días antes del estreno).';
    }
    const r = this.restriccion();
    if (r === 0) {
      return '';
    }
    if (!this.hayUsuario()) {
      return 'Esta película es +' + r + ': iniciá sesión para verificar tu edad antes de comprar.';
    }
    if (this.edad() === null) {
      return 'No pudimos verificar tu edad. Revisá tu fecha de nacimiento en el perfil.';
    }
    if (this.edad()! < r) {
      return 'Esta película es +' + r + '. Debe comprar y asistir un adulto.';
    }
    return '';
  }

  async pagar() {
    this.errorMensaje.set('');

    if (this.mensajeBloqueo() !== '') {
      return;
    }

    // Si usa una entrada gratis
    // la marco como usada antes de cobrar 
    // (la funcion valida que sea suya)
    if (this.usarCanje() && this.canjesEntrada().length > 0) {
      const uso = await this.recompensasService.usarCanjeEntrada(this.canjesEntrada()[0]['id']);
      if (uso.error || !uso.data) {
        this.errorMensaje.set('No se pudo usar tu entrada gratis.');
        this.enviando.set(false);
        return;
      }
    }

    // Si usa credito, lo descuento antes de cobrar
    // (la funcion verifica que le alcance)
    const montoCredito = this.creditoAplicado();
    if (montoCredito > 0) {
      const uso = await this.compras.usarCredito(montoCredito);
      if (uso.error || !uso.data) {
        this.errorMensaje.set('No se pudo usar tu crédito.');
        this.enviando.set(false);
        return;
      }
    }

    this.enviando.set(true);

    // 1. Quien compra (puede ser nadie: compra anonima)
    const resultadoUsuario = await this.auth.getUser();
    const usuario = resultadoUsuario.data.user;

    // 2. Cabecera de la compra. El id lo genero yo para no tener que leer la fila de vuelta.
    const idCompra = crypto.randomUUID();
    const cupon = this.cupon();
    const funcionIdActual = this.carrito.funcionId();

    const resultadoCompra = await this.compras.crearCompra({
      id_compra_entrada: idCompra,
      usuario_id: usuario ? usuario.id : null,
      total_compra: this.totalFinal(),
      descuento: this.descuento(),
      cupon_aplicado: cupon ? cupon.codigo : null,
      estado_de_compra: 'COMPLETADA',
      credito_usado: montoCredito,
    });

    if (resultadoCompra.error) {
      this.errorMensaje.set('No se pudo crear la compra.');
      this.enviando.set(false);
      return;
    }

    // 3. Una entrada por butaca, con su codigo unico (el del QR)
    const itemsEntradas = this.carrito.entradas();
    const filasEntradas = itemsEntradas.map(e => ({
      compra_id: idCompra,
      funcion_id: funcionIdActual,
      butaca_id: e.butaca_id,
      qr_code_entrada: crypto.randomUUID(),
      precio_pagado: e.precio,
    }));

    const resultadoEntradas = await this.compras.crearEntradas(filasEntradas);

    if (resultadoEntradas.error) {
      // Lo mas probable: alguien compra una de esas butacas
      // justo antes (restriccion unica)
      this.errorMensaje.set('Alguna de las butacas ya fue vendida. Volvé a elegir tus asientos.');
      await this.compras.cancelarCompra(idCompra);   // si es anónimo RLS no lo deja; es inofensivo
      this.enviando.set(false);
      return;
    }

    // Si venía desde la lista de espera (turno NOTIFICADO)
    // marcamos su turno como COMPRADO
    if (usuario && funcionIdActual) {
      await this.esperaService.marcarComprado(funcionIdActual, usuario.id);
    }

    // 4. Detalle de candy
    const itemsCandy = this.carrito.candys();
    if (itemsCandy.length > 0) {
      const filasCandy = itemsCandy.map(c => ({
        compra_id: idCompra,
        producto_id: c.id_producto,
        cantidad: c.cantidad,
        precio_unitario: c.precio,
      }));
      await this.compras.crearCandy(filasCandy);
    }

    // 5. Armo el ticket. Cada entrada devuelta la relaciono con su butaca por butaca_id
    //(asi no dependo del orden en que vuelven las filas).
    const entradasCreadas = resultadoEntradas.data || [];
    const f = this.funcion();
    const restriccion = this.restriccion();

    this.carrito.guardarUltimaCompra({
      id_compra: idCompra,
      total: this.totalFinal(),
      descuento: this.descuento(),
      cupon: cupon ? cupon.descripcion + ' (' + cupon.porcentaje + '%)' : '',
      pelicula: f?.peliculas?.titulo_de_pelicula ?? '',
      sala: f?.salas?.nombre_de_sala ?? '',
      fecha: f?.fecha_hora_inicio ?? '',
      nota: restriccion > 0
        ? 'Película +' + restriccion + ': debe asistir un adulto. Se controlará la edad en el ingreso.'
        : '',
      entradas: entradasCreadas.map((fila: any) => {
        const item = itemsEntradas.find(e => e.butaca_id === fila['butaca_id']);
        return {
          butaca: item ? item.fila + item.columna : fila['butaca_id'],
          tipo: item ? item.tipo : '',
          qr: fila['qr_code_entrada'],
          precio: fila['precio_pagado'],
        };
      }),
      candys: itemsCandy,
    });

    this.carrito.vaciar();
    this.enviando.set(false);
    this.router.navigate(['/ticket']);
  }
}