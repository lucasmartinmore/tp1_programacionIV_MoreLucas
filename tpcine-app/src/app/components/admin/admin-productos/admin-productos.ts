import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProductoCandy } from '../../../models/candy';
import { CandyService } from '../../../services/candys';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-admin-productos',
  styleUrl: './admin-productos.css',
  templateUrl: './admin-productos.html',
})
export class AdminProductos implements OnInit {
  productos = signal<ProductoCandy[]>([]);
  cargando = signal<boolean>(true);
  errorMensaje = signal<string>('');

  constructor(private candyService: CandyService, private router: Router) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  async cargarProductos() {
    const resultado = await this.candyService.getProductosAdmin();
    this.productos.set(resultado.data || []);
    this.cargando.set(false);
  }

  nuevo() {
    this.router.navigate(['/admin/productos/nuevo']);
  }

  editar(id: string) {
    this.router.navigate(['/admin/productos', id, 'editar']);
  }

  async eliminar(producto: ProductoCandy) {
    const confirmado = confirm(`¿Eliminar "${producto.nombre_producto}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.errorMensaje.set('');
    const resultado = await this.candyService.eliminarProducto(producto.id_producto);

    if (resultado.error) {
      this.errorMensaje.set('No se pudo eliminar el producto. ¿Tenés rol de administrador?');
      return;
    }
    this.cargarProductos();
  }
}