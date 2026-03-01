# LegalFlow

O LegalFlow é um sistema moderno de gestão para escritórios de advocacia, desenvolvido para agilizar o acompanhamento de processos, a gestão de clientes e o controle financeiro de forma intuitiva e segura.

## 🚀 Tecnologias e Stack

- **Framework Frontend/Backend**: [Next.js](https://nextjs.org/) (React)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL com [Prisma ORM](https://www.prisma.io/)
- **Autenticação e Gestão de Usuários**: [Clerk](https://clerk.com/)
- **Estilização e Componentes**: Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) e Lucide Icons

## ⚙️ Funcionalidades Principais

- **Gestão de Clientes**: Cadastro rápido e detalhado de pessoas físicas e jurídicas. Suporte para criação inline de clientes diretamente do modal de processos.
- **Acompanhamento Processual**: Controle de processos e histórico de movimentações, arquitetado para oferecer integração com os sistemas do CNJ (Conselho Nacional de Justiça).
- **Fluxo de Arquivamento**: Desativação e arquivamento seguro de processos concluídos, registrando o desfecho e a data, além de bloqueio de edição de cards antigos.
- **Controle Financeiro**: Gestão completa das receitas (honorários, restituições) e despesas (custas, gastos operacionais). Módulo conta com funcionalidades progressivas de geração de relatórios de fechamento de mês (soft deletes de registros retroativos).
- **Segurança Robusta**: A API é protegida por `middlewares` de autenticação. Auditorias recentes de segurança (via TestSprite) validaram defesas sólidas nas rotas principais da API impedindo requisições não autorizadas (`401 Unauthorized`).
- **Arquitetura Multitenant**: Pronta para hospedar múltiplos bancos de dados virtuais, separando todos os dados sob o campo global `tenantId` nos modelos.

## 🛠️ Como executar localmente

### 1. Configuração do Repositório

Faça o clone do projeto para sua máquina:
```bash
git clone https://github.com/GuilhermeANovais/legalflow.git
cd legalflow
```

### 2. Instalação de dependências

Utilize de preferência o gerenciador de pacotes `npm`:
```bash
npm install
```

### 3. Configurar as variáveis de ambiente base

Você precisará de um arquivo `.env` configurado na raiz do projeto. Ele precisará conter os segredos de conexão ao banco e chaves de APIs (como o Clerk). Exemplo simplificado:

```env
# BANCO DE DADOS
DATABASE_URL="postgresql://user:password@localhost:5432/legalflow_db"
DIRECT_URL="postgresql://user:password@localhost:5432/legalflow_db"

# CLERK AUTH
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 4. Preparação do Banco de Dados

Aplique a estrutura de dados (Prisma Migrations) ao banco local:
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Executar aplicação

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O sistema estará rodando em [http://localhost:3000](http://localhost:3000).

## 🗄️ Estrutura da API Rest 

As rotas backend do framework se organizam em `/app/api/`:
- `/api/clientes`: Realiza CRUD de Clientes.
- `/api/processos`: Responsável por controle de processos, endpoints de arquivamento (`PATCH /api/processos`) e criação de transações correlatas.
- `/api/financeiro`: Responsável pelo livro-caixa, transações, receitas, despesas e consolidação dos relatórios contábeis de cada mês.

*(Nota: Toda rota exposta nesta API requer uso de headers de autenticação gerados por sessões válidas no Clerk)*.

## 📄 Licença e Observações

Este código e propriedade de software são de caráter privado e restrito, elaborados em benefício da resolução de problemas específicos de gestão de escritórios de advocacia do projeto LegalFlow.
