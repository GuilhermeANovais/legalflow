'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { consultarCNJ } from "@/lib/cnj";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Agora aceitamos o parâmetro 'modo'
export async function consultarIA(titulo: string, numero: string, fase: string, modo: 'CLIENTE' | 'JURIDICO') {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (modo === 'CLIENTE') {
      // PROMPT 1: Resumo Executivo (Rápido)
      prompt = `
        Você é um assistente jurídico. Gere um roteiro rápido para eu falar com o cliente.
        Processo: ${titulo} (Fase: ${fase})

        Responda EXATAMENTE neste formato:
        📋 **Resumo**: (1 frase simples sobre o que é o caso).
        🚦 **Status**: (Explique a fase atual para um leigo).
        🗣️ **O que falar**: (3 bullet points de orientações ou próximos passos).
      `;
    } else {
      // PROMPT 2: Pesquisa Jurídica (Artigos e Teses)
      prompt = `
        Aja como um advogado sênior especialista. Para a ação "${titulo}", forneça a fundamentação jurídica.
        
        Responda EXATAMENTE neste formato estruturado:
        
        ⚖️ **Base Legal Principal**
        (Liste 3 a 5 principais artigos de lei - ex: CPC, CC, CDC, Lei 8.213 - que fundamentam essa ação).

        📚 **Súmulas ou Jurisprudência**
        (Cite se existe alguma súmula do STF/STJ relevante para este tema).

        📝 **O que é Indispensável Alegar**
        (Liste 3 pontos cruciais que devem constar na petição ou defesa para não haver inépcia ou improcedência).
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Erro AI:", error);
    return "Não foi possível realizar a consulta. Tente novamente.";
  }
}

export async function analisarFinancas(dados: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analise estes lançamentos financeiros de um escritório de advocacia e aponte anomalias ou oportunidades de economia:
    ${dados}
    
    Seja direto e executivo.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Erro Finanças:", error);
    return "Erro na análise financeira.";
  }
}

export async function buscarDadosCNJ(numero: string) {
  try {
    const resultado = await consultarCNJ(numero);
    return resultado;
  } catch (error: any) {
    return { found: false as const, error: error.message };
  }
}

