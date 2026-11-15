import { Service, signal } from '@angular/core';
import { CompraRealizada, ItemCandy, ItemEntrada } from '../models/carrito';
import { ProductoCandy } from '../models/candy';

@Service()
export class Carrito {
  funcionId = signal<string>('');
  entradas = signal<ItemEntrada[]>([]);
  candys = signal<ItemCandy[]>([]);
  ultimaCompra = signal<CompraRealizada | null>(null);

  constructor() {
    // Si habia un ticket guardado de una compra anterior, lo recupero
    try {
      const guardado = localStorage.getItem('ultimaCompra');
      if (guardado) {
        this.ultimaCompra.set(JSON.parse(guardado));
      }
    } catch {
      // si localStorage no esta disponible, no recupero nada
    }
  }

  // Muestra el ticket y ademas lo guardo en el navegador
  guardarUltimaCompra(compra: CompraRealizada) {
    this.ultimaCompra.set(compra);
    try {
      localStorage.setItem('ultimaCompra', JSON.stringify(compra));
    } catch {
      // sin localStorage la app funciona igual, solo que no recuerda el ticket al recargar
    }
  }

  // La Sala llama a esto con las butacas elegidas
  guardarEntradas(funcionId: string, entradas: ItemEntrada[]) {
    this.funcionId.set(funcionId);
    this.entradas.set(entradas);
  }

  // Si el producto ya está, suma 1 a la cantidad; si no, lo agrega
  agregarCandy(producto: ProductoCandy) {
    const actuales = this.candys();
    const existente = actuales.find(c => c.id_producto === producto.id_producto);

    if (existente) {
      this.candys.set(actuales.map(c =>
        c.id_producto === producto.id_producto ? { ...c, cantidad: c.cantidad + 1 } : c
      ));
    } else {
      this.candys.set([...actuales, {
        id_producto: producto.id_producto,
        nombre: producto.nombre_producto,
        precio: producto.precio_producto,
        cantidad: 1,
      }]);
    }
  }

  // Resta 1; si llega a 0, el producto sale del carrito
  quitarCandy(idProducto: string) {
    const actualizados = this.candys()
      .map(c => c.id_producto === idProducto ? { ...c, cantidad: c.cantidad - 1 } : c)
      .filter(c => c.cantidad > 0);
    this.candys.set(actualizados);
  }

  quitarEntrada(butacaId: string) {
    this.entradas.set(this.entradas().filter(e => e.butaca_id !== butacaId));
  }

  totalEntradas(): number {
    let total = 0;
    for (const e of this.entradas()) {
      total += e.precio;
    }
    return total;
  }

  totalCandy(): number {
    let total = 0;
    for (const c of this.candys()) {
      total += c.precio * c.cantidad;
    }
    return total;
  }

  total(): number {
    return this.totalEntradas() + this.totalCandy();
  }

  cantidadItems(): number {
    return this.entradas().length + this.candys().length;
  }

  vaciar() {
    this.funcionId.set('');
    this.entradas.set([]);
    this.candys.set([]);
  }

    // Se usa al cerrar sesion: deja el carrito y el ultimo ticket vacios
  limpiarTodo() {
    this.vaciar();
    this.ultimaCompra.set(null);
    try {
      localStorage.removeItem('ultimaCompra');
    } catch {
      // si no hay localStorage no hay nada que borrar
    }
  }
}