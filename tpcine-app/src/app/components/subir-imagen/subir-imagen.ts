import { Component, input, output, signal } from '@angular/core';
import { Imagenes } from '../../services/imagenes';

@Component({
  selector: 'app-subir-imagen',
  styleUrl: './subir-imagen.css',
  templateUrl: './subir-imagen.html',
})
export class SubirImagen {
  // Datos que le manda el padre (el formulario)
  carpeta = input<string>('general');
  urlActual = input<string>('');

  // Aviso al padre cuando la imagen ya se subió
  urlSubida = output<string>();

  subiendo = signal<boolean>(false);
  mensaje = signal<string>('');

  constructor(private imagenes: Imagenes) {}

  async elegir(event: Event) {
    const campo = event.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    this.mensaje.set('');

    if (!archivo) {
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.mensaje.set('Solo se aceptan imágenes JPG, PNG o WEBP.');
      campo.value = '';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.mensaje.set('La imagen pesa más de 5 MB.');
      campo.value = '';
      return;
    }

    this.subiendo.set(true);
    const resultado = await this.imagenes.subir(archivo, this.carpeta());
    this.subiendo.set(false);
    campo.value = '';

    if (resultado.error) {
      this.mensaje.set('No se pudo subir: ' + resultado.error);
      return;
    }

    this.urlSubida.emit(resultado.url);
    this.mensaje.set('Imagen subida.');
  }
}