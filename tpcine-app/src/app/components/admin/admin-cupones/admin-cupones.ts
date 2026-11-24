import { Component, OnInit, signal } from '@angular/core';
import { Cupones } from '../../../services/cupones';

@Component({
  selector: 'app-admin-cupones',
  styleUrl: './admin-cupones.css',
  templateUrl: './admin-cupones.html',
})
export class AdminCupones implements OnInit {
  cupones = signal<any[]>([]);
  mensaje = signal<string>('');

  // Campos del formulario de cupón nuevo
  nuevoCodigo = signal<string>('');
  nuevaDescripcion = signal<string>('');
  nuevoPorcentaje = signal<string>('10');
  nuevaCondicion = signal<string>('GENERAL');
  nuevaEdad = signal<string>('50');
  nuevoActivo = signal<boolean>(true);

  constructor(private cuponesService: Cupones) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const resultado = await this.cuponesService.getTodosLosCupones();
    this.cupones.set(resultado.data || []);
  }

  valorDe(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  checkedDe(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  // Texto que explica a quién
  // le corresponde cada cupón
  textoCondicion(cupon: any): string {
    if (cupon['condicion'] === 'PRIMERA_COMPRA') {
      return 'Primera compra';
    }
    if (cupon['condicion'] === 'EDAD_MINIMA') {
      return 'Mayores de ' + cupon['edad_minima'] + ' años';
    }
    return 'Todos los usuarios registrados';
  }

  // Cambia el porcentaje y/o activa
  // o desactiva un cupón que ya existe
  async guardar(cupon: any, porcentajeTexto: string, activo: boolean) {
    const porcentaje = Number(porcentajeTexto);

    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensaje.set('El porcentaje tiene que estar entre 0 y 100.');
      return;
    }

    const resultado = await this.cuponesService.actualizarCupon(cupon['codigo'], porcentaje, activo);

    if (resultado.error) {
      this.mensaje.set('No se pudo guardar: ' + resultado.error.message);
      return;
    }
    this.mensaje.set('Cupón guardado.');
    await this.cargar();
  }

  async crear() {
    this.mensaje.set('');

    // El código va en mayúsculas y sin
    // espacios (ej: "Dia del cine" -> DIA_DEL_CINE)
    const codigo = this.nuevoCodigo().trim().toUpperCase().replace(/\s+/g, '_');
    const porcentaje = Number(this.nuevoPorcentaje());
    const edad = Number(this.nuevaEdad());

    if (codigo === '' || this.nuevaDescripcion().trim() === '') {
      this.mensaje.set('Completá el código y la descripción.');
      return;
    }
    if (isNaN(porcentaje) || porcentaje < 1 || porcentaje > 100) {
      this.mensaje.set('El porcentaje tiene que estar entre 1 y 100.');
      return;
    }
    if (this.nuevaCondicion() === 'EDAD_MINIMA' && (isNaN(edad) || edad < 1)) {
      this.mensaje.set('Indicá la edad mínima.');
      return;
    }

    const resultado = await this.cuponesService.crearCupon({
      codigo: codigo,
      descripcion: this.nuevaDescripcion().trim(),
      porcentaje: porcentaje,
      condicion: this.nuevaCondicion(),
      edad_minima: this.nuevaCondicion() === 'EDAD_MINIMA' ? edad : null,
      activo: this.nuevoActivo(),
    });

    if (resultado.error) {
      // 23505 = ya existe un cupón 
      // con ese código (es la clave primaria)
      this.mensaje.set(
        resultado.error.code === '23505'
          ? 'Ya existe un cupón con ese código.'
          : 'No se pudo crear: ' + resultado.error.message
      );
      return;
    }

    this.mensaje.set('Cupón creado.');
    this.nuevoCodigo.set('');
    this.nuevaDescripcion.set('');
    this.nuevoPorcentaje.set('10');
    this.nuevaCondicion.set('GENERAL');
    this.nuevoActivo.set(true);
    await this.cargar();
  }

  async eliminar(cupon: any) {
    if (!confirm('¿Eliminar el cupón "' + cupon['codigo'] + '"?')) {
      return;
    }
    const resultado = await this.cuponesService.eliminarCupon(cupon['codigo']);
    this.mensaje.set(resultado.error ? 'No se pudo eliminar.' : 'Cupón eliminado.');
    await this.cargar();
  }
}