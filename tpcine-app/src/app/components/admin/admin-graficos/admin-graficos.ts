import { Component, OnInit, signal } from '@angular/core';
import { Reportes } from '../../../services/reportes';

// Una barra del gráfico
// un nombre y cuánto vale
interface Barra {
  nombre: string;
  valor: number;
}

@Component({
  selector: 'app-admin-graficos',
  styleUrl: './admin-graficos.css',
  templateUrl: './admin-graficos.html',
})
export class AdminGraficos implements OnInit {
  periodo = signal<'semana' | 'mes'>('semana');
  peliculas = signal<Barra[]>([]);
  productos = signal<Barra[]>([]);

  constructor(private reportes: Reportes) {}

  async ngOnInit() {
    await this.cargar();
  }

  async elegir(periodo: 'semana' | 'mes') {
    this.periodo.set(periodo);
    await this.cargar();
  }

  async cargar() {
    // Fecha desde la que cuento: hace 7 o 30 días
    const dias = this.periodo() === 'semana' ? 7 : 30;
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

    // Películas: cuento cada entrada por el título de su película
    const resultadoPeliculas = await this.reportes.getEntradasDesde(desde);
    const contadorPeliculas: Record<string, number> = {};

    for (const compra of (resultadoPeliculas.data || []) as any[]) {
      for (const entrada of compra['entradas'] || []) {
        const titulo = entrada['funciones']?.['peliculas']?.['titulo_de_pelicula'];
        if (titulo) {
          contadorPeliculas[titulo] = (contadorPeliculas[titulo] || 0) + 1;
        }
      }
    }
    this.peliculas.set(this.aBarras(contadorPeliculas));

    // Productos: sumo las cantidades vendidas por nombre
    const resultadoCandy = await this.reportes.getCandyDesde(desde);
    const contadorProductos: Record<string, number> = {};

    for (const fila of (resultadoCandy.data || []) as any[]) {
      const nombre = fila['productos_candy']?.['nombre_producto'];
      if (nombre) {
        contadorProductos[nombre] = (contadorProductos[nombre] || 0) + fila['cantidad'];
      }
    }
    this.productos.set(this.aBarras(contadorProductos));
  }

  // De { nombre: cantidad } a una lista ordenada de
  // mayor a menor, quedándome con las 5 primeras
  private aBarras(contador: Record<string, number>): Barra[] {
    return Object.entries(contador)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }

  // Ancho de la barra en porcentaje: la más grande
  // ocupa el 100% y las otras son proporcionales
  ancho(barra: Barra, lista: Barra[]): number {
    const maximo = lista.length > 0 ? lista[0].valor : 1;
    return Math.round((barra.valor / maximo) * 100);
  }
}