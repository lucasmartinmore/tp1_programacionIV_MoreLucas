export interface Butaca {
  id_butaca: string;
  fila: string;
  columna: number;
  tipo: string;
}

export interface FilaSala {
  letra: string;
  butacas: Butaca[];
}