import { Service } from '@angular/core';
import { CompraRealizada } from '../models/carrito';

// Paleta del cine, en formato [rojo, verde, azul]
const FONDO = [36, 26, 21];
const TEAL = [27, 107, 112];
const CARD = [15, 76, 85];
const AMARILLO = [245, 184, 46];
const NARANJA = [229, 64, 26];
const CREMA = [253, 243, 220];
const CELESTE = [143, 211, 214];
// Versiones apagadas para las formas del fondo (así parecen "transparentes")
const TEAL_OSCURO = [29, 58, 61];
const MOSTAZA_OSCURO = [110, 80, 25];
const ROJO_OSCURO = [90, 36, 24];

@Service()
export class Comprobantes {

  // Convierte un texto en una imagen QR (devuelve un "data URL" que va directo en un <img src>)
  async generarQr(texto: string): Promise<string> {
    // Import dinamico: la libreria se descarga recien cuando se la necesita
    const modulo: any = await import('qrcode');
    const QRCode = modulo.default ?? modulo;   // según cómo la empaquete el build
    return QRCode.toDataURL(texto, { width: 300, margin: 1 });
  }

  // ---------- Ayudas para pintar (cada una evita repetir 3 líneas) ----------
  private relleno(doc: any, c: number[]) { doc.setFillColor(c[0], c[1], c[2]); }
  private trazo(doc: any, c: number[]) { doc.setDrawColor(c[0], c[1], c[2]); }
  private texto(doc: any, c: number[]) { doc.setTextColor(c[0], c[1], c[2]); }

  // Fondo  + cabecera con el logo
  private fondoYCabecera(doc: any) {
    this.relleno(doc, FONDO);
    doc.rect(0, 0, 210, 297, 'F');

    // Formas decorativas (quedan en los márgenes, al costado del ticket)
    this.relleno(doc, TEAL_OSCURO);
    doc.triangle(4, 50, 30, 50, 4, 88, 'F');
    doc.circle(12, 232, 8, 'F');
    doc.triangle(206, 270, 206, 240, 182, 270, 'F');

    this.relleno(doc, MOSTAZA_OSCURO);
    doc.circle(198, 72, 9, 'F');
    this.trazo(doc, MOSTAZA_OSCURO);
    doc.setLineWidth(1.2);
    for (let i = 0; i < 6; i++) {          // zigzag
      const x1 = i % 2 === 0 ? 4 : 14;
      const x2 = i % 2 === 0 ? 14 : 4;
      doc.line(x1, 160 + i * 6, x2, 160 + (i + 1) * 6);
    }

    this.relleno(doc, ROJO_OSCURO);
    doc.rect(190, 150, 14, 14, 'F');

    // Cabecera teal con línea amarilla abajo
    this.relleno(doc, TEAL);
    doc.rect(0, 0, 210, 36, 'F');
    this.relleno(doc, AMARILLO);
    doc.rect(0, 36, 210, 2, 'F');

    // Logo, centrado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    const anchoCine = doc.getTextWidth('CINE');
    const anchoMore = doc.getTextWidth('MORE');
    const inicio = 105 - (anchoCine + anchoMore) / 2;
    this.texto(doc, FONDO);                           // sombra
    doc.text('CINE', inicio + 0.8, 22.8);
    doc.text('MORE', inicio + anchoCine + 0.8, 22.8);
    this.texto(doc, AMARILLO);
    doc.text('CINE', inicio, 22);
    this.texto(doc, NARANJA);
    doc.text('MORE', inicio + anchoCine, 22);

    doc.setFontSize(9);
    this.texto(doc, CREMA);
    doc.text('TU ENTRADA AL MEJOR CINE RETRO', 105, 31, { align: 'center' });
  }

  // Tarjeta del ticket
  private tarjeta(doc: any, y: number, alto: number) {
    this.relleno(doc, CARD);
    this.trazo(doc, AMARILLO);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([3, 2], 0);
    doc.roundedRect(20, y, 170, alto, 6, 6, 'FD');
    doc.setLineDashPattern([], 0);                    // vuelvo a línea continua
  }

  // Linea de perforación con las dos muescas redondas
  private perforacion(doc: any, y: number) {
    this.trazo(doc, CELESTE);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(28, y, 182, y);
    doc.setLineDashPattern([], 0);
    this.relleno(doc, FONDO);
    doc.circle(20, y, 5, 'F');
    doc.circle(190, y, 5, 'F');
  }

  // Un dato con su etiqueta chica arriba y el valor grande abajo
  private campo(doc: any, etiqueta: string, valor: string, x: number, y: number) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    this.texto(doc, CELESTE);
    doc.text(etiqueta, x, y);
    doc.setFontSize(13);
    this.texto(doc, CREMA);
    doc.text(valor, x, y + 7);
  }

  private pie(doc: any) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    this.texto(doc, CELESTE);
    doc.text('Gracias por elegir Cinemore · Presentá este comprobante en el ingreso', 105, 289, { align: 'center' });
  }

  // el QR necesita fondo claro para leerse)
  private cuadroQr(doc: any, qr: string, y: number) {
    this.relleno(doc, [255, 255, 255]);
    doc.roundedRect(65, y, 80, 80, 4, 4, 'F');
    doc.addImage(qr, 'PNG', 70, y + 5, 70, 70);
  }

  // ---------- PDF completo: una hoja por entrada + una de candy ----------
  async descargarPdf(compra: CompraRealizada) {
    const modulo = await import('jspdf');
    const doc: any = new modulo.jsPDF();               // A4 vertical: 210 x 297 mm

    const fechaObj = new Date(compra.fecha);
    const fecha = fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';

    let esLaPrimera = true;

    for (const entrada of compra.entradas) {
      if (!esLaPrimera) {
        doc.addPage();
      }
      esLaPrimera = false;

      const qr = await this.generarQr(entrada.qr);
      this.fondoYCabecera(doc);

      // El titulo puede ocupar 1 o 2 líneas: calculo el alto antes de dibujar la tarjeta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      const lineasTitulo: string[] = doc.splitTextToSize(compra.pelicula, 150);
      const finTitulo = 74 + (lineasTitulo.length - 1) * 9;
      const yDatos = finTitulo + 14;
      const yPerforacion = yDatos + 50;
      const bajoTarjeta = yPerforacion + 112;
      this.tarjeta(doc, 52, bajoTarjeta - 52 - 0);

      // Titulo de la película
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      this.texto(doc, CELESTE);
      doc.text('PELÍCULA', 105, 63, { align: 'center' });
      doc.setFontSize(20);
      this.texto(doc, AMARILLO);
      doc.text(lineasTitulo, 105, 74, { align: 'center' });

      // Datos en dos columnas
      this.campo(doc, 'SALA', compra.sala, 32, yDatos);
      this.campo(doc, 'BUTACA', entrada.butaca, 112, yDatos);
      this.campo(doc, 'FECHA', fecha, 32, yDatos + 18);
      this.campo(doc, 'HORA', hora, 112, yDatos + 18);
      this.campo(doc, 'PRECIO', '$' + entrada.precio, 32, yDatos + 36);
      this.campo(doc, 'TIPO', entrada.tipo === 'VIP' ? 'VIP' : 'ESTÁNDAR', 112, yDatos + 36);

      // Insignia VIP
      if (entrada.tipo === 'VIP') {
        this.relleno(doc, NARANJA);
        doc.roundedRect(150, yDatos + 36 - 4, 28, 10, 2, 2, 'F');
        doc.setFontSize(10);
        this.texto(doc, CREMA);
        doc.text('VIP', 164, yDatos + 36 + 2.5, { align: 'center' });
      }

      // Perforación y QR
      this.perforacion(doc, yPerforacion);
      this.cuadroQr(doc, qr, yPerforacion + 10);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      this.texto(doc, CREMA);
      doc.text(entrada.qr, 105, yPerforacion + 98, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      this.texto(doc, CELESTE);
      doc.text('Código único: sirve una sola vez.', 105, yPerforacion + 104, { align: 'center' });

      // Aviso de edad en un cartel naranja debajo de la tarjeta
      if (compra.nota) {
        const lineasNota: string[] = doc.splitTextToSize(compra.nota, 158);
        const altoNota = 8 + lineasNota.length * 5;
        this.relleno(doc, NARANJA);
        doc.roundedRect(20, bajoTarjeta + 6, 170, altoNota, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        this.texto(doc, CREMA);
        doc.text(lineasNota, 105, bajoTarjeta + 13, { align: 'center' });
      }

      this.pie(doc);
    }

    // Hoja de candy (si compro productos)
    if (compra.candys.length > 0) {
      doc.addPage();
      const qrCandy = await this.generarQr('CANDY:' + compra.id_compra);
      this.fondoYCabecera(doc);

      const altoLista = compra.candys.length * 10;
      const yQr = 92 + altoLista + 8;
      this.tarjeta(doc, 52, yQr + 80 + 14 - 52);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      this.texto(doc, AMARILLO);
      doc.text('CANDY BAR', 105, 70, { align: 'center' });
      doc.setFontSize(9);
      this.texto(doc, CELESTE);
      doc.text('RETIRÁ TU PEDIDO EN EL MOSTRADOR', 105, 78, { align: 'center' });

      let y = 92;
      for (const c of compra.candys) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        this.texto(doc, CREMA);
        doc.text(c.nombre, 32, y);
        doc.text('x' + c.cantidad, 178, y, { align: 'right' });
        this.trazo(doc, CELESTE);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(32, y + 3, 178, y + 3);
        doc.setLineDashPattern([], 0);
        y += 10;
      }

      this.cuadroQr(doc, qrCandy, yQr);
      this.pie(doc);
    }

    doc.save('entradas-cinemore.pdf');
  }
}