export interface Pelicula {
  id_pelicula?: string;
  titulo_de_pelicula: string;
  sinopsis_de_pelicula?: string;
  duracion_minutos: number;
  imagen_url?: string;
  restriccion_de_edad: number;
  esta_en_cartelera?: boolean;
}