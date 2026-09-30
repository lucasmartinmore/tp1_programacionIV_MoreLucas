export interface Butaca {
  id_butaca: string;
  fila: string;
  columna: number;
  tipo: string;
  ocupada: boolean;
  seleccionada: boolean;
}

export interface FilaSala {
  letra: string;
  butacas: Butaca[];
}