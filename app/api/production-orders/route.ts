import { NextResponse } from 'next/server';
import { createProductionOrder } from '@/lib/production/orders';
import { productionOrderSchema } from '@/lib/production/schema';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = productionOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Dados invalidos para criar OP.',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const order = await createProductionOrder(parsed.data);

    return NextResponse.json({
      status: 'created',
      order,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao criar OP.',
      },
      { status: 500 }
    );
  }
}
