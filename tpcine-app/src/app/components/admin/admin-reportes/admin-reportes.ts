import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Reportes } from '../../../services/reportes';

// Una fila del reporte: un dia con su total
interface FilaReporte {
  dia: string;
  entradas: number;
  facturado: number;
}

@Component({
  imports: [CurrencyPipe],
  selector: 'app-admin-reportes',
  styleUrl: './admin-reportes.css',
  templateUrl: './admin-reportes.html',
})
export class AdminReportes implements OnInit {
  filas = signal<FilaReporte[]>([]);
  totalEntradas = signal<number>(0);
  totalFacturado = signal<number>(0);
  mensaje = signal<string>('');

  // Rango inicial: ultimos 30 días (en formato AAAA-MM-DD, el que usa <input type="date">)
  desde = this.fechaTexto(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  hasta = this.fechaTexto(new Date());

  constructor(private reportesService: Reportes) {}

  async ngOnInit() {
    await this.generar(this.desde, this.hasta);
  }

  // 'en-CA' escribe la fecha como AAAA-MM-DD, en hora local
  private fechaTexto(fecha: Date): string {
    return fecha.toLocaleDateString('en-CA');
  }

  async generar(desde: string, hasta: string) {
    this.mensaje.set('');

    if (desde === '' || hasta === '' || desde > hasta) {
      this.mensaje.set('Elegí un rango de fechas válido.');
      return;
    }

    const resultado = await this.reportesService.getComprasEnRango(desde, hasta);

    if (resultado.error) {
      this.mensaje.set('No se pudo generar el reporte. ¿Tenés rol de administrador?');
      return;
    }

    // Agrupo por dia: voy sumando en un objeto cuya clave es la fecha
    const porDia: Record<string, FilaReporte> = {};
    let sumaEntradas = 0;
    let sumaFacturado = 0;

    for (const compra of resultado.data || []) {
      const cantidad = (compra['entradas'] || []).length;

      // Una compra sin entradas (por ejemplo, la que fallo) no se cuenta
      if (cantidad === 0) {
        continue;
      }

      const dia = this.fechaTexto(new Date(compra['creado_dia']));

      if (!porDia[dia]) {
        porDia[dia] = { dia: dia, entradas: 0, facturado: 0 };
      }
      porDia[dia].entradas += cantidad;
      porDia[dia].facturado += Number(compra['total_compra']);

      sumaEntradas += cantidad;
      sumaFacturado += Number(compra['total_compra']);
    }

    // Object.values devuelve las filas; las ordeno por fecha
    const lista = Object.values(porDia).sort((a, b) => a.dia.localeCompare(b.dia));
    this.filas.set(lista);
    this.totalEntradas.set(sumaEntradas);
    this.totalFacturado.set(sumaFacturado);
  }
}