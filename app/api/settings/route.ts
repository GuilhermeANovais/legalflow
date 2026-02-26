import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await req.json();
    const { nome } = body;

    if (!nome) {
      return new NextResponse("O nome é obrigatório", { status: 400 });
    }

    // Atualiza o escritório vinculado a este usuário
    const escritorio = await db.escritorio.update({
      where: { tenantId: userId },
      data: { nome },
    });

    return NextResponse.json(escritorio);
  } catch (error) {
    console.log("[SETTINGS_PATCH]", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
