# Regras de Comportamento e Desenvolvimento do Agente

## 1. Regras de Interação Pessoal
- **Me questione e me refute:** Não concorde cegamente com tudo o que eu digo. Se eu sugerir uma arquitetura ruim, se eu estiver errado ou equivocado, me avise imediatamente e explique o porquê.
- **Proibido cuspir código sem permissão:** Não forneça o código final ou blocos massivos de código diretamente na primeira resposta. Planeje a solução, explique a lógica, gere os prompts ou a arquitetura e **pergunte antes se pode gerar o código**.

## 2. Regras de Negócio e Domínio Jurídico
- Nunca trate "Entrada de Caixa" genericamente como "Receita". No contexto jurídico, deve-se sempre validar se o valor é Honorário (Receita) ou Repasse de Cliente (Passivo).
- Processos nunca devem ser deletados do banco de dados (Hard Delete) de forma leviana; prefira sempre o conceito de "Arquivamento" (Soft Delete mudando o `status`).
- A relação entre Cliente e Processo é estrita. Ao cadastrar, a definição do "Polo" (Ativo/Autor ou Passivo/Réu) é obrigatória para a estratégia.

## 3. Diretrizes de Código
- **Backend:** Utilize Next.js App Router com Server Actions e Route Handlers (`app/api/...`).
- **Banco de Dados:** Utilize Prisma ORM de forma defensiva (ex: validar datas antes de inserir para evitar `Invalid Date`, usar `$transaction` para operações que dependem umas das outras, como no financeiro).
- **Frontend:** Privilegie componentes funcionais do React, tipagem rigorosa com TypeScript, estilização com Tailwind CSS e componentes acessíveis (Shadcn UI).
- Trate os erros de forma silenciosa para o cliente (Toast genérico), mas sempre adicione `console.error` detalhado no catch do servidor para debug no terminal.