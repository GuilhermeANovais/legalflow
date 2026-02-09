// lib/cnj.ts

export async function consultarCNJ(numero: string) {
  // 1. Limpeza do número (remove pontos, traços, etc)
  const cleanNum = numero.replace(/\D/g, "");

  if (cleanNum.length < 20) {
    throw new Error("Número de processo incompleto. Digite os 20 dígitos.");
  }

  // 2. Identificar o Tribunal pelo número CNJ
  // Ex: 0000000-00.0000.8.26.0000 -> O "26" indica TJSP
  // A API do DataJud é separada por tribunal. Vamos tentar o TJSP como padrão
  // ou implementar uma lógica para descobrir a URL correta baseada no dígito J.TR.
  
  const tribunalId = cleanNum.substring(13, 15); // Pega o dígito do tribunal (ex: 26)
  const regiaoId = cleanNum.substring(11, 12); // Justiça Estadual (8), Federal (4), Trabalho (5)

  let apiUrl = "";
  let tribunalNome = "";

  // Mapeamento Básico de Tribunais (Expansível)
  if (regiaoId === "8" && tribunalId === "26") {
    apiUrl = "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search";
    tribunalNome = "TJSP";
  } else if (regiaoId === "8" && tribunalId === "19") {
    apiUrl = "https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search";
    tribunalNome = "TJRJ";
  } else {
    // Fallback: Tenta a API Geral ou retorna erro se for muito específico
    // Por enquanto, vamos focar no TJSP para teste, mas avisar se for outro
    // Para produção total, precisaríamos de um switch case gigante para todos os tribunais
    // ou usar a API global do DataJud (que é mais lenta).
    apiUrl = "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search"; 
    tribunalNome = "Tribunal (Genérico)";
  }

  try {
    // 3. Chamada Real ao DataJud (Elasticsearch Query)
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==` // Chave Pública do CNJ (DataJud)
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanNum
          }
        }
      })
    });

    if (!response.ok) {
        throw new Error(`Erro ao conectar com o Tribunal (${response.status})`);
    }

    const data = await response.json();

    // 4. Verifica se encontrou algo
    if (data.hits.total.value === 0) {
      return { found: false, error: "Processo não encontrado na base do CNJ." };
    }

    // 5. Extração e Tratamento dos Dados (O JSON do CNJ é complexo)
    const processo = data.hits.hits[0]._source;
    
    // Tenta pegar a classe processual (ex: Procedimento Comum)
    const classe = processo.classe?.nome || "Cível";
    
    // Tenta pegar os assuntos (ex: Dano Moral)
    const assuntos = processo.assuntos?.map((a: any) => a.nome).join(", ") || "Geral";
    
    // Tenta pegar a última movimentação
    const ultimaMov = processo.movimentos?.[0]?.nome || "Sem movimentação recente";
    
    // Formata a resposta para nosso sistema
    return {
      found: true,
      dados: {
        titulo: `${classe} - ${assuntos.substring(0, 50)}...`, // Cria um título automático
        area: "Cível", // O CNJ não dá "Cível" limpo, mas podemos inferir
        fase: "Em Andamento", // Difícil saber a fase exata sem analisar movimentos
        valorCausa: 0, // O DataJud muitas vezes não traz o valor da causa público
        prioridade: "Normal",
        parteContraria: "Réu não identificado", // Proteção de dados muitas vezes esconde nomes
        tribunal: tribunalNome,
        ultimaMovimentacao: ultimaMov
      }
    };

  } catch (error: any) {
    console.error("Erro CNJ:", error);
    // Fallback gracioso: Se a API falhar, não quebra o app, avisa o usuário
    return { found: false, error: "O sistema do Tribunal está indisponível no momento." };
  }
}