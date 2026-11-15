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

  constructor(private cuponesService: Cupones) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const resultado = await this.cuponesService.getTodosLosCupones();
    this.cupones.set(resultado.data || []);
  }

  // Recibe lo que hay escrito en los campos de esa fila
  async guardar(cupon: any, porcentajeTexto: string, activo: boolean) {
    const porcentaje = Number(porcentajeTexto);

    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensaje.set('El porcentaje tiene que estar entre 0 y 100.');
      return;
    }

    const resultado = await this.cuponesService.actualizarCupon(cupon.codigo, porcentaje, activo);

    if (resultado.error) {
      this.mensaje.set('No se pudo guardar: ' + resultado.error.message);
    } else {
      this.mensaje.set('Cupón guardado.');
      await this.cargar();
    }
  }
}