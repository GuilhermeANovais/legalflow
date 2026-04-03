import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// BUSCAR CLIENTES (GET)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const clientes = await db.client.findMany({
      where: { tenantId: userId },
      include: {
        documentos: {
          orderBy: { criadoEm: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clientes);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// CRIAR CLIENTE (POST)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { nome, documento, tipo, email, telefone, endereco } = body;

    if (!nome || !documento) {
      return new NextResponse("Dados incompletos", { status: 400 });
    }

    const novoCliente = await db.client.create({
      data: {
        tenantId: userId,
        nome,
        documento,
        tipo,
        email,
        telefone,
        endereco,
        status: "ATIVO"
      }
    });

    return NextResponse.json(novoCliente);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new NextResponse("Cliente com este CPF/CNPJ já está cadastrado.", { status: 409 });
    }
    console.log("[CLIENTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
