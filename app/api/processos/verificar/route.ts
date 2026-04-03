import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — Verificar se número de processo já existe
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const numero = searchParams.get("numero");

    if (!numero) return new NextResponse("Parâmetro 'numero' obrigatório", { status: 400 });

    const processo = await db.processo.findFirst({
      where: {
        tenantId: userId,
        numero: { equals: numero.trim() },
      },
      select: { id: true, titulo: true, numero: true, status: true, clienteId: true },
    });

    return NextResponse.json({
      duplicado: !!processo,
      processo: processo || null,
    });
  } catch (error) {
    return new NextResponse("Erro interno", { status: 500 });
  }
}
