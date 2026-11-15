export interface Resena {
  id: string;
  pelicula_id: string;
  usuario_id: string;
  nombre_autor: string;
  estrellas: number;
  comentario: string | null;
  creado: string;
}