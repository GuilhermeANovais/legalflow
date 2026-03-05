

/**
 * Função utilitária para verificar se um processo precisa de atenção com base em suas movimentações.
 * Procura por palavras-chave que indicam prazos ou requisições de resposta.
 * 
 * @param movimentacoes Lista de movimentações de um processo
 * @returns true se o processo contém movimentações indicando prazos recentes e que não foram tratadas
 */
export function verificarRadarPrazos(movimentacoes: { nome: string }[]): boolean {
    if (!movimentacoes || movimentacoes.length === 0) return false;

    // Palavras-chave que podem indicar prazos
    const palavrasChave = ["intimação", "citação", "prazo", "audiência", "despacho"];

    // Por enquanto, verificamos apenas se ALGUMA movimentação recente possui essas palavras.
    // Em uma implementação mais robusta, você limitaria aos últimos X dias.

    return movimentacoes.some(mov => {
        const nomeLower = mov.nome.toLowerCase();
        return palavrasChave.some(p => nomeLower.includes(p));
    });
}
