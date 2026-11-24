import { Component, OnInit, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CandyService } from '../../../services/candys';
import { SubirImagen } from '../../subir-imagen/subir-imagen';

// Los datos que maneja el formulario
interface FormProducto {
  nombre_producto: string;
  descripcion_producto: string;
  precio_producto: number;
  categoria_producto: string;
  imagen_url: string;
  es_combo: boolean;
  incluye_entrada: boolean;
}

@Component({
  imports: [FormField, RouterLink, SubirImagen],
  selector: 'app-producto-form',
  styleUrl: './producto-form.css',
  templateUrl: './producto-form.html',
})
export class ProductoForm implements OnInit {
  productoModel = signal<FormProducto>({
    nombre_producto: '',
    descripcion_producto: '',
    precio_producto: 0,
    categoria_producto: '',
    imagen_url: '',
    es_combo: false, 
    incluye_entrada: false,
  });

  productoForm = form(this.productoModel, (schemaPath) => {
    required(schemaPath.nombre_producto, { message: 'El nombre es obligatorio' });
    min(schemaPath.precio_producto, 1, { message: 'El precio debe ser mayor a 0' });
    required(schemaPath.categoria_producto, { message: 'La categoría es obligatoria' });
    required(schemaPath.imagen_url, { message: 'La imagen es obligatoria' });
  });

  // Si hay un id en la ruta, es porque estoy editando
  idProducto = '';
  modoEdicion = signal<boolean>(false);
  categorias = signal<string[]>([]);
  mostrarErrores = signal<boolean>(false);
  errorMensaje = signal<string>('');
  enviando = signal<boolean>(false);

  constructor(
    private candyService: CandyService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarCategorias();

    this.idProducto = this.route.snapshot.params['id'] || '';

    if (this.idProducto) {
      this.modoEdicion.set(true);
      await this.cargarProducto();
    }
  }

  // Arma la lista de categorias que ya existen (sin repetir) para sugerirlas en el formulario
  async cargarCategorias() {
    const resultado = await this.candyService.getProductosAdmin();
    const lista: string[] = (resultado.data || []).map((p: any) => p['categoria_producto']);
    this.categorias.set(Array.from(new Set(lista)));
  }

  ponerImagen(url: string) {
    this.productoModel.update(m => ({ ...m, imagen_url: url }));
  }

  // Trae el producto de la base y completa el formulario
  async cargarProducto() {
    const resultado = await this.candyService.getProductoById(this.idProducto);

    if (resultado.error || !resultado.data) {
      this.errorMensaje.set('No se encontró el producto.');
      return;
    }

    const p = resultado.data;
    this.productoModel.set({
      nombre_producto: p['nombre_producto'],
      descripcion_producto: p['descripcion_producto'] ?? '',
      precio_producto: p['precio_producto'],
      categoria_producto: p['categoria_producto'],
      imagen_url: p['imagen_url'] ?? '',
      es_combo: p['es_combo'] ?? false,
      incluye_entrada: p['incluye_entrada'] ?? false,
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.productoForm().invalid()) {
      this.mostrarErrores.set(true);
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set('');

    const datos = this.productoModel();

    // Number(): por si el precio llega como texto desde el input
    const datosParaGuardar = {
      nombre_producto: datos.nombre_producto,
      descripcion_producto: datos.descripcion_producto,
      precio_producto: Number(datos.precio_producto),
      categoria_producto: datos.categoria_producto.trim(),
      imagen_url: datos.imagen_url,
      es_combo: datos.es_combo,
      incluye_entrada: datos.incluye_entrada,
    };

    const resultado = this.modoEdicion()
      ? await this.candyService.actualizarProducto(this.idProducto, datosParaGuardar)
      : await this.candyService.crearProducto(datosParaGuardar);

    this.enviando.set(false);

    if (resultado.error) {
      this.errorMensaje.set('No se pudo guardar el producto. ¿Tenés rol de administrador?');
      return;
    }

    this.router.navigate(['/admin/productos']);
  }
}