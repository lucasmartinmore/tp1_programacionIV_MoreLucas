import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Pelicula } from '../../../models/pelicula';
import { Peliculas } from '../../../services/peliculas';
import { Funciones } from '../../../services/funciones';

// Tiempo min entre el fin de una funcion y el inicio de la prox en la misma sala
const MARGEN_MINUTOS = 30;

@Component({
  imports: [CurrencyPipe, DatePipe],
  selector: 'app-admin-funciones',
  styleUrl: './admin-funciones.css',
  templateUrl: './admin-funciones.html',
})
export class AdminFunciones implements OnInit {
  // Datos que se traen de la base
  peliculas = signal<Pelicula[]>([]);
  salas = signal<any[]>([]);
  funciones = signal<any[]>([]);
  cargando = signal<boolean>(true);

  // Lo que elige el admin en el formulario
  peliculaElegida = signal<string>('');
  hora = signal<string>('18:00');
  formato = signal<string>('2D');
  idioma = signal<string>('Castellano');
  precio = signal<number>(8000);
  fechaDesde = signal<string>('');
  semanas = signal<number>(1);
  diasElegidos = signal<number[]>([]);

  // Filtro de la tabla de funciones (por película)
  filtroPelicula = signal<string>('');

  // Mensajes
  resultado = signal<string[]>([]);
  errorMensaje = signal<string>('');
  enviando = signal<boolean>(false);

  // Opciones fijas: horas de 30 en 30 minutos y dias de la semana.
  // El numero del dia es el de Date.getDay(): domingo = 0, lunes = 1, y asi
  horas: string[] = [];
  dias = [
    { numero: 1, letra: 'L', nombre: 'Lunes' },
    { numero: 2, letra: 'M', nombre: 'Martes' },
    { numero: 3, letra: 'X', nombre: 'Miércoles' },
    { numero: 4, letra: 'J', nombre: 'Jueves' },
    { numero: 5, letra: 'V', nombre: 'Viernes' },
    { numero: 6, letra: 'S', nombre: 'Sábado' },
    { numero: 0, letra: 'D', nombre: 'Domingo' },
  ];

  constructor(private peliculasService: Peliculas, private funcionesService: Funciones) {
    // Genera "10:00", "10:30", ... 
    for (let h = 10; h <= 23; h++) {
      this.horas.push(String(h).padStart(2, '0') + ':00');
      this.horas.push(String(h).padStart(2, '0') + ':30');
    }
    // La fecha de inicio arranca en hoy
    this.fechaDesde.set(this.fechaATexto(new Date()));
  }

  async ngOnInit() {
    const resultadoPeliculas = await this.peliculasService.getTodasLasPeliculas();
    this.peliculas.set(resultadoPeliculas.data || []);

    const resultadoSalas = await this.funcionesService.getSalas();
    this.salas.set(resultadoSalas.data || []);

    await this.cargarFunciones();
    this.cargando.set(false);
  }

  async cargarFunciones() {
    const resultado = await this.funcionesService.getFuncionesProximas();
    this.funciones.set(resultado.data || []);
  }

  /*=========================================
    =     Ayudas para el formulario         =
    =========================================
  */

  // Lee el valor de un input o select desde el evento
  valorDe(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  // Convierte una fecha a texto "2026-11-03" (el formato que usa <input type="date">)
  private fechaATexto(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  // Prende o apaga un dia de la semana
  alternarDia(numero: number) {
    if (this.diasElegidos().includes(numero)) {
      this.diasElegidos.set(this.diasElegidos().filter(d => d !== numero));
    } else {
      this.diasElegidos.set([...this.diasElegidos(), numero]);
    }
  }

  /*=========================================
    =       Programar funciones             =
    =========================================
  */

  async programar(event: Event) {
    event.preventDefault();
    this.errorMensaje.set('');
    this.resultado.set([]);

    const pelicula = this.peliculas().find(p => p.id_pelicula === this.peliculaElegida());

    if (!pelicula) {
      this.errorMensaje.set('Elegí una película.');
      return;
    }
    if (this.diasElegidos().length === 0) {
      this.errorMensaje.set('Elegí al menos un día de la semana.');
      return;
    }
    if (this.precio() <= 0) {
      this.errorMensaje.set('El precio debe ser mayor a 0.');
      return;
    }

    this.enviando.set(true);

    // 1. Armo todas las fechas en las que habria funcion
    const candidatas = this.armarCandidatas(pelicula.duracion_minutos);

    if (candidatas.length === 0) {
      this.errorMensaje.set('Con esos días y esa fecha no hay ninguna función futura para crear.');
      this.enviando.set(false);
      return;
    }

    // 2. Traigo las funciones que ya existen en ese periodo (de todas las salas)
    const margen = MARGEN_MINUTOS * 60000;
    const desde = new Date(candidatas[0].inicio.getTime() - margen).toISOString();
    const hasta = new Date(candidatas[candidatas.length - 1].fin.getTime() + margen).toISOString();
    const resultadoExistentes = await this.funcionesService.getFuncionesEnPeriodo(desde, hasta);
    const existentes: any[] = resultadoExistentes.data || [];

    // 3. Para cada fecha busco una sala libre
    const nuevas: any[] = [];
    const mensajes: string[] = [];

    for (const candidata of candidatas) {
      const etiqueta = candidata.inicio.toLocaleString('es-AR', {
        weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });

      const sala = this.buscarSalaLibre(candidata.inicio, candidata.fin, existentes);

      if (!sala) {
        mensajes.push(`${etiqueta} → sin sala disponible`);
        continue;
      }

      const fila = {
        pelicula_id: pelicula.id_pelicula,
        sala_id: sala['id_sala'],
        fecha_hora_inicio: candidata.inicio.toISOString(),
        fecha_hora_fin: candidata.fin.toISOString(),
        formato_funcion: this.formato(),
        idioma_funcion: this.idioma(),
        precio_base: this.precio(),
      };

      nuevas.push(fila);
      existentes.push(fila); // asi las proximas fechas ya cuentan con esta
      mensajes.push(`${etiqueta} → ${sala['nombre_de_sala']}`);
    }

    // 4. Guardo las que consiguieron sala
    if (nuevas.length > 0) {
      const resultadoInsert = await this.funcionesService.crearFunciones(nuevas);

      if (resultadoInsert.error) {
        this.errorMensaje.set('No se pudieron guardar las funciones. ¿Tenés rol de administrador?');
        this.enviando.set(false);
        return;
      }
    }

    this.resultado.set(mensajes);
    this.enviando.set(false);
    this.cargarFunciones();
  }

  // Devuelve la lista de { inicio, fin } para los días elegidos, desde la fecha de inicio
  private armarCandidatas(duracionMinutos: number) {
    const candidatas: { inicio: Date; fin: Date }[] = [];
    const ahora = new Date();
    const [horaTexto, minutoTexto] = this.hora().split(':');
    const base = new Date(this.fechaDesde() + 'T00:00:00');

    for (let i = 0; i < this.semanas() * 7; i++) {
      const dia = new Date(base);
      dia.setDate(base.getDate() + i);

      // Si ese dia de la semana no esta tildado, lo salteo
      if (!this.diasElegidos().includes(dia.getDay())) continue;

      const inicio = new Date(dia);
      inicio.setHours(Number(horaTexto), Number(minutoTexto), 0, 0);

      // No se programan funciones en el pasado
      if (inicio < ahora) continue;

      const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
      candidatas.push({ inicio, fin });
    }

    return candidatas;
  }

  // Prueba las salas en orden y devuelve la primera que no tenga ninguna funcion "pegada"
  private buscarSalaLibre(inicio: Date, fin: Date, existentes: any[]) {
    for (const sala of this.salas()) {
      const deEstaSala = existentes.filter(f => f['sala_id'] === sala['id_sala']);

      if (!this.haySolapamiento(inicio, fin, deEstaSala)) {
        return sala;
      }
    }
    return null;
  }

  // Conflicto = empieza antes de que termine la otra + margen, y termina despues de que empiece la otra - margen
  private haySolapamiento(inicio: Date, fin: Date, funcionesDeLaSala: any[]): boolean {
    const margen = MARGEN_MINUTOS * 60000;

    return funcionesDeLaSala.some(f => {
      const inicioExistente = new Date(f['fecha_hora_inicio']).getTime();
      const finExistente = new Date(f['fecha_hora_fin']).getTime();

      return inicio.getTime() < finExistente + margen && fin.getTime() + margen > inicioExistente;
    });
  }

  /*=========================================
    =        Lista de funciones             =
    =========================================
  */

  funcionesFiltradas(): any[] {
    const id = this.filtroPelicula();
    if (!id) {
      return this.funciones();
    }
    return this.funciones().filter(f => f['pelicula_id'] === id);
  }

  async eliminar(funcion: any) {
    const confirmado = confirm('¿Eliminar esta función?');
    if (!confirmado) return;

    this.errorMensaje.set('');
    const resultadoBorrado = await this.funcionesService.eliminarFuncion(funcion['id_funcion']);

    if (resultadoBorrado.error) {
      // Lo mas probable: ya hay entradas vendidas para esa función
      this.errorMensaje.set('No se pudo eliminar: probablemente ya tiene entradas vendidas.');
      return;
    }
    this.cargarFunciones();
  }
}