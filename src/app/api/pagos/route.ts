import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { cliente_id, monto, metodo_pago } = body;

  const pago = await prisma.pagoCliente.create({
    data: {
      cliente_id: parseInt(cliente_id),
      monto: parseFloat(monto),
      metodo_pago: metodo_pago || 'efectivo',
      fecha: new Date(),
    },
    include: { cliente: true },
  });

  return NextResponse.json({ id: pago.id, redirectUrl: `/comprobante-pago/${pago.id}` }, { status: 201 });
}
