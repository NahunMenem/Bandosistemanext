import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const desdeStr = searchParams.get('desde');
  const hastaStr = searchParams.get('hasta');

  const desde = desdeStr ? new Date(desdeStr + 'T00:00:00') : undefined;
  const hasta = hastaStr ? new Date(hastaStr + 'T23:59:59') : undefined;

  const dateFilter = desde || hasta
    ? { fecha: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } }
    : {};

  const [ventas, pagos] = await Promise.all([
    prisma.venta.findMany({ where: dateFilter }),
    prisma.pagoCliente.findMany({ where: dateFilter }),
  ]);

  const total_ventas = ventas.reduce((a, v) => a + toNumber(v.total), 0);
  const total_ingresado =
    ventas.reduce((a, v) => a + toNumber(v.pago_a_cuenta), 0) +
    pagos.reduce((a, p) => a + toNumber(p.monto), 0);

  const por_metodo: Record<string, number> = {};

  for (const v of ventas) {
    const pagoACuenta = toNumber(v.pago_a_cuenta);
    const metodo = v.metodo_pago || 'efectivo';
    if (pagoACuenta > 0) {
      por_metodo[metodo] = (por_metodo[metodo] || 0) + pagoACuenta;
    }
  }
  for (const p of pagos) {
    const metodo = p.metodo_pago || 'efectivo';
    por_metodo[metodo] = (por_metodo[metodo] || 0) + toNumber(p.monto);
  }

  return NextResponse.json({
    total_ventas,
    total_ingresado,
    por_metodo,
    desde: desdeStr,
    hasta: hastaStr,
  });
}
