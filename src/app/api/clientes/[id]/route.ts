import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/db-normalizers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const cliente = await prisma.cliente.findUnique({
    where: { id: parseInt(params.id) },
    include: { garante: true, ventas: true, pagos: true },
  });

  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const totalVentas = cliente.ventas.reduce((a, v) => a + toNumber(v.total), 0);
  const totalPagosACuenta = cliente.ventas.reduce((a, v) => a + toNumber(v.pago_a_cuenta), 0);
  const totalPagos = cliente.pagos.reduce((a, p) => a + toNumber(p.monto), 0);
  const saldo_deudor = totalVentas - totalPagosACuenta - totalPagos;

  const { ventas, pagos, ...rest } = cliente;
  void ventas; void pagos;
  return NextResponse.json({
    ...rest,
    ingresos: cliente.ingresos ? toNumber(cliente.ingresos) : null,
    monto_autorizado: cliente.monto_autorizado ? toNumber(cliente.monto_autorizado) : null,
    garante: cliente.garante[0] ?? null,
    saldo_deudor,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { garante: garanteData, ...clienteData } = body;
  const id = parseInt(params.id);

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      nombre: clienteData.nombre,
      domicilio: clienteData.domicilio,
      localidad: clienteData.localidad,
      documento: clienteData.documento,
      telefono: clienteData.telefono,
      ingresos: clienteData.ingresos ? parseFloat(clienteData.ingresos) : null,
      lugar_trabajo: clienteData.lugar_trabajo,
      monto_autorizado: clienteData.monto_autorizado ? parseFloat(clienteData.monto_autorizado) : null,
    },
    include: { garante: true },
  });

  if (garanteData) {
    const garanteExistente = await prisma.garante.findFirst({
      where: { cliente_id: id },
      orderBy: { id: 'asc' },
    });

    await prisma.garante.upsert({
      where: { id: garanteExistente?.id ?? -1 },
      update: {
        nombre: garanteData.nombre,
        domicilio: garanteData.domicilio,
        localidad: garanteData.localidad,
        documento: garanteData.documento,
        telefono: garanteData.telefono,
        ingresos: garanteData.ingresos ? parseFloat(garanteData.ingresos) : null,
        lugar_trabajo: garanteData.lugar_trabajo,
      },
      create: {
        cliente_id: id,
        nombre: garanteData.nombre,
        domicilio: garanteData.domicilio,
        localidad: garanteData.localidad,
        documento: garanteData.documento,
        telefono: garanteData.telefono,
        ingresos: garanteData.ingresos ? parseFloat(garanteData.ingresos) : null,
        lugar_trabajo: garanteData.lugar_trabajo,
      },
    });
  }

  return NextResponse.json(cliente);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = parseInt(params.id);

  await prisma.$transaction([
    prisma.ventaItem.deleteMany({ where: { venta: { cliente_id: id } } }),
    prisma.venta.deleteMany({ where: { cliente_id: id } }),
    prisma.pagoCliente.deleteMany({ where: { cliente_id: id } }),
    prisma.garante.deleteMany({ where: { cliente_id: id } }),
    prisma.cliente.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
