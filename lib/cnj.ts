// lib/cnj.ts

export interface CnjMovimento {
  codigo: number;
  nome: string;
  dataHora: string; // ISO date string
}

export interface CnjDados {
  numeroProcesso: string;
  classeProcessual: string;
  assuntoPrincipal: string;
  tribunal: string;
  dataAjuizamento: string | null;
  orgaoJulgador: string;
  sistema: string;
  movimentos: CnjMovimento[];
  // Campos derivados para o formulário
  titulo: string;
  area: string;
  fase: string;
  valorCausa: number;
  prioridade: string;
}

export interface CnjResult {
  found: boolean;
  dados?: CnjDados;
  error?: string;
}

/**
 * Mapa completo de tribunais para a API pública do DataJud.
 * Formato da URL: https://api-publica.datajud.cnj.jus.br/api_publica_{sigla}/_search
 * O número CNJ segue: NNNNNNN-DD.AAAA.J.TR.OOOO
 *   - J (posição 13, 0-indexed no cleanNum): Ramo da Justiça
 *   - TR (posições 14-15): Tribunal
 */
function resolverTribunal(cleanNum: string): { apiUrl: string; sigla: string } {
  const justicaId = cleanNum.substring(13, 14); // 8=Estadual, 4=Federal, 5=Trabalho, etc.
  const tribunalId = cleanNum.substring(14, 16);

  // Justiça Estadual (J=8)
  const TJ_MAP: Record<string, string> = {
    "01": "tjac", "02": "tjal", "03": "tjap", "04": "tjam", "05": "tjba",
    "06": "tjce", "07": "tjdft", "08": "tjes", "09": "tjgo", "10": "tjma",
    "11": "tjmt", "12": "tjms", "13": "tjmg", "14": "tjpa", "15": "tjpb",
    "16": "tjpr", "17": "tjpe", "18": "tjpi", "19": "tjrj", "20": "tjrn",
    "21": "tjrs", "22": "tjro", "23": "tjrr", "24": "tjsc", "25": "tjse",
    "26": "tjsp", "27": "tjto",
  };

  // Justiça Federal (J=4)
  const TRF_MAP: Record<string, string> = {
    "01": "trf1", "02": "trf2", "03": "trf3", "04": "trf4", "05": "trf5", "06": "trf6",
  };

  // Justiça do Trabalho (J=5)
  const TRT_MAP: Record<string, string> = {
    "01": "trt1", "02": "trt2", "03": "trt3", "04": "trt4", "05": "trt5",
    "06": "trt6", "07": "trt7", "08": "trt8", "09": "trt9", "10": "trt10",
    "11": "trt11", "12": "trt12", "13": "trt13", "14": "trt14", "15": "trt15",
    "16": "trt16", "17": "trt17", "18": "trt18", "19": "trt19", "20": "trt20",
    "21": "trt21", "22": "trt22", "23": "trt23", "24": "trt24",
  };

  let sigla = "";

  if (justicaId === "8") {
    sigla = TJ_MAP[tribunalId] || "tjsp";
  } else if (justicaId === "4") {
    sigla = TRF_MAP[tribunalId] || "trf1";
  } else if (justicaId === "5") {
    sigla = TRT_MAP[tribunalId] || "trt1";
  } else if (justicaId === "9") {
    sigla = "stj";
  } else if (justicaId === "1") {
    sigla = "stf";
  } else {
    sigla = "tjsp"; // fallback
  }

  return {
    apiUrl: `https://api-publica.datajud.cnj.jus.br/api_publica_${sigla}/_search`,
    sigla: sigla.toUpperCase(),
  };
}

export async function consultarCNJ(numero: string): Promise<CnjResult> {
  const cleanNum = numero.replace(/\D/g, "");

  if (cleanNum.length < 20) {
    return { found: false, error: "Número de processo incompleto. Digite os 20 dígitos." };
  }

  const { apiUrl, sigla } = resolverTribunal(cleanNum);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==`,
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanNum,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao conectar com o Tribunal (${response.status})`);
    }

    const data = await response.json();

    // Verifica se encontrou algo
    if (!data.hits?.hits?.length || data.hits.total.value === 0) {
      return { found: false, error: "Processo não encontrado na base do CNJ." };
    }

    // Extração dos dados do _source
    const source = data.hits.hits[0]._source;

    const classeProcessual = source.classe?.nome || "Cível";
    const orgaoJulgador = source.orgaoJulgador?.nome || "Não informado";
    const dataAjuizamento = source.dataAjuizamento || null;
    const assuntos = source.assuntos?.map((a: any) => a.nome).join(", ") || "Geral";
    const assuntoPrincipal = source.assuntos?.[0]?.nome || "Não informado";
    const sistema = source.sistema?.nome || "Não informado";

    // Mapear movimentos
    const movimentos: CnjMovimento[] = (source.movimentos || []).map((mov: any) => ({
      codigo: mov.codigo || 0,
      nome: mov.nome || "Movimentação sem nome",
      dataHora: mov.dataHora || new Date().toISOString(),
    }));

    return {
      found: true,
      dados: {
        numeroProcesso: source.numeroProcesso || cleanNum,
        classeProcessual,
        assuntoPrincipal,
        tribunal: sigla,
        dataAjuizamento,
        orgaoJulgador,
        sistema,
        movimentos,
        // Campos derivados para formulário
        titulo: `${classeProcessual} - ${assuntos.substring(0, 50)}`,
        area: "Cível",
        fase: "Em Andamento",
        valorCausa: 0,
        prioridade: "Normal",
      },
    };
  } catch (error: any) {
    console.error("Erro CNJ:", error);
    return {
      found: false,
      error: error.message || "O sistema do Tribunal está indisponível no momento.",
    };
  }
}