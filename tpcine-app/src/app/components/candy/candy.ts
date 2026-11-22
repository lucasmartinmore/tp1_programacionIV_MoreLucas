import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CandyService } from '../../services/candys';
import { Carrito } from '../../services/carrito';
import { ProductoCandy } from '../../models/candy';

@Component({
  selector: 'app-candy',
  imports: [RouterLink],
  templateUrl: './candy.html',
  styleUrl: './candy.css'
})
export class Candy implements OnInit {
  productos = signal<ProductoCandy[]>([]);
  cargando = signal<boolean>(true);

  // "public" para poder usar carrito.totalCandy() directo en el HTML
  constructor(private candyService: CandyService, public carrito: Carrito) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.candyService.getProductos().then(res => {
      this.productos.set(res.data || []);
      this.cargando.set(false);
    });
  }

  // Los combos van primero (destacados) después el resto
  //  cada grupo en su mismo orden
  productosOrdenados(): ProductoCandy[] {
    const combos = this.productos().filter(p => p.es_combo);
    const resto = this.productos().filter(p => !p.es_combo);
    return [...combos, ...resto];
  }

  // Cuántas unidades de este producto
  //  hay ya en el carrito (0 si no está)
  getCantidad(idProducto: string): number {
    const item = this.carrito.candys().find(c => c.id_producto === idProducto);
    return item ? item.cantidad : 0;
  }

  sumarProducto(prod: ProductoCandy): void {
    this.carrito.agregarCandy(prod);
  }

  restarProducto(prod: ProductoCandy): void {
    this.carrito.quitarCandy(prod.id_producto);
  }
}