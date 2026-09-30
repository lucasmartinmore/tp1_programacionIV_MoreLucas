import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CandyService } from '../../services/candys';
import { ProductoCandy } from '../../models/candy';

@Component({
  selector: 'app-candy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './candy.html',
  styleUrl: './candy.css'
})
export class Candy implements OnInit {
  productos = signal<ProductoCandy[]>([]);
  carrito = signal<Map<string, number>>(new Map());
  cargando = signal<boolean>(true);
  totalCandy = signal<number>(0);

  constructor(private candyService: CandyService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.candyService.getProductos().then(res => {
      this.productos.set(res.data || []);
      this.cargando.set(false);
    });
  }

  getCantidad(idProducto: string): number {
    return this.carrito().get(idProducto) || 0;
  }

  sumarProducto(prod: ProductoCandy): void {
    const mapaActual = new Map(this.carrito());
    const actual = mapaActual.get(prod.id_producto) || 0;
    mapaActual.set(prod.id_producto, actual + 1);
    this.carrito.set(mapaActual);
    this.actualizarTotal();
  }

  restarProducto(prod: ProductoCandy): void {
    const mapaActual = new Map(this.carrito());
    const actual = mapaActual.get(prod.id_producto) || 0;
    if (actual > 1) {
      mapaActual.set(prod.id_producto, actual - 1);
    } else {
      mapaActual.delete(prod.id_producto);
    }
    this.carrito.set(mapaActual);
    this.actualizarTotal();
  }

  private actualizarTotal(): void {
    let subtotal = 0;
    for (const prod of this.productos()) {
      const cant = this.carrito().get(prod.id_producto) || 0;
      subtotal += prod.precio_producto * cant;
    }
    this.totalCandy.set(subtotal);
  }
}