import { Component, OnInit, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Peliculas } from '../../../services/peliculas';

// Los datos que maneja el formulario
interface FormPelicula {
  titulo_de_pelicula: string;
  sinopsis_de_pelicula: string;
  duracion_minutos: number;
  imagen_url: string;
  restriccion_de_edad: string;
  esta_en_cartelera: boolean;
  fecha_estreno: string;
  descuento_preventa: number;
}

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-pelicula-form',
  styleUrl: './pelicula-form.css',
  templateUrl: './pelicula-form.html',
})
export class PeliculaForm implements OnInit {
  peliculaModel = signal<FormPelicula>({
    titulo_de_pelicula: '',
    sinopsis_de_pelicula: '',
    duracion_minutos: 90,
    imagen_url: '',
    restriccion_de_edad: '0',
    esta_en_cartelera: true,
    fecha_estreno: '',
    descuento_preventa: 0,
  });

  peliculaForm = form(this.peliculaModel, (schemaPath) => {
    required(schemaPath.titulo_de_pelicula, { message: 'El título es obligatorio' });
    required(schemaPath.sinopsis_de_pelicula, { message: 'La sinopsis es obligatoria' });
    min(schemaPath.duracion_minutos, 1, { message: 'La duración debe ser mayor a 0' });
    required(schemaPath.imagen_url, { message: 'La imagen es obligatoria' });
    min(schemaPath.descuento_preventa, 0, { message: 'Mínimo 0%' });
    max(schemaPath.descuento_preventa, 100, { message: 'Máximo 100%' });
  });

  // Si hay un id en la ruta, estamos editando
  idPelicula = '';
  modoEdicion = signal<boolean>(false);
  mostrarErrores = signal<boolean>(false);
  errorMensaje = signal<string>('');
  enviando = signal<boolean>(false);

  // Generos (van aparte del modelo del formulario
  // porque se guardan en otra tabla)
  generos = signal<any[]>([]);                    // todos los generos disponibles
  generosElegidos = signal<number[]>([]);         // ids tildados

  constructor(
    private peliculasService: Peliculas,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    // Cargo los generos disponibles
    // para armar los checkbox
    const resultadoGeneros = await this.peliculasService.getGeneros();
    this.generos.set(resultadoGeneros.data || []);

    this.idPelicula = this.route.snapshot.params['id'] || '';

    if (this.idPelicula) {
      this.modoEdicion.set(true);
      await this.cargarPelicula();

      // Si es edicion 
      // tildo los generos que la pelicula ya tiene
      const elegidos = await this.peliculasService.getGenerosDePelicula(this.idPelicula);
      this.generosElegidos.set((elegidos.data || []).map((fila: any) => fila['genero_id']));
    } else {
      // Si vengo de aceptar una propuesta en el admin
      // precargo título y sinopsis
      const q = this.route.snapshot.queryParamMap;
      if (q.get('titulo')) {
        this.peliculaModel.update((m) => ({
          ...m,
          titulo_de_pelicula: q.get('titulo')!,
          sinopsis_de_pelicula: q.get('sinopsis') ?? '',
        }));
      }
    }
  }

  // Traigo la pelicula de la base 
  // y completa el formulario
  async cargarPelicula() {
    const resultado = await this.peliculasService.getPeliculaById(this.idPelicula);

    if (resultado.error || !resultado.data) {
      this.errorMensaje.set('No se encontró la película.');
      return;
    }

    const p = resultado.data;
    this.peliculaModel.set({
      titulo_de_pelicula: p['titulo_de_pelicula'],
      sinopsis_de_pelicula: p['sinopsis_de_pelicula'] ?? '',
      duracion_minutos: p['duracion_minutos'],
      imagen_url: p['imagen_url'] ?? '',
      restriccion_de_edad: String(p['restriccion_de_edad']),
      esta_en_cartelera: p['esta_en_cartelera'],
      fecha_estreno: p['fecha_estreno'] ?? '',
      descuento_preventa: p['descuento_preventa'] ?? 0,
    });
  }

  // Si el genero ya estaba elegido lo saca
  // si no, lo agrega
  alternarGenero(idGenero: number) {
    const actuales = this.generosElegidos();
    if (actuales.includes(idGenero)) {
      this.generosElegidos.set(actuales.filter(id => id !== idGenero));
    } else {
      this.generosElegidos.set([...actuales, idGenero]);
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.peliculaForm().invalid()) {
      this.mostrarErrores.set(true);
      return;
    }

    this.enviando.set(true);
    this.errorMensaje.set('');

    const datos = this.peliculaModel();

    // Number(): el select devuelve texto ("13"), la base espera un numero
    const datosParaGuardar = {
      titulo_de_pelicula: datos.titulo_de_pelicula,
      sinopsis_de_pelicula: datos.sinopsis_de_pelicula,
      duracion_minutos: Number(datos.duracion_minutos),
      imagen_url: datos.imagen_url,
      restriccion_de_edad: Number(datos.restriccion_de_edad),
      esta_en_cartelera: datos.esta_en_cartelera,
      fecha_estreno: datos.fecha_estreno ? datos.fecha_estreno : null,
      descuento_preventa: Number(datos.descuento_preventa || 0),
    };

    let error: any = null;
    let idGuardada = this.idPelicula;

    if (this.modoEdicion()) {
      const resultado = await this.peliculasService.actualizarPelicula(this.idPelicula, datosParaGuardar);
      error = resultado.error;
    } else {
      const resultado = await this.peliculasService.crearPelicula(datosParaGuardar);
      error = resultado.error;
      if (resultado.data) {
        idGuardada = resultado.data['id_pelicula'];   // el id de la pelicula recien creada
      }
    }

    if (error) {
      this.enviando.set(false);
      this.errorMensaje.set('No se pudo guardar la película. ¿Tenés rol de administrador?');
      return;
    }

    // Con la pelicula ya guardada
    // guardo sus generos
    await this.peliculasService.guardarGeneros(idGuardada, this.generosElegidos());

    this.enviando.set(false);
    this.router.navigate(['/admin/peliculas']);
  }
}