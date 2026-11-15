import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carrito } from '../../services/carrito';
import { Comprobantes } from '../../services/comprobantes';

@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink],
  selector: 'app-ticket',
  styleUrl: './ticket.css',
  templateUrl: './ticket.html',
})
export class Ticket implements OnInit {
  // Imagenes QR ya generadas: la clave es el codigo de la entrada
  qrs = signal<Record<string, string>>({});
  qrCandy = signal<string>('');
  generandoPdf = signal<boolean>(false);

  constructor(public carrito: Carrito, private comprobantes: Comprobantes) {}

  async ngOnInit() {
    const compra = this.carrito.ultimaCompra();
    if (!compra) {
      return;
    }

    // Genero un QR por cada entrada
    const mapa: Record<string, string> = {};
    for (const entrada of compra.entradas) {
      mapa[entrada.qr] = await this.comprobantes.generarQr(entrada.qr);
    }
    this.qrs.set(mapa);

    // Y uno para retirar la candy; el prefijo "CANDY:" le avisa al empleado de qué se trata
    if (compra.candys.length > 0) {
      this.qrCandy.set(await this.comprobantes.generarQr('CANDY:' + compra.id_compra));
    }
  }

  async descargarPdf() {
    const compra = this.carrito.ultimaCompra();
    if (!compra) {
      return;
    }
    this.generandoPdf.set(true);
    await this.comprobantes.descargarPdf(compra);
    this.generandoPdf.set(false);
  }
}