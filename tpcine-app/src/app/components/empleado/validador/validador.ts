import { Component, signal } from '@angular/core';
import { Validaciones } from '../../../services/validaciones';

@Component({
  selector: 'app-validador',
  styleUrl: './validador.css',
  templateUrl: './validador.html',
})
export class Validador {
  resultado = signal<{ ok: boolean; mensaje: string } | null>(null);
  validando = signal<boolean>(false);

  constructor(private validaciones: Validaciones) {}

  async validar(texto: string, campo: HTMLInputElement) {
    const codigo = texto.trim();
    if (codigo === '') {
      return;
    }

    this.validando.set(true);
    this.resultado.set(await this.validaciones.validar(codigo));
    this.validando.set(false);

    // Dejo el campo vacio y con foco para el siguiente codigo
    campo.value = '';
    campo.focus();
  }
}