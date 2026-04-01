import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientBalanceMaps } from '@/lib/client-balances';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: 'asc' },
  });
  const saldos = await getClientBalanceMaps(clientes.map((cliente) => cliente.id));

  const morosos = clientes
    .map((c) => {
      const saldo_deudor = saldos.get(c.id) ?? 0;
      return {
        id: c.id,
        nombre: c.nombre,
        documento: c.documento,
        telefono: c.telefono,
        saldo_deudor,
      };
    })
    .filter((c) => c.saldo_deudor > 0)
    .sort((a, b) => b.saldo_deudor - a.saldo_deudor);

  return NextResponse.json(morosos);
}
