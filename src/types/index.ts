export interface Cliente {
  id: number;
  nombre: string;
  domicilio: string | null;
  localidad: string | null;
  documento: string | null;
  telefono: string | null;
  ingresos: number | null;
  lugar_trabajo: string | null;
  monto_autorizado: number | null;
  saldo_deudor?: number;
  garante?: Garante | null;
}

export interface Garante {
  id: number;
  nombre: string | null;
  domicilio: string | null;
  localidad: string | null;
  documento: string | null;
  telefono: string | null;
  ingresos: number | null;
  lugar_trabajo: string | null;
  cliente_id: number;
}

export interface VentaItem {
  id: number;
  venta_id: number;
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
  total: number;
}

export interface Venta {
  id: number;
  cliente_id: number;
  fecha: string;
  total: number;
  pago_a_cuenta: number;
  saldo_resultante: number;
  descripcion: string | null;
  metodo_pago: string;
  items?: VentaItem[];
  cliente?: Cliente;
}

export interface PagoCliente {
  id: number;
  cliente_id: number;
  fecha: string;
  monto: number;
  metodo_pago: string;
  cliente?: Cliente;
}

export interface Moroso {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  saldo_deudor: number;
}

export interface MovimientoItem {
  tipo: 'venta' | 'pago';
  id: number;
  fecha: string;
  total: number;
  pago_a_cuenta?: number;
  saldo_resultante?: number;
  metodo_pago: string;
  items?: VentaItem[];
}

export interface CajaData {
  total_ventas: number;
  total_ingresado: number;
  por_metodo: Record<string, number>;
  desde: string | null;
  hasta: string | null;
}
