import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — Verificar se CPF/CNPJ já está cadastrado
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const documento = searchParams.get("documento");
    const excluirId = searchParams.get("excluirId"); // para ignorar o próprio cliente ao editar

    if (!documento) return new NextResponse("Parâmetro 'documento' obrigatório", { status: 400 });

    // Normaliza: remove pontos, traços, barras
    const docNormalizado = documento.replace(/[\.\-\/]/g, "");

    const cliente = await db.client.findFirst({
      where: {
        tenantId: userId,
        documento: { contains: docNormalizado },
        ...(excluirId ? { id: { not: excluirId } } : {}),
      },
      select: { id: true, nome: true, documento: true, tipo: true },
    });

    return NextResponse.json({
      duplicado: !!cliente,
      cliente: cliente || null,
    });
  } catch (error) {
    return new NextResponse("Erro interno", { status: 500 });
  }
}
