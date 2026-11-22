import { Component, OnInit, signal } from '@angular/core';
import { Propuestas } from '../../services/propuestas';

@Component({
  selector: 'app-proponer-pelicula',
  styleUrl: './proponer-pelicula.css',
  templateUrl: './proponer-pelicula.html',
})
export class ProponerPelicula implements OnInit {
  mias = signal<any[]>([]);
  mensaje = signal<string>('');

  constructor(private propuestas: Propuestas) {}

  async ngOnInit() {
    this.mias.set((await this.propuestas.getMias()).data || []);
  }

  async enviar(titulo: HTMLInputElement, sinopsis: HTMLTextAreaElement) {
    if (!titulo.value.trim()) {
      this.mensaje.set('El título es obligatorio.');
      return;
    }

    const r = await this.propuestas.crear(titulo.value.trim(), sinopsis.value.trim());
    if (r.error) {
      // 23505 = violó el índice único parcial en Postgres
      // ya tiene una pendiente
      this.mensaje.set(r.error.code === '23505' ? 'Ya tenés una propuesta pendiente.' : r.error.message);
      return;
    }

    this.mensaje.set('¡Propuesta enviada!');
    titulo.value = '';
    sinopsis.value = '';
    await this.ngOnInit();
  }
}