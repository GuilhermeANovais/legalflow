import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return new NextResponse("Sem chave de API configurada", { status: 500 });
  }

  // Fazemos uma chamada direta REST para o Google (bypassing a SDK para ter certeza)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await response.json();

  // Filtra apenas os modelos que servem para gerar texto (generateContent)
  const modelosUteis = data.models
    ?.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
    .map((m: any) => m.name.replace("models/", "")); // Limpa o prefixo para ficar fácil de ler

  return NextResponse.json({
    disponiveis: modelosUteis || [],
    bruto: data
  });
}