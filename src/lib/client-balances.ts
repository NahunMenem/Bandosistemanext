import { prisma } from './prisma';
import { toNumber } from './db-normalizers';

export async function getClientBalanceMaps(clienteIds?: number[]) {
  const ventaWhere = clienteIds ? { cliente_id: { in: clienteIds } } : {};
  const pagoWhere = clienteIds ? { cliente_id: { in: clienteIds } } : {};

  const [ventas, pagos] = await Promise.all([
    prisma.venta.groupBy({
      by: ['cliente_id'],
      where: ventaWhere,
      _sum: {
        total: true,
        pago_a_cuenta: true,
      },
    }),
    prisma.pagoCliente.groupBy({
      by: ['cliente_id'],
      where: pagoWhere,
      _sum: {
        monto: true,
      },
    }),
  ]);

  const saldos = new Map<number, number>();

  for (const venta of ventas) {
    if (venta.cliente_id == null) {
      continue;
    }

    saldos.set(
      venta.cliente_id,
      toNumber(venta._sum.total) - toNumber(venta._sum.pago_a_cuenta),
    );
  }

  for (const pago of pagos) {
    if (pago.cliente_id == null) {
      continue;
    }

    saldos.set(pago.cliente_id, (saldos.get(pago.cliente_id) ?? 0) - toNumber(pago._sum.monto));
  }

  return saldos;
}
