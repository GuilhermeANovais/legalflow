// Constantes jurídicas para o LegalFlow
// Usado nos selects de área e fase do processo

export type Rito = "COMUM" | "JEC";

export interface AreaConfig {
  fases: string[] | Record<Rito, string[]>;
  temRito?: boolean; // true = tem toggle JEC/Comum
}

export const AREAS_JURIDICAS: Record<string, AreaConfig> = {
  "Previdenciário": {
    fases: [
      "Requerimento Administrativo",
      "Fase Judicial - 1ª Instância",
      "Recursos Administrativos",
      "Recursal",
      "Execução"
    ]
  },
  "Trabalhista": {
    fases: [
      "Reclamação Trabalhista",
      "Audiência Inicial (Conciliação)",
      "Instrução",
      "Sentença",
      "Recursal (TRT)",
      "Recursal (TST)",
      "Execução"
    ]
  },
  "Penal/Criminal": {
    fases: [
      // Fase Pré-Processual
      "Inquérito Policial",
      "Audiência de Custódia",
      // Fase Processual
      "Denúncia/Queixa",
      "Recebimento e Citação",
      "Resposta à Acusação",
      "AIJ - Audiência de Instrução e Julgamento",
      "Alegações Finais",
      "Sentença",
      // Fase Recursal e Execução
      "Recursal",
      "Execução Penal"
    ]
  },
  "Cível": {
    temRito: true,
    fases: {
      COMUM: [
        "Postulatória (Petição Inicial / Citação)",
        "Saneamento",
        "Instrutória (Produção de Provas)",
        "Decisória (Sentença)",
        "Recursal",
        "Executória (Cumprimento de Sentença)"
      ],
      JEC: [
        "Petição Inicial",
        "Tentativa de Conciliação",
        "Instrução",
        "Sentença",
        "Recursal",
        "Execução"
      ]
    }
  },
  "Tributário": {
    fases: [
      "Fase Administrativa",
      "Impugnação / Recurso Administrativo",
      "Judicial - 1ª Instância",
      "Recursal",
      "Execução Fiscal"
    ]
  },
  "Família": {
    fases: [
      "Petição Inicial",
      "Mediação / Conciliação",
      "Instrução",
      "Sentença",
      "Recursal",
      "Cumprimento de Sentença"
    ]
  },
  "Empresarial": {
    fases: [
      "Consultivo / Assessoria",
      "Contencioso - 1ª Instância",
      "Recursal",
      "Execução"
    ]
  },
  "Consumidor": {
    temRito: true,
    fases: {
      COMUM: [
        "Petição Inicial",
        "Citação / Contestação",
        "Instrução",
        "Sentença",
        "Recursal",
        "Cumprimento de Sentença"
      ],
      JEC: [
        "Petição Inicial",
        "Audiência de Conciliação",
        "Instrução",
        "Sentença",
        "Recursal",
        "Execução"
      ]
    }
  },
  "Imobiliário": {
    fases: [
      "Petição Inicial",
      "Citação / Contestação",
      "Instrução",
      "Sentença",
      "Recursal",
      "Cumprimento de Sentença"
    ]
  },
};

export const AREAS_LIST = Object.keys(AREAS_JURIDICAS);

/**
 * Retorna as fases de uma área/rito específico.
 * Se a área não tiver rito, retorna o array direto.
 * Se tiver rito, retorna as fases do rito informado.
 */
export function getFases(area: string, rito: Rito = "COMUM"): string[] {
  const config = AREAS_JURIDICAS[area];
  if (!config) return ["Inicial"];

  if (Array.isArray(config.fases)) {
    return config.fases;
  }

  return config.fases[rito] || config.fases["COMUM"] || ["Inicial"];
}

export function temRito(area: string): boolean {
  return AREAS_JURIDICAS[area]?.temRito === true;
}

export const PRIORIDADES = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export const TIPOS_AUDIENCIA = [
  { value: "AUDIENCIA", label: "Audiência" },
  { value: "SESSAO", label: "Sessão de Julgamento" },
  { value: "OUTRO", label: "Outro" },
];
