import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';
import { getClientBalanceMaps } from '@/lib/client-balances';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    include: { garante: true },
    orderBy: { nombre: 'asc' },
  });
  const saldos = await getClientBalanceMaps(clientes.map((cliente) => cliente.id));

  const result = clientes.map((c) => {
    return {
      ...c,
      ingresos: c.ingresos ? toNumber(c.ingresos) : null,
      monto_autorizado: c.monto_autorizado ? toNumber(c.monto_autorizado) : null,
      garante: c.garante[0] ?? null,
      saldo_deudor: saldos.get(c.id) ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { garante: garanteData, ...clienteData } = body;

  const cliente = await prisma.cliente.create({
    data: {
      ...clienteData,
      ingresos: clienteData.ingresos ? parseFloat(clienteData.ingresos) : null,
      monto_autorizado: clienteData.monto_autorizado ? parseFloat(clienteData.monto_autorizado) : null,
      garante: garanteData?.nombre
        ? {
          create: {
              ...garanteData,
              ingresos: garanteData.ingresos ? parseFloat(garanteData.ingresos) : null,
            },
          }
        : undefined,
    },
    include: { garante: true },
  });

  return NextResponse.json({ ...cliente, garante: cliente.garante[0] ?? null }, { status: 201 });
}
