export interface Pelicula {
  id_pelicula?: string;
  titulo_de_pelicula: string;
  sinopsis_de_pelicula?: string;
  duracion_minutos: number;
  imagen_url?: string;
  restriccion_de_edad: number;
  esta_en_cartelera?: boolean;
  fecha_estreno?: string | null;
  descuento_preventa?: number;
  ventas_totales?: number;
  // Generos que trae la consulta 
  // con join (puede no venir)
  peliculas_generos?: { generos: { id_genero: number; nombre: string } }[];
}

// Los datos que se mandan a la base 
// al crear o editar (sin el id, que lo genera Supabase)
export interface DatosPelicula {
  titulo_de_pelicula: string;
  sinopsis_de_pelicula: string;
  duracion_minutos: number;
  imagen_url: string;
  restriccion_de_edad: number;
  esta_en_cartelera: boolean;
  fecha_estreno: string | null;
  descuento_preventa: number;
}