import { Component, OnInit, signal } from '@angular/core';
import { Recompensas } from '../../../services/recompensas';

@Component({
  selector: 'app-admin-recompensas',
  styleUrl: './admin-recompensas.css',
  templateUrl: './admin-recompensas.html',
})
export class AdminRecompensas implements OnInit {
  recompensas = signal<any[]>([]);
  mensaje = signal<string>('');

  constructor(private recompensasService: Recompensas) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const resultado = await this.recompensasService.getTodasLasRecompensas();
    this.recompensas.set(resultado.data || []);
  }

  // Cambia el costo o activa/desactiva una recompensa existente
  async guardar(recompensa: any, costoTexto: string, activo: boolean) {
    const costo = Number(costoTexto);

    if (isNaN(costo) || costo <= 0) {
      this.mensaje.set('El costo tiene que ser mayor a 0.');
      return;
    }

    const resultado = await this.recompensasService.actualizarRecompensa(recompensa['id'], costo, activo);
    this.mensaje.set(resultado.error ? 'No se pudo guardar.' : 'Guardado.');
    await this.cargar();
  }

  // Crea una recompensa nueva con lo que hay escrito en los campos
  async crear(nombre: string, tipo: string, costoTexto: string) {
    const costo = Number(costoTexto);

    if (nombre.trim() === '' || isNaN(costo) || costo <= 0) {
      this.mensaje.set('Completá el nombre y un costo mayor a 0.');
      return;
    }

    const resultado = await this.recompensasService.crearRecompensa({
      nombre: nombre.trim(),
      tipo: tipo,
      costo_puntos: costo,
    });

    this.mensaje.set(resultado.error ? 'No se pudo crear.' : 'Recompensa creada.');
    await this.cargar();
  }
}