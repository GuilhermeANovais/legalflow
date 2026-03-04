# Tech Stack Oficial - LegalFlow

## Frontend
- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes de UI:** Shadcn UI, Radix UI, Lucide React (Ícones)
- **Data Fetching:** Fetch API nativa / React Server Components

## Backend & Serviços
- **Framework:** Next.js (Server Actions e API Routes)
- **Autenticação:** Clerk (`@clerk/nextjs`)
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma Client (`@prisma/client`)
- **Inteligência Artificial:** Google Generative AI (Gemini SDK - `@google/generative-ai`)

## Infraestrutura e Deploy
- **Hospedagem:** Vercel (Requer `"postinstall": "prisma generate"` no `package.json`)
- **Controle de Versão:** Git / GitHub
