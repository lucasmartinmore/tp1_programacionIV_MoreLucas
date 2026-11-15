// Una butaca elegida en la sala, con el precio que le corresponde
export interface ItemEntrada {
  butaca_id: string;
  fila: string;
  columna: number;
  tipo: string;
  precio: number;
}

// Un producto de la candy bar con la cantidad elegida
export interface ItemCandy {
  id_producto: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

// Lo que se muestra en el ticket despues de pagar
export interface CompraRealizada {
  id_compra: string;
  total: number;
  descuento: number;
  cupon: string;                 // texto del cupon aplicado, o ''
  pelicula: string;
  sala: string;
  fecha: string;                 // fecha_hora_inicio de la función
  nota: string;                  // aviso de edad si corresponde
  entradas: { butaca: string; tipo: string; qr: string; precio: number }[];
  candys: ItemCandy[];
}