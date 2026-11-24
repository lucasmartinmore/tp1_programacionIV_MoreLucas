export interface ProductoCandy {
  id_producto: string;
  nombre_producto: string;
  descripcion_producto: string;
  precio_producto: number;
  categoria_producto: string;
  imagen_url: string;
  es_combo?: boolean;
  incluye_entrada?: boolean;
}

// Los datos que se mandan a la base al crear o editar 
// (sin el id porque lo genera Supabase)
export interface DatosProducto {
  nombre_producto: string;
  descripcion_producto: string;
  precio_producto: number;
  categoria_producto: string;
  imagen_url: string;
  es_combo: boolean;
  incluye_entrada: boolean;
}